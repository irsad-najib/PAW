const express = require("express");
const router = express.Router();
const snap = require("../config/midtrans");

// Simpan orders in-memory sementara
let orders = {};

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentRequest:
 *       type: object
 *       required:
 *         - customer_name
 *         - customer_phone
 *         - items
 *       properties:
 *         customer_name:
 *           type: string
 *           description: Nama pelanggan
 *         customer_phone:
 *           type: string
 *           description: Nomor telepon pelanggan
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: number
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *         order_id:
 *           type: string
 *         token:
 *           type: string
 *         redirect_url:
 *           type: string
 *         client_key:
 *           type: string
 */

/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     summary: Buat transaksi pembayaran baru
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: Transaksi berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Server error
 */
router.post("/create", async (req, res) => {
  try {
    const { customer_name, customer_phone, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, message: "Items tidak valid" });
    }

    const orderId = `order-${Date.now()}`;
    const grossAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: items.map((it) => ({
        id: it.id,
        price: Number(it.price),
        quantity: Number(it.quantity),
        name: it.name,
      })),
      customer_details: {
        first_name: customer_name || "Pelanggan",
        phone: customer_phone || "",
      },
    };

    const transaction = await snap.createTransaction(parameter);

    orders[orderId] = {
      id: orderId,
      items,
      grossAmount,
      status: "pending",
      createdAt: new Date(),
      customer_name,
      customer_phone,
    };

    res.json({
      ok: true,
      order_id: orderId,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      client_key: process.env.MIDTRANS_CLIENT_KEY,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/payment/notification:
 *   post:
 *     summary: Handle notifikasi dari Midtrans
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id:
 *                 type: string
 *               transaction_status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notifikasi berhasil diproses
 *       500:
 *         description: Server error
 */
router.post("/notification", async (req, res) => {
  try {
    const notification = req.body;
    const { order_id, transaction_status } = notification;

    if (orders[order_id]) {
      if (
        transaction_status === "settlement" ||
        transaction_status === "capture"
      ) {
        orders[order_id].status = "paid";
      } else if (transaction_status === "pending") {
        orders[order_id].status = "pending";
      } else if (
        transaction_status === "deny" ||
        transaction_status === "cancel" ||
        transaction_status === "expire"
      ) {
        orders[order_id].status = "failed";
      } else {
        orders[order_id].status = transaction_status;
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
