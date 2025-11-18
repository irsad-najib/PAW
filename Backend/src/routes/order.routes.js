const express = require("express");
const router = express.Router();
const Order = require("../models/order.model");
const Menu = require("../models/menu.model");
const User = require("../models/user.model");
const authenticateToken = require("../middleware/JWT");
const axios = require("axios");

const FONNTE_API_URL = "https://api.fonnte.com/send";
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

async function sendWhatsAppNotification(phone, message) {
  try {
    if (!FONNTE_TOKEN) {
      console.warn("FONNTE_TOKEN not configured, skipping WhatsApp notification");
      return null;
    }
    const response = await axios.post(
      FONNTE_API_URL,
      { target: phone, message: message },
      { headers: { Authorization: FONNTE_TOKEN } }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to send WhatsApp notification:", error.response?.data || error.message);
    return null;
  }
}

function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }
  next();
}

router.get("/", authenticateToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Order.find({ userId: req.auth.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("items.menuId"),
      Order.countDocuments({ userId: req.auth.userId }),
    ]);
    res.json({ page, limit, total, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/admin/summary", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const orders = await Order.find({
      orderDates: { $elemMatch: { $gte: startOfDay, $lte: endOfDay } }
    }).populate("items.menuId userId");
    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
      byStatus: {},
      byPaymentStatus: {},
      byDeliveryTime: {},
    };
    orders.forEach(order => {
      summary.byStatus[order.orderStatus] = (summary.byStatus[order.orderStatus] || 0) + 1;
      summary.byPaymentStatus[order.paymentStatus] = (summary.byPaymentStatus[order.paymentStatus] || 0) + 1;
      summary.byDeliveryTime[order.deliveryTime] = (summary.byDeliveryTime[order.deliveryTime] || 0) + 1;
    });
    res.json({ date: targetDate.toISOString(), summary, orders });
  } catch (e) {
    console.error("Error fetching order summary:", e);
    res.status(500).json({ message: e.message });
  }
});

router.get("/admin", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("items.menuId userId"),
      Order.countDocuments(),
    ]);
    res.json({ page, limit, total, items });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/group/:groupId", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const orders = await Order.find({ groupId }).sort({ createdAt: 1 }).populate("items.menuId");
    if (!orders.length) return res.status(404).json({ message: "Group not found" });
    const allOwned = orders.every((o) => String(o.userId) === req.auth.userId);
    if (!allOwned && req.auth.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const paymentStatuses = [...new Set(orders.map((o) => o.paymentStatus))];
    const paymentMethod = orders[0].paymentMethod;
    const totals = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    return res.json({ groupId, count: orders.length, paymentMethod, paymentStatuses, totalAmount: totals, orders });
  } catch (e) {
    console.error("Error fetching group orders:", e);
    return res.status(500).json({ message: e.message });
  }
});

router.patch("/group/:groupId/payment", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { action } = req.body || {};
    if (action !== "markPaid") {
      return res.status(400).json({ message: "Invalid action" });
    }
    const orders = await Order.find({ groupId });
    if (!orders.length) {
      return res.status(404).json({ message: "Group not found" });
    }
    const methodSet = new Set(orders.map((o) => o.paymentMethod));
    if (methodSet.size !== 1) {
      return res.status(400).json({ message: "Mixed paymentMethod in group not allowed" });
    }
    const method = [...methodSet][0];
    const unpaid = orders.filter((o) => o.paymentStatus !== "paid");
    if (!unpaid.length) {
      return res.json({ message: "Group already fully paid", groupId, orders });
    }
    const allowedFrom = method === "cash" ? ["unpaid"] : ["pending"];
    const invalidState = unpaid.find((o) => !allowedFrom.includes(o.paymentStatus));
    if (invalidState) {
      return res.status(400).json({
        message: `Cannot mark group paid: found order with paymentStatus=${invalidState.paymentStatus} (method=${method})`,
      });
    }
    await Order.updateMany({ groupId, paymentStatus: { $in: allowedFrom } }, { $set: { paymentStatus: "paid" } });
    const refreshed = await Order.find({ groupId }).sort({ createdAt: 1 });
    return res.json({ message: `Group payment set to paid (${method})`, groupId, orders: refreshed });
  } catch (e) {
    console.error("Error marking group paid:", e);
    return res.status(500).json({ message: e.message });
  }
});

