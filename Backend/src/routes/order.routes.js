const express = require("express");
const router = express.Router();
const Order = require("../models/order.model");
const Menu = require("../models/menu.model");
const authenticateToken = require("../middleware/JWT");

function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }
  next();
}

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Manajemen pesanan
 */

// @ route   POST /api/orders
// @ desc    Membuat pesanan baru
// @ access  Public (untuk testing sementara)

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
 *           enum: [pending, paid, unpaid]
 *         orderStatus:
 *           type: string
 *           enum: [pending, processing, completed, cancelled]
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
 *   responses:
 *     CreateOrderSingle:
 *       description: Pesanan single-day berhasil dibuat
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               order:
 *                 $ref: '#/components/schemas/Order'
 *     CreateOrderMulti:
 *       description: Multi-day split created (cash)
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               orders:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Order'
 *     CreateOrderMultiTransfer:
 *       description: Multi-day split created (transfer, grouped & langsung paid sementara)
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               groupId:
 *                 type: string
 *               orders:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Order'
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Dapatkan semua pesanan milik user yang login (paginated)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Halaman (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Batas per halaman (default 10)
 *     responses:
 *       200:
 *         description: List pesanan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
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
        .populate("items.menuId"),
      Order.countDocuments({ userId: req.auth.userId }),
    ]);
    res.json({ page, limit, total, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Detail order (owner atau admin)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const doc = await Order.findById(req.params.id).populate("items.menuId");
    if (!doc) return res.status(404).json({ message: "Order not found" });
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
 * /api/orders:
 *   post:
 *     summary: Buat pesanan baru (single-day atau multi-day split)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       201:
 *         description: Created order(s)
 *         content:
 *           application/json:
 *             oneOf:
 *               - $ref: '#/components/responses/CreateOrderSingle/content/application~1json/schema'
 *               - $ref: '#/components/responses/CreateOrderMulti/content/application~1json/schema'
 *               - $ref: '#/components/responses/CreateOrderMultiTransfer/content/application~1json/schema'
 *       400:
 *         description: Data tidak valid
 */
router.post("/", authenticateToken, async (req, res) => {
  // Refactor: multi-day -> split menjadi beberapa order (satu per tanggal)
  try {
    const {
      items,
      deliveryType,
      deliveryAddress,
      deliveryTime,
      paymentMethod,
    } = req.body;
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
      return res
        .status(400)
        .json({ message: "deliveryAddress required for Delivery" });
    }

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
    const groups = new Map(); // dateISO -> { items: [], date: Date }
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
        _price: menu.price, // attach for later total calc
      });
    }

    // STOCK CHECK PASS -> decrement stocks
    for (const it of items) {
      const m = menuMap.get(String(it.menuId));
      if (m.stock != null) {
        m.stock -= it.quantity;
        await m.save();
      }
    }

    const multiDay = groups.size > 1;
    // Generate groupId for ANY multi-day order (cash or transfer) so admin dapat set paid per group
    let groupId = null;
    if (multiDay) {
      groupId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }

    const createdOrders = [];
    // Sort dates ASC
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
        paymentStatus:
          paymentMethod === "cash"
            ? "unpaid"
            : multiDay
            ? "pending"
            : "pending",
        totalPrice,
        groupId: groupId,
      };
      const orderDoc = await Order.create(payload);
      createdOrders.push(orderDoc);
    }

    if (groupId) {
      return res.status(201).json({
        message: `Multi-day orders created (${paymentMethod} group ${
          paymentMethod === "cash" ? "unpaid" : "pending"
        })`,
        groupId,
        orders: createdOrders,
      });
    }

    if (multiDay) {
      return res
        .status(201)
        .json({ message: "Multi-day orders created", orders: createdOrders });
    } else {
      return res
        .status(201)
        .json({ message: "Order created", order: createdOrders[0] });
    }
  } catch (e) {
    console.error("Error creating order multi-day split", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin update status (processing, completed, cancelled)
router.patch(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
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
      // Jika cancel & belum restore stok
      if (orderStatus === "cancelled" && !doc.stockRestored) {
        for (const it of doc.items) {
          const menu = await Menu.findById(it.menuId);
          if (menu && menu.stock != null) {
            menu.stock += it.quantity; // restore
            await menu.save();
          }
        }
        doc.stockRestored = true;
      }
      doc.orderStatus = orderStatus;
      await doc.save();
      res.json({ message: "Status updated", order: doc });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

// Admin cancel explicit endpoint (alias status=cancelled)
router.post(
  "/:id/cancel",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const doc = await Order.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Order not found" });
      if (doc.orderStatus === "cancelled")
        return res.status(400).json({ message: "Already cancelled" });
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

/**
 * @swagger
 * /api/orders/group/{groupId}/payment:
 *   patch:
 *     summary: Set all orders in a transfer multi-day group to paid (admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [markPaid]
 *                 example: markPaid
 *     responses:
 *       200:
 *         description: Orders updated to paid
 *       400:
 *         description: Invalid group or state
 *       403:
 *         description: Forbidden
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
      // Validasi konsistensi paymentMethod (tidak boleh campuran cash & transfer)
      const methodSet = new Set(orders.map((o) => o.paymentMethod));
      if (methodSet.size !== 1) {
        return res
          .status(400)
          .json({ message: "Mixed paymentMethod in group not allowed" });
      }
      const method = [...methodSet][0]; // 'cash' atau 'transfer'

      // Cek apakah sudah paid semua (idempotent safety)
      const unpaid = orders.filter((o) => o.paymentStatus !== "paid");
      if (!unpaid.length) {
        return res.json({
          message: "Group already fully paid",
          groupId,
          orders,
        });
      }

      // Transisi diperbolehkan:
      // - cash: unpaid -> paid (konfirmasi manual admin)
      // - transfer: pending -> paid (konfirmasi manual / verifikasi)
      // Order dalam status lain (completed/cancelled) dibiarkan saja (hanya ubah paymentStatus jika belum paid)
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
      const refreshed = await Order.find({ groupId }).sort({ createdAt: 1 });
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
 * /api/orders/{id}/payment:
 *   patch:
 *     summary: Set single order payment to paid (admin, cash only / manual adjust)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [markPaid]
 *                 example: markPaid
 *     responses:
 *       200:
 *         description: Order payment set to paid
 *       400:
 *         description: Invalid state
 *       403:
 *         description: Forbidden
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
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.paymentStatus === "paid") {
        return res.status(400).json({ message: "Already paid" });
      }
      // Biz rule: hanya cash unpaid -> paid atau transfer pending -> paid (manual override)
      if (!["cash", "transfer"].includes(order.paymentMethod)) {
        return res.status(400).json({ message: "Unsupported paymentMethod" });
      }
      order.paymentStatus = "paid";
      await order.save();
      return res.json({ message: "Payment set to paid", order });
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
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Daftar orders dalam group
 *       403:
 *         description: Forbidden jika bukan pemilik atau admin
 *       404:
 *         description: Group tidak ditemukan
 */
router.get("/group/:groupId", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const orders = await Order.find({ groupId })
      .sort({ createdAt: 1 })
      .populate("items.menuId");
    if (!orders.length)
      return res.status(404).json({ message: "Group not found" });
    // Authorization: semua orders harus milik user ini atau user adalah admin
    const allOwned = orders.every((o) => String(o.userId) === req.auth.userId);
    if (!allOwned && req.auth.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    // Summary info
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
