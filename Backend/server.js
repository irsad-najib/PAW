require("dotenv").config();
const connectDB = require("./src/config/db");
const express = require("express");
const cors = require("cors");

const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
const menuRoutes = require("./src/routes/menu.routes");
const holidayRoutes = require("./src/routes/holiday.routes");
const orderRoutes = require("./src/routes/order.routes");
const notificationRoutes = require("./src/routes/notification.routes");

app.use("/api/menus", menuRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);

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
// Sampe sini


    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sample Route
app.get("/hello", (req, res) => {
  res.send("Hello World!");
});
app.get("/health", (req, res) => {
  res.send("API is healthy!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
