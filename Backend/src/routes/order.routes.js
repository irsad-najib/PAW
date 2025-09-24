const express = require("express");
const router = express.Router();
const Order = require("../models/order.model");
const Menu = require("../models/menu.model");
const authenticateToken = require("../middleware/JWT");

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
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               menuId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, delivered, cancelled]
 *         createdAt:
 *           type: string
 *           format: date-time
 *     OrderInput:
 *       type: object
 *       required:
 *         - items
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               menuId:
 *                 type: string
 *               quantity:
 *                 type: number
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Dapatkan semua pesanan pengguna
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List pesanan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate("items.menuId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Buat pesanan baru
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
 *         description: Pesanan berhasil dibuat
 *       400:
 *         description: Data tidak valid
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { items, orderDates, deliveryType, deliveryAddress, deliveryTime } =
      req.body;

    const userId = req.user.userId;

    // Validasi permintaan
    if (
      !items ||
      items.length === 0 ||
      !orderDates ||
      !deliveryType ||
      !deliveryTime
    ) {
      return res.status(400).json({ message: "Data pesanan tidak lengkap" });
    }

    // Periksa stok, hitung harga, dan kurangi stok
    let totalPrice = 0;
    for (const item of items) {
      const menu = await Menu.findById(item.menuId);

      if (!menu) {
        return res
          .status(404)
          .json({ message: `Menu dengan ID ${item.menuId} tidak ditemukan` });
      }

      if (menu.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Stok untuk ${menu.name} tidak mencukupi` });
      }

      menu.stock -= item.quantity;
      await menu.save();

      totalPrice += menu.price * item.quantity;
    }

    // SImpan pesanan ke database
    const newOrder = new Order({
      userId,
      items,
      orderDates,
      deliveryType,
      deliveryAddress: deliveryType === "Delivery" ? deliveryAddress : "",
      deliveryTime,
      totalPrice,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({
      message: "Pesanan berhasil dibuat",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
