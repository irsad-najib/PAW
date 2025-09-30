const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("../models/user.model");
const authenticateToken = require("../middleware/JWT");

// 1) Import passport core
const passport = require("passport");
// 2) Load strategi (side-effect). Jangan ditimpa variabel.
require("../config/passport");

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      tv: user.tokenVersion || 0, // token version for invalidation
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Manajemen user & autentikasi
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register user baru
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserInput'
 *     responses:
 *       201:
 *         description: User berhasil dibuat
 *       400:
 *         description: Data kurang
 *       409:
 *         description: User duplikat
 */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "username & password wajib" });
    }
    const usernameExists = await User.findOne({
      username: username.toLowerCase(),
    });
    if (usernameExists) {
      return res.status(409).json({ error: "Username sudah dipakai" });
    }
    if (email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(409).json({ error: "Email sudah terdaftar" });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.toLowerCase(),
      email: email ? email.toLowerCase() : undefined,
      password: hashedPassword,
      name: username,
    });
    // Tidak auto login: hanya kembalikan user basic
    res.status(201).json({
      message: "User berhasil didaftarkan",
      user: {
        id: user._id,
        userID: user.userID,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login (pakai userID atau UserName)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login berhasil
 *       401:
 *         description: Kredensial tidak valid
 *       500:
 *         description: Server error
 */
router.post("/login", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!password || (!email && !username)) {
      return res
        .status(400)
        .json({ error: "Butuh email atau username + password" });
    }
    const query = email
      ? { email: email.toLowerCase() }
      : { username: username.toLowerCase() };
    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ error: "Kredensial salah" });
    if (!user.password)
      return res.status(400).json({ error: "Akun ini hanya terhubung Google" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Kredensial salah" });
    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        userID: user.userID,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Users]
 */
router.post("/logout", authenticateToken, (_req, res) => {
  // With tokenVersion approach, true invalidation happens by incrementing tokenVersion.
  res.json({ message: "Logged out (client should discard token)" });
});
// Optional: server-side invalidate (bump tokenVersion) endpoint
router.post("/logout/invalidate", authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.auth.userId, { $inc: { tokenVersion: 1 } });
    res.json({ message: "Logged out & tokens invalidated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Profil user (JWT)
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId)
      .select("-password")
      .lean();
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: Ganti password (butuh password lama)
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password berhasil diganti
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Password lama salah / unauthorized
 */
router.put("/password", authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "oldPassword & newPassword wajib" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password minimal 8 karakter" });
    }
    // contoh simple policy: harus ada huruf & angka
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res
        .status(400)
        .json({ error: "Password harus mengandung huruf & angka" });
    }
    const user = await User.findById(req.auth.userId);
      user.tokenVersion = (user.tokenVersion || 0) + 1; // invalidate existing tokens
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
    if (!user.password) {
      return res
        .status(400)
        .json({
          error: "Akun ini login via Google, set password lewat proses khusus",
        });
    }
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(401).json({ error: "Password lama salah" });
    if (await bcrypt.compare(newPassword, user.password)) {
      return res
        .status(400)
        .json({ error: "Password baru tidak boleh sama dengan yang lama" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Hapus akun (hard delete)
/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: Hapus akun sendiri
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 */
router.delete("/account", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ error: "Not found" });
    await user.deleteOne();
    res.json({ message: "Akun dihapus" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Redirect OAuth Google
 *     tags: [Users]
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Callback OAuth Google
 *     tags: [Users]
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/google/fail",
  }),
  (req, res) => {
    const token = generateToken(req.user);
    res.json({ message: "Google login success", token });
  }
);

router.get("/google/fail", (_req, res) => {
  res.status(401).json({ error: "Google auth failed" });
});

module.exports = router;
