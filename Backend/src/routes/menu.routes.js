const express = require("express");
const Menu = require("../models/menu.model");
const router = express.Router();

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
 *         _id: { type: string }
 *         name: { type: string }
 *         price: { type: number }
 *         category: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateMenuInput:
 *       type: object
 *       required: [name, price]
 *       properties:
 *         name: { type: string, example: "Nasi Goreng" }
 *         price: { type: number, example: 25000 }
 *         category: { type: string, example: "Makanan" }
 *     UpdateMenuInput:
 *       type: object
 *       properties:
 *         name: { type: string, example: "Nasi Goreng Spesial" }
 *         price: { type: number, example: 30000 }
 *         category: { type: string, example: "Makanan" }
 */

// CREATE menu
/**
 * @swagger
 * /api/menu:
 *   post:
 *     summary: Tambah menu
 *     tags: [Menu]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMenuInput'
 *     responses:
 *       201:
 *         description: Menu dibuat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       400:
 *         description: Data invalid
 *       500:
 *         description: Error server
 */
router.post("/", async (req, res) => {
  try {
    const { name, price, category } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: "name dan price wajib diisi" });
    }
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ message: "price harus angka >= 0" });
    }

    const menu = await Menu.create({ name, price, category });
    res.status(201).json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ semua menu
/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary: List semua menu
 *     tags: [Menu]
 *     responses:
 *       200:
 *         description: Daftar menu
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Menu' }
 *       500:
 *         description: Error server
 */
router.get("/", async (req, res) => {
  try {
    const menus = await Menu.find().sort({ createdAt: -1 }).lean();
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ satu menu by ID
/**
 * @swagger
 * /api/menu/{id}:
 *   get:
 *     summary: Ambil detail menu
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detail menu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       404:
 *         description: Menu tidak ditemukan
 *       500:
 *         description: Error server
 */
router.get("/:id", async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ message: "Menu not found" });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE menu
/**
 * @swagger
 * /api/menu/{id}:
 *   put:
 *     summary: Update menu
 *     tags: [Menu]
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
 *             $ref: '#/components/schemas/UpdateMenuInput'
 *     responses:
 *       200:
 *         description: Menu diupdate
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       400:
 *         description: Data invalid
 *       404:
 *         description: Menu tidak ditemukan
 *       500:
 *         description: Error server
 */
router.put("/:id", async (req, res) => {
  try {
    const { price } = req.body;
    if (price !== undefined) {
      if (typeof price !== "number" || price < 0) {
        return res.status(400).json({ message: "price harus angka >= 0" });
      }
    }

    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!menu) return res.status(404).json({ message: "Menu not found" });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE menu
/**
 * @swagger
 * /api/menu/{id}:
 *   delete:
 *     summary: Hapus menu
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Menu dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         description: Menu tidak ditemukan
 *       500:
 *         description: Error server
 */
router.delete("/:id", async (req, res) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) return res.status(404).json({ message: "Menu not found" });
    res.json({ message: "Menu deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
