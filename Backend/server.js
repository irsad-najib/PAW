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
const paymentRoutes = require("./src/routes/payment.routes");

app.use("/api/menus", menuRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

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
