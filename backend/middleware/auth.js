const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_secret_key_isiri_properties_2026");

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Authentication failed. User not found." });
    }

    // Check if user is blocked (applicable to users)
    if (user.isBlocked) {
      return res.status(403).json({ error: "Your account has been blocked by the administrator." });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token. Please log in again." });
  }
};

// Role-based authorization middleware
const authorize = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Authentication required." });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }

    next();
  }
};

module.exports = { auth, authorize };
