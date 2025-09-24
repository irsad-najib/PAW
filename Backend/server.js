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

const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cors());
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
app.use("/api/menus", menuRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", userRoute);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => {
  res.json({ message: "API is healthy!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
