const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Generate JWT helper
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "super_secret_key_isiri_properties_2026",
    { expiresIn: "7d" }
  );
};

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post("/signup", async (req, res) => {
  const { name, email, phone, city, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please enter all required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Username or Email already registered" });
    }

    // Create user (role defaults to "user")
    const user = new User({
      name,
      email,
      phone,
      city,
      password,
      role: "user",
    });

    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role,
        wishlist: user.wishlist,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server registration error" });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter email and password" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check if blocked
    if (user.isBlocked) {
      return res.status(403).json({ error: "Your account is blocked by the Super Admin" });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role,
        wishlist: user.wishlist,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server login error" });
  }
});

// @route   GET api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("wishlist");
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server profile retrieval error" });
  }
});

module.exports = router;
