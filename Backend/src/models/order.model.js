const mongoose = require("mongoose");

// Skema untuk setiap item menu
const orderItemSchema = new mongoose.Schema({
  menuId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  specialNotes: {
    type: String,
    default: "",
    trim: true,
  },
});

// Skema utama untuk pesanan
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Kelompok pembayaran multi-day
    groupId: {
      type: String,
      index: true,
      default: null,
    },
    isGroupMaster: {
      type: Boolean,
      default: false,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [
        function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        "Items required",
      ],
    },
    // Multi tanggal (sesuai klarifikasi user)
    orderDates: {
      type: [Date],
      required: true,
      validate: [
        function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        "Minimal 1 tanggal",
      ],
    },
    deliveryType: {
      type: String,
      enum: ["Delivery", "Pickup"],
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: function () {
        return this.deliveryType === "Delivery";
      },
      trim: true,
    },
    deliveryTime: {
      type: String,
      enum: ["Pagi", "Siang", "Sore"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "transfer"],
      required: true,
    },
    paymentReference: {
      type: String,
      default: null,
      index: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "unpaid"],
      default: "unpaid",
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    stockRestored: {
      type: Boolean,
      default: false,
    },
    // bagian integrasi Midtrans
    midtransToken: {
      type: String,
    },
    midtransResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    customerName: {
      type: String,
    },
    customerPhone: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
