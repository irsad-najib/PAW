const express = require("express");
const router = express.Router();
const Order = require("../models/order.model");
const Menu = require("../models/menu.model");
const User = require("../models/user.model");
const authenticateToken = require("../middleware/JWT");
const axios = require("axios");

const {
  sendWhatsAppNotification,
  buildOrderCreatedMessage,
  buildOrderCompletedMessage,
} = require("../utils/whatsapp");
const VALID_ORDER_STATUSES = [
  "accepted",
  "processing",
  "ready",
  "completed",
  "cancelled",
];
const ORDER_POPULATE = [
  { path: "items.menuId", select: "name price date stock isAvailable" },
  { path: "userId", select: "username name phone email" },
];

function buildDayRange(dateInput) {
  const base = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(base.getTime())) return null;

  const startOfDay = new Date(base);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(base);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

// sendWhatsAppNotification and message builders are provided by ../utils/whatsapp

function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }
  next();
}

async function populateOrders(docs) {
  return Order.populate(docs, ORDER_POPULATE);
}

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Manajemen pesanan
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         menuId:
 *           type: string
 *         quantity:
 *           type: number
 *         specialNotes:
 *           type: string
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         groupId:
 *           type: string
 *           nullable: true
 *           description: "ID grup pembayaran multi-day (jika pesanan hasil split multi tanggal)."
 *         isGroupMaster:
 *           type: boolean
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         orderDates:
 *           type: array
 *           minItems: 1
 *           maxItems: 1
 *           items:
 *             type: string
 *             format: date-time
 *           description: "Selalu 1 tanggal setelah refactor split multi-day."
 *         deliveryType:
 *           type: string
 *           enum: [Delivery, Pickup]
 *         deliveryAddress:
 *           type: string
 *         deliveryTime:
 *           type: string
 *           enum: [Pagi, Siang, Sore]
 *         paymentMethod:
 *           type: string
 *           enum: [cash, transfer]
 *         paymentReference:
 *           type: string
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, unpaid, refunded]
 *         orderStatus:
 *           type: string
 *           enum: [accepted, processing, ready, completed, cancelled]
 *         totalPrice:
 *           type: number
 *         stockRestored:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     OrderInput:
 *       type: object
 *       required:
 *         - items
 *         - deliveryType
 *         - deliveryTime
 *         - paymentMethod
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required: [menuId, quantity]
 *             properties:
 *               menuId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               specialNotes:
 *                 type: string
 *         deliveryType:
 *           type: string
 *           enum: [Delivery, Pickup]
 *         deliveryAddress:
 *           type: string
 *         deliveryTime:
 *           type: string
 *           enum: [Pagi, Siang, Sore]
 *         paymentMethod:
 *           type: string
 *           enum: [cash, transfer]
 */

// ============================================
// ADMIN ROUTES - Define BEFORE dynamic routes
// ============================================

/**
 * @swagger
 * /api/orders/admin/summary:
 *   get:
 *     summary: Get order summary for a specific date (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Order summary
 */
