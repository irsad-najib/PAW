const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user.model");

const authenticateToken = async (req, res, next) => {
  try {
    let token;
    // Prioritas: Authorization header Bearer
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.authToken) {
      // Fallback cookie (opsional jika nanti ingin cookie mode)
      token = req.cookies.authToken;
    }

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.sub || decoded.userId || decoded._id;
    const user = await User.findById(userId).select("tokenVersion role isActive");
    if (!user || user.isActive === false) {
      return res.status(401).json({ error: "Invalid or inactive user" });
    }
    if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ error: "Token invalidated" });
    }
    req.auth = { userId, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authenticateToken;
