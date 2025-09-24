require("dotenv").config();
const connectDB = require("./src/config/db");
const express = require("express");
const cors = require("cors");
const menuRoutes = require("./src/routes/menu.routes");
const holidayRoutes = require("./src/routes/holiday.routes");
const userRoute = require("./src/routes/user.routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const passport = require("passport");
require("./src/config/passport");

const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cors());
app.use(passport.initialize()); // (jika pakai express-session letakkan sebelum passport.initialize())

// Routes
<<<<<<< Updated upstream
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
=======
app.use("/api/menus", menuRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/auth", userRoute);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
>>>>>>> Stashed changes

app.get("/health", (req, res) => {
  res.send("API is healthy!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
