const express = require("express");
const axios = require("axios");
const router = express.Router();

const {
  sendWhatsAppNotification,
  buildOrderCreatedMessage,
  buildOrderCompletedMessage,
} = require("../utils/whatsapp");

// Test endpoint untuk cek koneksi Fonnte
router.get("/test", async (req, res) => {
  try {
    const token = process.env.FONNTE_TOKEN;
    if (!token) {
      return res.status(500).json({
        status: "error",
        message: "FONNTE_TOKEN not configured in .env",
      });
    }
    return res.json({
      status: "success",
      message: "Fonnte configuration OK",
      token: token.substring(0, 4) + "****",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Endpoint untuk kirim notifikasi
router.post("/send", async (req, res) => {
  try {
    const { phone, type, order_id, name, amount } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ status: "error", message: "Phone number is required" });
    }

    // Build message based on 'type' and delegate sending to util
    let message = "";
    if (type === "order_success") {
      message = buildOrderCreatedMessage({
        name,
        orderId: order_id,
        totalAmount: amount,
      });
    } else if (type === "payment_success") {
      message = `Halo ${name}, pembayaran untuk pesanan ${order_id} sebesar Rp${amount} berhasil.`;
    } else {
      message = `Halo ${name}, ada update untuk pesanan ${order_id}.`;
    }

    const result = await sendWhatsAppNotification(phone, message);
    if (!result)
      return res
        .status(500)
        .json({ status: "error", message: "Gagal mengirim notifikasi" });
    // Fonnte may return an object with status=false while HTTP 200; treat that as an error
    if (result && (result.status === false || result.status === "false")) {
      return res
        .status(502)
        .json({
          status: "error",
          message: result.reason || "device disconnected or request rejected",
          info: result,
        });
    }
    return res.json({ status: "success", info: result });
  } catch (error) {
    console.error(
      "❌ Notification error:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ status: "error", message: "Gagal mengirim notifikasi" });
  }
});

// Endpoint untuk mengirim test event (order created / completed)
router.post("/test-event", async (req, res) => {
  try {
    const { phone, eventType, payload } = req.body;

    if (!phone)
      return res
        .status(400)
        .json({ status: "error", message: "phone required" });
    if (!eventType)
      return res
        .status(400)
        .json({ status: "error", message: "eventType required" });

    let message = "";
    if (eventType === "order_created") {
      message = buildOrderCreatedMessage(payload || {});
    } else if (eventType === "order_completed") {
      message = buildOrderCompletedMessage(payload || {});
    } else {
      return res
        .status(400)
        .json({ status: "error", message: "unsupported eventType" });
    }

    const result = await sendWhatsAppNotification(phone, message);
    if (!result)
      return res
        .status(500)
        .json({ status: "error", message: "failed to send" });
    if (result && (result.status === false || result.status === "false")) {
      return res
        .status(502)
        .json({
          status: "error",
          message: result.reason || "device disconnected or request rejected",
          info: result,
        });
    }
    return res.json({ status: "success", info: result });
  } catch (err) {
    console.error("test-event error", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