router.get(
  "/admin/summary",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { date } = req.query;
      const range = buildDayRange(date);
      if (!range) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      const { startOfDay, endOfDay } = range;

      const orders = await Order.find({
        orderDates: {
          $elemMatch: {
            $gte: startOfDay.toISOString(),
            $lte: endOfDay.toISOString(),
          },
        },
      }).populate("items.menuId");

      const summary = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        byStatus: {},
        byPaymentStatus: {},
        byDeliveryTime: {},
      };

      res.json({
        date: startOfDay.toISOString().split("T")[0],
        summary,
        orders,
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

/**
 * @swagger
 * /api/orders/admin:
 *   get:
 *     summary: Get all orders (Admin only, with filters)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get("/admin", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      search,
      status,
      paymentStatus,
      deliveryTime,
      deliveryType,
      date,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { _id: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (deliveryTime) query.deliveryTime = deliveryTime;
    if (deliveryType) query.deliveryType = deliveryType;

    if (date) {
      const range = buildDayRange(date);
      if (!range) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      query.orderDates = {
        $elemMatch: {
          $gte: range.startOfDay,
          $lte: range.endOfDay,
        },
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate(ORDER_POPULATE),
      Order.countDocuments(query),
    ]);

    res.json({ page: parseInt(page), limit: parseInt(limit), total, items });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * @swagger
 * /api/orders/batch/status:
 *   patch:
 *     summary: Update status for multiple orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/batch/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { orderIds, orderStatus } = req.body;

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res
          .status(400)
          .json({ message: "orderIds must be a non-empty array" });
      }

      if (!VALID_ORDER_STATUSES.includes(orderStatus)) {
        return res.status(400).json({ message: "Invalid orderStatus" });
      }

      // fetch previous orders to determine transitions
      const prevOrders = await Order.find({ _id: { $in: orderIds } }).populate(
        ORDER_POPULATE
      );

      const result = await Order.updateMany(
        { _id: { $in: orderIds } },
        { $set: { orderStatus } }
      );

      // refresh updated orders
      const updated = await Order.find({ _id: { $in: orderIds } }).populate(
        ORDER_POPULATE
      );

      // Notify users if orders transitioned to 'completed'
      if (orderStatus === "completed") {
        for (const u of updated) {
          const prev = prevOrders.find((p) => String(p._id) === String(u._id));
          const prevStatus = prev ? prev.orderStatus : null;
          if (prevStatus !== "completed") {
            try {
              const user = await User.findById(u.userId);
              if (user && user.phone) {
                const message = buildOrderCompletedMessage({
                  name: user.name || user.username,
                  orderId: u._id,
                  date: u.orderDates && u.orderDates[0],
                  deliveryTime: u.deliveryTime,
                  deliveryType: u.deliveryType,
                });
                await sendWhatsAppNotification(user.phone, message);
              }
            } catch (notifError) {
              console.error(
                "Failed to send batch completion notification:",
                notifError
              );
            }
          }
        }
      }

      res.json({
        message: `Updated ${result.modifiedCount} orders`,
        modifiedCount: result.modifiedCount,
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

/**
 * @swagger
 * /api/orders/group/{groupId}/payment:
 *   patch:
 *     summary: Set all orders in a transfer multi-day group to paid (admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/group/:groupId/payment",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
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
        return res
          .status(400)
          .json({ message: "Mixed paymentMethod in group not allowed" });
      }
      const method = [...methodSet][0];

      const unpaid = orders.filter((o) => o.paymentStatus !== "paid");
      if (!unpaid.length) {
        return res.json({
          message: "Group already fully paid",
          groupId,
          orders,
        });
      }

      const allowedFrom = method === "cash" ? ["unpaid"] : ["pending"];
      const invalidState = unpaid.find(
        (o) => !allowedFrom.includes(o.paymentStatus)
      );
      if (invalidState) {
        return res.status(400).json({
          message: `Cannot mark group paid: found order with paymentStatus=${invalidState.paymentStatus} (method=${method})`,
        });
      }

      await Order.updateMany(
        { groupId, paymentStatus: { $in: allowedFrom } },
        { $set: { paymentStatus: "paid" } }
      );

      const refreshed = await Order.find({ groupId })
        .sort({ createdAt: 1 })
        .populate(ORDER_POPULATE);

      // Send payment success notification to users for orders that were updated
      for (const r of refreshed) {
        try {
          // Only notify if this order was previously in unpaid/pending
          const wasUnpaid = unpaid.find((u) => String(u._id) === String(r._id));
          if (!wasUnpaid) continue;
          const user = await User.findById(r.userId);
          if (user && user.phone) {
            const message = `Halo ${
              user.name || user.username
            }, pembayaran untuk pesanan ${String(r._id)
              .slice(-8)
              .toUpperCase()} sebesar Rp${(r.totalPrice || 0).toLocaleString(
              "id-ID"
            )} telah diterima. Terima kasih!`;
            await sendWhatsAppNotification(user.phone, message);
          }
        } catch (e) {
          console.error("Failed to send group payment notification:", e);
        }
      }

      return res.json({
        message: `Group payment set to paid (${method})`,
        groupId,
        orders: refreshed,
      });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
);

/**
 * @swagger
 * /api/orders/group/{groupId}:
 *   get:
 *     summary: Ambil semua orders dalam satu groupId (multi-day split)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get("/group/:groupId", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const orders = await Order.find({ groupId })
      .sort({ createdAt: 1 })
      .populate(ORDER_POPULATE);

    if (!orders.length) {
      return res.status(404).json({ message: "Group not found" });
    }

    const allOwned = orders.every((o) => String(o.userId) === req.auth.userId);
    if (!allOwned && req.auth.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const paymentStatuses = [...new Set(orders.map((o) => o.paymentStatus))];
    const paymentMethod = orders[0].paymentMethod;
    const totals = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    return res.json({
      groupId,
      count: orders.length,
      paymentMethod,
      paymentStatuses,
      totalAmount: totals,
      orders,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// ============================================
// USER ROUTES
// ============================================

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Dapatkan semua pesanan milik user yang login (paginated)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Order.find({ userId: req.auth.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(ORDER_POPULATE),
      Order.countDocuments({ userId: req.auth.userId }),
    ]);

    res.json({ page, limit, total, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Buat pesanan baru (single-day atau multi-day split)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      items,
      deliveryType,
      deliveryAddress,
      deliveryTime,
      paymentMethod,
    } = req.body;
    const userId = req.auth.userId;

    // Validation
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
      return res
        .status(400)
        .json({ message: "deliveryAddress required for Delivery" });
    }
    const user = await User.findById(userId);

    const menuIds = items.map((i) => i.menuId);
    const uniqueIds = new Set(menuIds.map((id) => String(id)));
    if (uniqueIds.size !== menuIds.length) {
      return res
        .status(400)
        .json({ message: "Duplicate menuId in items not allowed" });
    }

    const menus = await Menu.find({ _id: { $in: menuIds } });
    if (menus.length !== menuIds.length) {
      const foundIds = new Set(menus.map((m) => String(m._id)));
      const missing = menuIds.filter((id) => !foundIds.has(String(id)));
      return res
        .status(404)
        .json({ message: `Menu not found: ${missing.join(",")}` });
    }

    const menuMap = new Map(menus.map((m) => [String(m._id), m]));

    // Group items by menu.date
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
        return res
          .status(400)
          .json({ message: `Menu ${menu.name} not available` });
      }
      if (!menu.date) {
        return res
          .status(400)
          .json({ message: `Menu ${menu.name} tidak memiliki date` });
      }
      if (menu.stock != null && menu.stock < it.quantity) {
        return res
          .status(400)
          .json({ message: `Stock not enough for ${menu.name}` });
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

    // Decrement stocks
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
    const sortedGroups = Array.from(groups.values()).sort(
      (a, b) => a.date - b.date
    );

    for (const [idx, g] of sortedGroups.entries()) {
      const totalPrice = g.items.reduce(
        (sum, it) => sum + it._price * it.quantity,
        0
      );
      const payload = {
        userId,
        items: g.items.map(({ _price, ...rest }) => rest),
        orderDates: [g.date],
        deliveryType,
        deliveryAddress: deliveryType === "Delivery" ? deliveryAddress : "",
        deliveryTime,
        paymentMethod,
        paymentStatus: paymentMethod === "cash" ? "unpaid" : "pending",
        totalPrice,
        groupId: groupId,
        isGroupMaster: groupId ? idx === 0 : false,
        customerName: user?.name || user?.username || undefined,
        customerPhone: user?.phone || undefined,
      };
      const orderDoc = await Order.create(payload);
      createdOrders.push(orderDoc);
    }

    // Send WhatsApp notification
    if (user && user.phone) {
      try {
        const totalAmount = createdOrders.reduce(
          (sum, o) => sum + o.totalPrice,
          0
        );
        const orderCount = createdOrders.length;
        const message = buildOrderCreatedMessage({
          name: user.name || user.username,
          orderId: createdOrders[0]?._id,
          totalAmount,
          orderCount,
          deliveryTime,
          paymentMethod,
        });

        await sendWhatsAppNotification(user.phone, message);
      } catch (notifError) {
        console.error("Failed to send order notification:", notifError);
      }
    }

    // Return response
    const populated = await populateOrders(createdOrders);

    if (groupId) {
      return res.status(201).json({
        message: `Multi-day orders created (${paymentMethod})`,
        groupId,
        orders: populated,
      });
    } else {
      return res.status(201).json({
        message: "Order created",
        order: populated[0],
      });
    }
  } catch (e) {
    console.error("Error creating order:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============================================
// DYNAMIC ROUTES - Define AFTER static routes
// ============================================

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order detail
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const doc = await Order.findById(req.params.id).populate(ORDER_POPULATE);
    if (!doc) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (String(doc.userId) !== req.auth.userId && req.auth.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { orderStatus } = req.body;

      if (!VALID_ORDER_STATUSES.includes(orderStatus)) {
        return res.status(400).json({ message: "Invalid orderStatus" });
      }

      const doc = await Order.findById(req.params.id).populate(ORDER_POPULATE);
      if (!doc) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (doc.orderStatus === "cancelled") {
        return res.status(400).json({ message: "Already cancelled" });
      }

      const previousStatus = doc.orderStatus;

      // Restore stock if cancelled
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

      // Send notification when completed
      if (orderStatus === "completed" && previousStatus !== "completed") {
        try {
          const user = await User.findById(doc.userId);
          if (user && user.phone) {
            const message = buildOrderCompletedMessage({
              name: user.name || user.username,
              orderId: doc._id,
              date: doc.orderDates[0],
              deliveryTime: doc.deliveryTime,
              deliveryType: doc.deliveryType,
            });
            await sendWhatsAppNotification(user.phone, message);
          }
        } catch (notifError) {
          console.error("Failed to send completion notification:", notifError);
        }
      }

      res.json({ message: "Status updated", order: doc });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

/**
 * @swagger
 * /api/orders/{id}/payment:
 *   patch:
 *     summary: Set single order payment to paid (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:id/payment",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body || {};

      if (action !== "markPaid") {
        return res.status(400).json({ message: "Invalid action" });
      }

      const order = await Order.findById(id).populate(ORDER_POPULATE);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.paymentStatus === "paid") {
        return res.status(400).json({ message: "Already paid" });
      }
      if (!["cash", "transfer"].includes(order.paymentMethod)) {
        return res.status(400).json({ message: "Unsupported paymentMethod" });
      }

      order.paymentStatus = "paid";
      await order.save();

      // Notify user about payment success
      try {
        const user = await User.findById(order.userId);
        if (user && user.phone) {
          const message = `Halo ${
            user.name || user.username
          }, pembayaran untuk pesanan ${String(order._id)
            .slice(-8)
            .toUpperCase()} telah diterima. Terima kasih!`;
          await sendWhatsAppNotification(user.phone, message);
        }
      } catch (e) {
        console.error("Failed to send payment notification:", e);
      }

      return res.json({ message: "Payment set to paid", order });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel order (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:id/cancel",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const doc = await Order.findById(req.params.id).populate(ORDER_POPULATE);
      if (!doc) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (doc.orderStatus === "cancelled") {
        return res.status(400).json({ message: "Already cancelled" });
      }

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
      res.status(500).json({ message: e.message });
    }
  }
);

module.exports = router;
