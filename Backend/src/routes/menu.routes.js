const express = require("express");
const router = express.Router();
const Menu = require("../models/menu.model");
const authenticateToken = require("../middleware/JWT");
const upload = require("../middleware/upload");

function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }
  next();
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
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
router.post("/", authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('📥 Request Body:', req.body);
    console.log('📷 File:', req.file ? 'Uploaded to ' + req.file.path : 'No file');
    
    const { name, price, description, stock, date, isAvailable } = req.body;
    
    // Validasi
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ message: "Name is required and must be non-empty" });
    }
    if (price == null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "Price must be a positive number" });
    }
    
    const imageUrl = req.file ? req.file.path : null;
    
    const parsedIsAvailable = parseBoolean(isAvailable);
    
    const doc = new Menu({
      name: name.trim(),
      price: Number(price),
      description: description?.trim() || undefined,
      stock: stock != null ? Number(stock) : undefined,
      date: date ? new Date(date) : undefined,
      image: imageUrl,
      isAvailable: parsedIsAvailable !== undefined ? parsedIsAvailable : undefined,
    });
    
    console.log('💾 Document to save:', doc);
    
    await doc.save();
    
    console.log('✅ Saved successfully:', doc._id);
    
    res.status(201).json({ message: "Menu berhasil dibuat", menu: doc });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT full replace (Admin)
router.put("/:id", authenticateToken, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, price, description, stock, date, isAvailable } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ message: "Name & price required" });
    }
    
    // ✅ PERBAIKAN: Handle both JSON & form-data
    const parsedIsAvailable = parseBoolean(isAvailable);
    
    const existing = await Menu.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Menu not found" });

    const imagePath = req.file
      ? req.file.path
      : req.body.image?.trim() || existing.image;

    existing.name = name.trim();
    existing.price = Number(price);
    existing.description = description?.trim() || undefined;
    existing.stock = stock != null ? Number(stock) : 0;
    existing.date = date ? new Date(date) : undefined;
    existing.isAvailable =
      parsedIsAvailable !== undefined ? parsedIsAvailable : existing.isAvailable;
    existing.image = imagePath;

    const saved = await existing.save();
    res.json(saved);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PATCH partial update (Admin)
router.patch("/:id", authenticateToken, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const allowed = [
      "name",
      "price",
      "description",
      "stock",
      "image",
      "date",
      "isAvailable",
    ];
    const doc = await Menu.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Menu not found" });

    for (const k of Object.keys(req.body)) {
      if (!allowed.includes(k)) continue;
      if (k === "price" || k === "stock") {
        doc[k] = Number(req.body[k]);
      } else if (k === "date") {
        doc[k] = new Date(req.body[k]);
      } else if (k === "isAvailable") {
        const p = parseBoolean(req.body[k]);
        if (p !== undefined) doc[k] = p;
      } else if (k === "name" || k === "description") {
        doc[k] = req.body[k]?.trim();
      } else {
        doc[k] = req.body[k];
      }
    }

    if (req.file) {
      doc.image = req.file.path;
    }

    const saved = await doc.save();
    res.json(saved);
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
