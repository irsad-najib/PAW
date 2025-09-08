require("dotenv").config();
const connectDB = require("./src/config/db");
const express = require("express");
const cors = require("cors");

const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

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
