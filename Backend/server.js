require("dotenv").config();
const connectDB = require("./src/config/db");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const menuRoutes = require("./src/routes/menu.routes");
const holidayRoutes = require("./src/routes/holiday.routes");
const userRoute = require("./src/routes/user.routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const passport = require("passport");
const orderRoutes = require("./src/routes/order.routes");
const paymentRoutes = require("./src/routes/payment.routes");
const notificationRoutes = require("./src/routes/notification.routes");
require("./src/config/passport");

async function ensureAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminUsername || !adminPassword) {
      return; // tidak ada konfigurasi admin
    }
    const User = require("./src/models/user.model");
    const existing = await User.findOne({
      $or: [
        { email: adminEmail.toLowerCase() },
        { username: adminUsername.toLowerCase() },
      ],
    });
    const bcrypt = require("bcryptjs");
    if (!existing) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await User.create({
        username: adminUsername.toLowerCase(),
        email: adminEmail.toLowerCase(),
        password: hash,
        role: "admin",
        name: adminUsername,
      });
      console.log("✅ Admin user created:", adminUsername);
    } else if (existing.role !== "admin") {
      existing.role = "admin";
      if (!existing.password) {
        existing.password = await bcrypt.hash(adminPassword, 10);
      }
      await existing.save();
      console.log("✅ Elevated existing user to admin:", existing.username);
    } else {
      // Sudah admin, skip
    }
  } catch (e) {
    console.error("Failed ensuring admin:", e.message);
  }
}

async function cleanupLegacyUserIndexes() {
  try {
    const User = require("./src/models/user.model");
    const indexes = await User.collection.indexes();
    const legacy = indexes.filter((i) => i.name === "UserName_1");
    for (const idx of legacy) {
      console.log("🧹 Dropping legacy index:", idx.name);
      await User.collection.dropIndex(idx.name);
    }
    // Sinkronkan index baru sesuai schema sekarang
    await User.syncIndexes();
  } catch (e) {
    console.warn("Index cleanup warning:", e.message);
  }
}

const app = express();
connectDB();

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://paw-be-weld.vercel.app",
    "https://paw-be-weld.vercel.app",
    "https://paw-8.netlify.app",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(passport.initialize()); // (jika pakai express-session letakkan sebelum passport.initialize())

const axios = require("axios");

const FONNTE_API_URL = "https://api.fonnte.com/send";
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

// Buat testing notif
app.post("/api/notify", async (req, res) => {
  try {
    const phone = "087850846690"; // Nomer rozan buat testing (bisa diganti)
    const message = "Halo! Ini pesan test dari Fonnte 🚀";

    const response = await axios.post(
      FONNTE_API_URL,
      {
        target: phone,
        message: message,
      },
      {
        headers: {
          Authorization: FONNTE_TOKEN,
        },
      }
    );

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.use("/api/menu", menuRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/auth", userRoute);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => {
  res.json({ message: "API is healthy!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  cleanupLegacyUserIndexes().then(() => ensureAdmin());
});
