const express = require("express");
const Holiday = require("../models/holiday.model");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Holidays
 *   description: Data hari libur (rentang tanggal)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Holiday:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         startDate: { type: string, format: date }
 *         endDate: { type: string, format: date }
 *         reason: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateHolidayInput:
 *       type: object
 *       required: [startDate, endDate]
 *       properties:
 *         startDate: { type: string, format: date, example: "2025-09-01" }
 *         endDate: { type: string, format: date, example: "2025-09-03" }
 *         reason: { type: string, example: "Libur Nasional" }
 *     CheckHolidayInput:
 *       type: object
 *       required: [date]
 *       properties:
 *         date: { type: string, format: date, example: "2025-09-02" }
 *     CheckHolidayResult:
 *       type: object
 *       properties:
 *         isHoliday: { type: boolean }
 *         reason: { type: string, nullable: true }
 */

// CREATE holiday (tambah libur baru)
/**
 * @swagger
 * /api/holiday:
 *   post:
 *     summary: Tambah hari libur (rentang tanggal)
 *     tags: [Holidays]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHolidayInput'
 *     responses:
 *       201:
 *         description: Dibuat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Holiday'
 *       400:
 *         description: Validasi gagal
 *       500:
 *         description: Error server
 */
router.post("/", async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "startDate dan endDate wajib diisi" });
    }

    const holiday = new Holiday({ startDate, endDate, reason });
    await holiday.save();
    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ semua holiday

/**
 * @swagger
 * /api/holiday:
 *   get:
 *     summary: Ambil semua hari libur
 *     tags: [Holidays]
 *     responses:
 *       200:
 *         description: Daftar holiday
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Holiday' }
 *       500:
 *         description: Error server
 */
router.get("/", async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ startDate: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ 1 holiday by ID
/**
 * @swagger
 * /api/holiday/{id}:
 *   get:
 *     summary: Ambil detail holiday
 *     tags: [Holidays]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detail holiday
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Holiday' }
 *       404:
 *         description: Tidak ditemukan
 *       500:
 *         description: Error server
 */
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
/**
 * @swagger
 * /api/holiday/{id}:
 *   put:
 *     summary: Update holiday
 *     tags: [Holidays]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Holiday' }
 *       404:
 *         description: Tidak ditemukan
 *       400:
 *         description: Data tidak valid
 *       500:
 *         description: Error server
 */
router.put("/:id", async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!holiday) return res.status(404).json({ message: "Holiday not found" });
    res.json(holiday);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE holiday
/**
 * @swagger
 * /api/holiday/{id}:
 *   delete:
 *     summary: Hapus holiday
 *     tags: [Holidays]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Dihapus
 *       404:
 *         description: Tidak ditemukan
 *       500:
 *         description: Error server
 */
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
/**
 * @swagger
 * /api/holiday/check:
 *   post:
 *     summary: Cek apakah suatu tanggal termasuk rentang libur
 *     tags: [Holidays]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckHolidayInput'
 *     responses:
 *       200:
 *         description: Hasil cek
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckHolidayResult'
 *       400:
 *         description: Input kurang
 *       500:
 *         description: Error server
 */
router.post("/check", async (req, res) => {
  try {
    const { date } = req.body; // format: "2025-09-13"
    if (!date) return res.status(400).json({ message: "Tanggal wajib diisi" });

    const queryDate = new Date(date);
    const holiday = await Holiday.findOne({
      startDate: { $lte: queryDate },
      endDate: { $gte: queryDate },
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
