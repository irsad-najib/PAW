const mongoose = require("mongoose");

function generateUserID() {
  return `U${Date.now()}${Math.floor(Math.random() * 1e4)}`;
}

const userSchema = new mongoose.Schema(
  {
    userID: { type: String, unique: true, default: generateUserID },
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/,
      set: (v) => v.toLowerCase(),
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
    },
    password: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    googleId: { type: String, unique: true, sparse: true },
    name: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
