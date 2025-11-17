const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },        // Nama menu, misal "Nasi Goreng"
  price: { type: Number, required: true },       // Harga per porsi
  description: { type: String },                 // Deskripsi opsional
  stock: { type: Number, default: 0 },           // Jumlah stok harian/mingguan
  image: { type: String, default: null },        // URL gambar menu
  date: { type: Date },                          // Menu berlaku untuk tanggal tertentu
  isAvailable: { type: Boolean, default: true }, // Bisa dipesan atau tidak
}, {
  timestamps: true   // otomatis nyimpen createdAt & updatedAt
});

module.exports = mongoose.model("Menu", menuSchema);
