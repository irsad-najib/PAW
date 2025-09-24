const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = async (req, res, next) => {
  // Log all cookies untuk debugging
  console.log("All Cookies:", req.cookies);
  try {
    const token = req.cookies.authToken;

    // Periksa token existence
    if (!token || token === "null" || token === "undefined") {
      console.log("No valid auth token found:", token);
      return res.status(401).json({
        isAuthenticated: false,
        error: "Authentication required",
      });
    }

    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user info ke request object
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    console.log("Authentication successful for user:", req.user);

    // Kirim response untuk endpoint verify-session
    if (req.path === "/api/auth/verify-session") {
      return res.json({
        isAuthenticated: true,
        user: {
          userId: decoded.userId,
          role: decoded.role,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Authentication failed:", error.message);
    return res.status(401).json({
      isAuthenticated: false,
      error: "Authentication failed",
    });
  }
};

module.exports = authenticateToken;