router.patch("/batch/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderIds, orderStatus } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "orderIds array required and cannot be empty" });
    }
    if (!["processing", "ready", "completed", "cancelled"].includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid orderStatus. Must be: processing, ready, completed, or cancelled" });
    }
    if (orderIds.length > 100) {
      return res.status(400).json({ message: "Maximum 100 orders per batch update" });
    }
    const orders = await Order.find({ _id: { $in: orderIds } });
    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found with provided IDs" });
    }
    const cancelledOrders = orders.filter(o => o.orderStatus === "cancelled");
    if (cancelledOrders.length > 0 && orderStatus !== "cancelled") {
      return res.status(400).json({ message: "Cannot update cancelled orders", cancelledIds: cancelledOrders.map(o => o._id) });
    }
    if (orderStatus === "cancelled") {
      for (const order of orders) {
        if (!order.stockRestored && order.orderStatus !== "cancelled") {
          for (const item of order.items) {
            const menu = await Menu.findById(item.menuId);
            if (menu && menu.stock != null) {
              menu.stock += item.quantity;
              await menu.save();
            }
          }
          order.stockRestored = true;
        }
      }
    }
    const updateResult = await Order.updateMany(
      { _id: { $in: orderIds }, orderStatus: { $ne: "cancelled" } },
      { $set: { orderStatus: orderStatus, ...(orderStatus === "cancelled" ? { stockRestored: true } : {}) } }
    );
    const updatedOrders = await Order.find({ _id: { $in: orderIds } }).populate("items.menuId userId");
    if (orderStatus === "completed") {
      for (const order of updatedOrders) {
        try {
          const user = await User.findById(order.userId);
          if (user && user.phone) {
            const message = `Halo ${user.name || user.username}! ✅\n\nPesanan Anda sudah READY! 🎉\n\nOrder ID: ${order._id.toString().slice(-8).toUpperCase()}\nTanggal: ${new Date(order.orderDates[0]).toLocaleDateString("id-ID")}\nWaktu: ${order.deliveryTime}\n\nPesanan Anda sudah siap untuk ${order.deliveryType === "Delivery" ? "diantar" : "diambil"}.\n\nTerima kasih! 🍱`;
            await sendWhatsAppNotification(user.phone, message);
          }
        } catch (notifError) {
          console.error(`Failed to send notification for order ${order._id}:`, notifError);
        }
      }
    }
    return res.json({
      message: `Successfully updated ${updateResult.modifiedCount} order(s) to ${orderStatus}`,
      updated: updateResult.modifiedCount,
      total: orderIds.length,
      orders: updatedOrders
    });
  } catch (error) {
    console.error("Error in batch update order status:", error);
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderStatus } = req.body;
    if (!["processing", "completed", "cancelled"].includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid orderStatus" });
    }
    const doc = await Order.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Order not found" });
    if (doc.orderStatus === "cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }
    const previousStatus = doc.orderStatus;
    if (orderStatus === "cancelled" && !doc.stockRestored) {
      for (const it of doc.items) {
        const menu = await Menu.findById(it.menuId);
        if (menu && menu.stock != null) {
          menu.stock += it.quantity;
          await menu.save();
        }
      }
      doc.stockRestored = true;
    }
    doc.orderStatus = orderStatus;
    await doc.save();
    if (orderStatus === "completed" && previousStatus !== "completed") {
      try {
        const user = await User.findById(doc.userId);
        if (user && user.phone) {
          const message = `Halo ${user.name || user.username}! ✅\n\nPesanan Anda sudah READY! 🎉\n\nOrder ID: ${doc._id.toString().slice(-8).toUpperCase()}\nTanggal: ${new Date(doc.orderDates[0]).toLocaleDateString("id-ID")}\nWaktu: ${doc.deliveryTime}\n\nPesanan Anda sudah siap untuk ${doc.deliveryType === "Delivery" ? "diantar" : "diambil"}.\n\nTerima kasih! 🍱`;
          await sendWhatsAppNotification(user.phone, message);
        }
      } catch (notifError) {
        console.error("Failed to send completion notification:", notifError);
      }
    }
    res.json({ message: "Status updated", order: doc });
  } catch (e) {
    console.error("Error updating order status:", e);
    res.status(500).json({ message: e.message });
  }
});

