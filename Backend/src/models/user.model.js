const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userID: { type: String, required: true, unique: true }, // ID unik untuk setiap pengguna
    UserName: { type: String, required: true, unique: true }, // Nama pengguna
    password: { type: String, optional: true }, // Kata sandi (harus di-hash sebelum disimpan)
    Role: { type: String, enum: ["admin", "user"], default: "user" }, // Peran pengguna
  },
  {
    timestamps: true, // otomatis nyimpen createdAt & updatedAt
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
