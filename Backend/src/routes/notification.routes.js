const express = require("express");
const axios = require("axios");
const router = express.Router();

const FONNTE_API_URL = "https://api.fonnte.com/send";
const FONNTE_TOKEN = process.env.FONNTE_TOKEN; // token dari .env

// Endpoint untuk kirim notifikasi
router.post("/send", async (req, res) => {
  try {
    const { phone, type, order_id, name, amount } = req.body;

    // Template pesan
    let message = "";
    if (type === "order_success") {
      message = `Halo ${name}, pesanan Anda dengan ID ${order_id} berhasil dibuat.`;
    } else if (type === "payment_success") {
      message = `Halo ${name}, pembayaran untuk pesanan ${order_id} sebesar Rp${amount} berhasil.`;
    } else {
      message = `Halo ${name}, ada update untuk pesanan ${order_id}.`;
    }

    // Kirim ke API Fonnte
    const response = await axios.post(
      FONNTE_API_URL,
      {
        target: "087850846690", // Nomer rozan buat testing (bisa diganti)
        message: message,
      },
      {
        headers: {
          Authorization: FONNTE_TOKEN,
        },
      }
    );

    res.json({
      status: "success",
      info: response.data,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ status: "error", message: "Gagal mengirim notifikasi" });
  }
});

module.exports = router;
