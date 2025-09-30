const express = require("express");
const router = express.Router();
const Menu = require("../models/menu.model");
const authenticateToken = require("../middleware/JWT");

function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }
  next();
}

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Manajemen menu
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Menu:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         category:
 *           type: string
 *         image:
 *           type: string
 *         stock:
 *           type: number
 *         date:
 *           type: string
 *           format: date
 *         isAvailable:
 *           type: boolean
 *     MenuInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         category:
 *           type: string
 *         image:
 *           type: string
 *         stock:
 *           type: number
 *         date:
 *           type: string
 *           format: date
 *         isAvailable:
 *           type: boolean
 */

/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary: Dapatkan semua menu
 *     tags: [Menu]
 *     responses:
 *       200:
 *         description: List menu berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Menu'
 */
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.all !== "true") filter.isAvailable = true;
    if (req.query.date) {
      const d = new Date(req.query.date);
      if (!isNaN(d.getTime())) {
        const start = new Date(d.setHours(0, 0, 0, 0));
        const end = new Date(d.setHours(23, 59, 59, 999));
        filter.date = { $gte: start, $lte: end };
      }
    }
    if (req.query.q) filter.name = { $regex: req.query.q, $options: "i" };

    // Pagination
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Menu.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Menu.countDocuments(filter),
    ]);
    res.json({ page, limit, total, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/menu/{id}:
 *   get:
 *     summary: Dapatkan menu berdasarkan ID
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       404:
 *         description: Menu tidak ditemukan
 */
router.get("/:id", async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: "Menu tidak ditemukan" });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/menu:
 *   post:
 *     summary: Tambah menu baru (Admin only)
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuInput'
 *     responses:
 *       201:
 *         description: Menu berhasil ditambahkan
 *       401:
 *         description: Tidak terautentikasi
 *       403:
 *         description: Tidak memiliki akses
 */
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, price, description, stock, date, isAvailable } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Name is required" });
    }
    if (price == null || isNaN(price) || Number(price) < 0) {
      return res
        .status(400)
        .json({ message: "Price must be a positive number" });
    }
    const doc = new Menu({
      name: name.trim(),
      price: Number(price),
      description: description?.trim(),
      stock: stock != null ? Number(stock) : undefined,
      date: date ? new Date(date) : undefined,
      isAvailable: typeof isAvailable === "boolean" ? isAvailable : undefined,
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT full replace (Admin)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, price, description, stock, date, isAvailable } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ message: "Name & price required" });
    }
    const update = {
      name: name.trim(),
      price: Number(price),
      description: description?.trim() || undefined,
      stock: stock != null ? Number(stock) : 0,
      date: date ? new Date(date) : undefined,
      isAvailable: typeof isAvailable === "boolean" ? isAvailable : true,
    };
    const doc = await Menu.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: "Menu not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PATCH partial update (Admin)
router.patch("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allowed = [
      "name",
      "price",
      "description",
      "stock",
      "date",
      "isAvailable",
    ];
    const updates = {};
    for (const k of Object.keys(req.body)) {
      if (allowed.includes(k)) {
        if (k === "price" || k === "stock") updates[k] = Number(req.body[k]);
        else if (k === "date") updates[k] = new Date(req.body[k]);
        else updates[k] = req.body[k];
      }
    }
    if (updates.name) updates.name = updates.name.trim();
    const doc = await Menu.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: "Menu not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE (Admin)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const doc = await Menu.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Menu not found" });
    res.json({ message: "Deleted", id: doc._id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Toggle availability (Admin)
router.post(
  "/:id/toggle",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const doc = await Menu.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Menu not found" });
      doc.isAvailable = !doc.isAvailable;
      await doc.save();
      res.json({ id: doc._id, isAvailable: doc.isAvailable });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

module.exports = router;
