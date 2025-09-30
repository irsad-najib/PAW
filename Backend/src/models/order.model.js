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
  },
  specialNotes: {
    type: String,
    default: "",
  },
});

// Skema utama untuk pesanan
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [orderItemSchema],
    orderDates: {
      type: [Date],
      required: true,
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
    },
    deliveryTime: {
      type: String,
      enum: ["Pagi", "Siang", "Sore"],
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "unpaid"],
      default: "unpaid",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
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

module.exports = mongoose.model("Order", orderSchema);
