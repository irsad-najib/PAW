const express = require("express");
const router = express.Router();
const Order = require("../models/order.model");
const Menu = require("../models/menu.model");

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
 * /api/order:
 *   post:
 *     summary: Buat order baru
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuId: { type: string }
 *                     qty: { type: integer }
 *     responses:
 *       201:
 *         description: Order dibuat
 *       400:
 *         description: Data invalid
 */
router.post("/", async (req, res) => {
  try {
    const { items, orderDates, deliveryType, deliveryAddress, deliveryTime } =
      req.body;

    const userId = "64a7f1c2e4b0f5b6c8d9e0a1"; // sementara

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
