const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  startDate: { type: Date, required: true },          // libur mulai kapan
  endDate: { type: Date, required: true },            // libur sampai kapan
  reason: { type: String, default: "Libur" }          // alasan libur (opsional)
}, { timestamps: true });

module.exports = mongoose.model("Holiday", holidaySchema);