router.post("/:id/cancel", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const doc = await Order.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Order not found" });
    if (doc.orderStatus === "cancelled") return res.status(400).json({ message: "Already cancelled" });
    if (!doc.stockRestored) {
      for (const it of doc.items) {
        const menu = await Menu.findById(it.menuId);
        if (menu && menu.stock != null) {
          menu.stock += it.quantity;
          await menu.save();
        }
      }
      doc.stockRestored = true;
    }
    doc.orderStatus = "cancelled";
    await doc.save();
    res.json({ message: "Order cancelled", order: doc });
  } catch (e) {
    console.error("Error cancelling order:", e);
    res.status(500).json({ message: e.message });
  }
});

router.patch("/:id/payment", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body || {};
    if (action !== "markPaid") {
      return res.status(400).json({ message: "Invalid action" });
    }
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Already paid" });
    }
    if (!["cash", "transfer"].includes(order.paymentMethod)) {
      return res.status(400).json({ message: "Unsupported paymentMethod" });
    }
    order.paymentStatus = "paid";
    await order.save();
    return res.json({ message: "Payment set to paid", order });
  } catch (e) {
    console.error("Error marking order paid:", e);
    return res.status(500).json({ message: e.message });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { items, deliveryType, deliveryAddress, deliveryTime, paymentMethod } = req.body;
    const userId = req.auth.userId;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items required" });
    }
    if (!deliveryType || !["Delivery", "Pickup"].includes(deliveryType)) {
      return res.status(400).json({ message: "deliveryType invalid" });
    }
    if (!deliveryTime || !["Pagi", "Siang", "Sore"].includes(deliveryTime)) {
      return res.status(400).json({ message: "deliveryTime invalid" });
    }
    if (!paymentMethod || !["cash", "transfer"].includes(paymentMethod)) {
      return res.status(400).json({ message: "paymentMethod invalid" });
    }
    if (deliveryType === "Delivery" && !deliveryAddress) {
      return res.status(400).json({ message: "deliveryAddress required for Delivery" });
    }
    const menuIds = items.map((i) => i.menuId);
    const uniqueIds = new Set(menuIds.map((id) => String(id)));
    if (uniqueIds.size !== menuIds.length) {
      return res.status(400).json({ message: "Duplicate menuId in items not allowed" });
    }
    const menus = await Menu.find({ _id: { $in: menuIds } });
    if (menus.length !== menuIds.length) {
      const foundIds = new Set(menus.map((m) => String(m._id)));
      const missing = menuIds.filter((id) => !foundIds.has(String(id)));
      return res.status(404).json({ message: `Menu not found: ${missing.join(",")}` });
    }
    const menuMap = new Map(menus.map((m) => [String(m._id), m]));
    const groups = new Map();
    for (const it of items) {
      if (!it.menuId || !it.quantity || it.quantity <= 0) {
        return res.status(400).json({ message: "Invalid item entry" });
      }
      const menu = menuMap.get(String(it.menuId));
      if (!menu) {
        return res.status(404).json({ message: `Menu ${it.menuId} not found` });
      }
      if (!menu.isAvailable) {
        return res.status(400).json({ message: `Menu ${menu.name} not available` });
      }
      if (!menu.date) {
        return res.status(400).json({ message: `Menu ${menu.name} tidak memiliki date` });
      }
      if (menu.stock != null && menu.stock < it.quantity) {
        return res.status(400).json({ message: `Stock not enough for ${menu.name}` });
      }
      const dateISO = menu.date.toISOString();
      if (!groups.has(dateISO)) {
        groups.set(dateISO, { date: menu.date, items: [] });
      }
      groups.get(dateISO).items.push({
        menuId: menu._id,
        quantity: it.quantity,
        specialNotes: it.specialNotes || "",
        _price: menu.price,
      });
    }
    for (const it of items) {
      const m = menuMap.get(String(it.menuId));
      if (m.stock != null) {
        m.stock -= it.quantity;
        await m.save();
      }
    }
    const multiDay = groups.size > 1;
    let groupId = null;
    if (multiDay) {
      groupId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }
    const createdOrders = [];
    const sortedGroups = Array.from(groups.values()).sort((a, b) => a.date - b.date);
    for (const [idx, g] of sortedGroups.entries()) {
      const totalPrice = g.items.reduce((sum, it) => sum + it._price * it.quantity, 0);
      const payload = {
        userId,
        items: g.items.map(({ _price, ...rest }) => rest),
        orderDates: [g.date],
        deliveryType,
        deliveryAddress: deliveryType === "Delivery" ? deliveryAddress : "",
        deliveryTime,
        paymentMethod,
        paymentStatus: paymentMethod === "cash" ? "unpaid" : multiDay ? "pending" : "pending",
        totalPrice,
        groupId: groupId,
        isGroupMaster: groupId ? idx === 0 : false,
      };
      const orderDoc = await Order.create(payload);
      createdOrders.push(orderDoc);
    }
    if (groupId) {
      try {
        const user = await User.findById(userId);
        if (user && user.phone) {
          const totalAmount = createdOrders.reduce((sum, o) => sum + o.totalPrice, 0);
          const message = `Halo ${user.name || user.username}! 🎉\n\nPesanan Anda berhasil dibuat!\n\nDetail:\n- Jumlah pesanan: ${createdOrders.length} hari\n- Total: Rp ${totalAmount.toLocaleString("id-ID")}\n- Metode: ${paymentMethod === "cash" ? "Tunai" : "Transfer"}\n- Status: ${paymentMethod === "cash" ? "Belum Bayar" : "Menunggu Pembayaran"}\n\nTerima kasih telah memesan di Katering Bu Lala! 🍱`;
          await sendWhatsAppNotification(user.phone, message);
        }
      } catch (notifError) {
        console.error("Failed to send order notification:", notifError);
      }
      return res.status(201).json({
        message: `Multi-day orders created (${paymentMethod} group ${paymentMethod === "cash" ? "unpaid" : "pending"})`,
        groupId,
        orders: createdOrders,
      });
    }
    if (multiDay) {
      try {
        const user = await User.findById(userId);
        if (user && user.phone) {
          const totalAmount = createdOrders.reduce((sum, o) => sum + o.totalPrice, 0);
          const message = `Halo ${user.name || user.username}! 🎉\n\nPesanan Anda berhasil dibuat!\n\nDetail:\n- Jumlah pesanan: ${createdOrders.length} hari\n- Total: Rp ${totalAmount.toLocaleString("id-ID")}\n- Metode: ${paymentMethod === "cash" ? "Tunai" : "Transfer"}\n\nTerima kasih telah memesan di Katering Bu Lala! 🍱`;
          await sendWhatsAppNotification(user.phone, message);
        }
      } catch (notifError) {
        console.error("Failed to send order notification:", notifError);
      }
      return res.status(201).json({ message: "Multi-day orders created", orders: createdOrders });
    } else {
      try {
        const user = await User.findById(userId);
        if (user && user.phone) {
          const order = createdOrders[0];
          const message = `Halo ${user.name || user.username}! 🎉\n\nPesanan Anda berhasil dibuat!\n\nDetail:\n- Order ID: ${order._id.toString().slice(-8).toUpperCase()}\n- Total: Rp ${order.totalPrice.toLocaleString("id-ID")}\n- Tanggal: ${new Date(order.orderDates[0]).toLocaleDateString("id-ID")}\n- Waktu: ${order.deliveryTime}\n- Metode: ${paymentMethod === "cash" ? "Tunai" : "Transfer"}\n\nTerima kasih telah memesan di Katering Bu Lala! 🍱`;
          await sendWhatsAppNotification(user.phone, message);
        }
      } catch (notifError) {
        console.error("Failed to send order notification:", notifError);
      }
      return res.status(201).json({ message: "Order created", order: createdOrders[0] });
    }
  } catch (e) {
    console.error("Error creating order multi-day split", e);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const doc = await Order.findById(req.params.id).populate("items.menuId");
    if (!doc) return res.status(404).json({ message: "Order not found" });
    if (String(doc.userId) !== req.auth.userId && req.auth.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(doc);
  } catch (e) {
    console.error("Error fetching order detail:", e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;