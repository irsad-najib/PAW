const express = require("express");
const router = express.Router();
const Holiday = require("../models/holiday.model");
const authenticateToken = require("../middleware/JWT");

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
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         description:
 *           type: string
 *     HolidayInput:
 *       type: object
 *       required:
 *         - name
 *         - date
 *       properties:
 *         name:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         description:
 *           type: string
 */

/**
 * @swagger
 * /api/holidays:
 *   get:
 *     summary: Dapatkan semua hari libur
 *     tags: [Holidays]
 *     responses:
 *       200:
 *         description: List hari libur berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Holiday'
 */
router.get("/", async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/holidays:
 *   post:
 *     summary: Tambah hari libur baru (Admin only)
 *     tags: [Holidays]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HolidayInput'
 *     responses:
 *       201:
 *         description: Hari libur berhasil ditambahkan
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const holiday = new Holiday(req.body);
    await holiday.save();
    res.status(201).json(holiday);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
