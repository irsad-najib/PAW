const express = require("express");
const Holiday = require("../models/holiday.model");
const router = express.Router();

// CREATE holiday (tambah libur baru)
router.post("/", async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate dan endDate wajib diisi" });
    }

    const holiday = new Holiday({ startDate, endDate, reason });
    await holiday.save();
    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ semua holiday
router.get("/", async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ startDate: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ 1 holiday by ID
router.get("/:id", async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) return res.status(404).json({ message: "Holiday not found" });
    res.json(holiday);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE holiday
router.put("/:id", async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!holiday) return res.status(404).json({ message: "Holiday not found" });
    res.json(holiday);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE holiday
router.delete("/:id", async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ message: "Holiday not found" });
    res.json({ message: "Holiday deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CEK apakah tanggal tertentu libur
router.post("/check", async (req, res) => {
  try {
    const { date } = req.body; // format: "2025-09-13"
    if (!date) return res.status(400).json({ message: "Tanggal wajib diisi" });

    const queryDate = new Date(date);
    const holiday = await Holiday.findOne({
      startDate: { $lte: queryDate },
      endDate: { $gte: queryDate }
    });

    if (holiday) {
      return res.json({ isHoliday: true, reason: holiday.reason });
    } else {
      return res.json({ isHoliday: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
