const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
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
    { userId: user._id, role: user.Role },
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
 * /api/user/register:
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
    const { userID, UserName, password, Role } = req.body;
    if (!userID || !UserName || !password) {
      return res
        .status(400)
        .json({ message: "userID, UserName, password wajib" });
    }

    const existing = await User.findOne({
      $or: [{ userID }, { UserName }],
    });
    if (existing) {
      return res.status(409).json({ message: "User sudah ada" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      userID,
      UserName,
      password: hashed,
      Role: Role || "user",
    });

    res.status(201).json({
      message: "Registered",
      user: {
        id: user._id,
        userID: user.userID,
        UserName: user.UserName,
        Role: user.Role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login (pakai userID atau UserName)
 *     tags: [Users]
 */
router.post("/login", async (req, res) => {
  try {
    const { userID, UserName, password } = req.body;
    if ((!userID && !UserName) || !password) {
      return res
        .status(400)
        .json({ message: "userID/UserName & password wajib" });
    }

    const user = await User.findOne(userID ? { userID } : { UserName });
    if (!user) return res.status(401).json({ message: "User tidak ditemukan" });

    if (!user.password) {
      return res
        .status(401)
        .json({ message: "Akun OAuth tidak bisa login password" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Password salah" });

    const token = generateToken(user);
    res.json({ message: "Login sukses", token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Users]
 */
router.post("/logout", (_req, res) => {
  try {
    // Jika pakai cookie:
    res.clearCookie("authToken");
    res.json({ message: "Logout" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Profil user (JWT)
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .lean();
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * @swagger
 * /api/user/google:
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
 * /api/user/google/callback:
 *   get:
 *     summary: Callback OAuth Google
 *     tags: [Users]
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/user/google/fail",
  }),
  (req, res) => {
    const token = generateToken(req.user);
    res.json({ message: "Google login success", token });
  }
);

router.get("/google/fail", (_req, res) => {
  res.status(401).json({ message: "Google auth failed" });
});

module.exports = router;
