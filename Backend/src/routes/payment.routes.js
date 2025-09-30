const express = require("express");
const router = express.Router();
const paymentController = require("../controller/payment.controller");

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
router.post("/create", paymentController.createTransaction);

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
router.post("/notification", paymentController.handleNotification);

/**
 * @swagger
 * /api/payment/status/{orderId}:
 *   get:
 *     summary: Cek status transaksi dari Midtrans
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID untuk dicek statusnya
 *     responses:
 *       200:
 *         description: Status transaksi berhasil didapat
 *       500:
 *         description: Server error
 */
router.get("/status/:orderId", paymentController.getTransactionStatus);

module.exports = router;
