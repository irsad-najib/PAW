const axios = require("axios");

const FONNTE_API_URL = "https://api.fonnte.com/send";
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

function normalizePhone(phone) {
  if (!phone) return null;
  let normalized = String(phone).replace(/\D/g, "");
  if (normalized.startsWith("0")) {
    normalized = "62" + normalized.substring(1);
  } else if (!normalized.startsWith("62")) {
    normalized = "62" + normalized;
  }
  return normalized;
}

async function sendWhatsAppNotification(phone, message) {
  try {
    if (!FONNTE_TOKEN) {
      console.warn(
        "FONNTE_TOKEN not configured, skipping WhatsApp notification"
      );
      return null;
    }

    const target = normalizePhone(phone);
    if (!target) throw new Error("Invalid phone number");

    console.log(`📱 Sending WhatsApp to ${target}...`);

    const response = await axios.post(
      FONNTE_API_URL,
      { target, message },
      { headers: { Authorization: FONNTE_TOKEN } }
    );

    console.log("✅ WhatsApp sent successfully:", response.data);
    return response.data;
  } catch (err) {
    console.error(
      "❌ Failed to send WhatsApp notification:",
      err.response?.data || err.message
    );
    return null;
  }
}

function buildOrderCreatedMessage({
  name,
  orderId,
  totalAmount,
  orderCount,
  deliveryTime,
  paymentMethod,
}) {
  if (orderCount && orderCount > 1) {
    return `Halo ${
      name || "Customer"
    }! 🎉\n\nPesanan Anda berhasil dibuat!\n\nDetail:\n- Jumlah pesanan: ${orderCount} hari\n- Total: Rp ${Number(
      totalAmount || 0
    ).toLocaleString("id-ID")}\n- Metode: ${
      paymentMethod === "cash" ? "Tunai" : "Transfer"
    }\n- Status: ${
      paymentMethod === "cash" ? "Belum Bayar" : "Menunggu Pembayaran"
    }\n\nTerima kasih telah memesan di Katering Bu Lala! 🍱`;
  }

  return `Halo ${
    name || "Customer"
  }! 🎉\n\nPesanan Anda berhasil dibuat!\n\nDetail:\n- Order ID: ${String(
    orderId || "-"
  )
    .toString()
    .slice(-8)
    .toUpperCase()}\n- Total: Rp ${Number(totalAmount || 0).toLocaleString(
    "id-ID"
  )}\n- Waktu: ${deliveryTime || "-"}\n- Metode: ${
    paymentMethod === "cash" ? "Tunai" : "Transfer"
  }\n\nTerima kasih telah memesan di Katering Bu Lala! 🍱`;
}

function buildOrderCompletedMessage({
  name,
  orderId,
  date,
  deliveryTime,
  deliveryType,
}) {
  return `Halo ${
    name || "Customer"
  }! ✅\n\nPesanan Anda sudah READY! 🎉\n\nOrder ID: ${String(orderId || "-")
    .toString()
    .slice(-8)
    .toUpperCase()}\nTanggal: ${
    date ? new Date(date).toLocaleDateString("id-ID") : "-"
  }\nWaktu: ${deliveryTime || "-"}\n\nPesanan Anda sudah siap untuk ${
    deliveryType === "Delivery" ? "diantar" : "diambil"
  }.\n\nTerima kasih! 🍱`;
}

module.exports = {
  normalizePhone,
  sendWhatsAppNotification,
  buildOrderCreatedMessage,
  buildOrderCompletedMessage,
};
