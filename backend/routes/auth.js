const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");
const OTP = require("../models/OTP");
const axios = require("axios");
const { auth } = require("../middleware/auth");
const upload = require("../utils/upload");

// Configure Cloudinary if credentials exist in .env
let isCloudinaryConfigured = false;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isCloudinaryConfigured = true;
}

const router = express.Router();

// Generate JWT helper
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "super_secret_key_isiri_properties_2026",
    { expiresIn: "7d" }
  );
};

// @route   POST api/auth/get-phone-by-email
// @desc    Get masked phone by email for forgot password
// @access  Public
router.post("/get-phone-by-email", async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found with this email" });
    }
    if (!user.phone) {
      return res.status(400).json({ error: "No phone number associated with this account" });
    }
    
    // Mask phone number (e.g. +91 9876543210 -> ******3210)
    const phoneStr = user.phone.toString();
    const maskedPhone = phoneStr.length > 4 
      ? '*'.repeat(phoneStr.length - 4) + phoneStr.slice(-4) 
      : phoneStr;
      
    res.json({ maskedPhone, phone: user.phone });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST api/auth/send-otp
// @desc    Send OTP to phone
// @access  Public
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  try {
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await OTP.deleteMany({ phone });
    
    const newOtp = new OTP({ phone, otp });
    await newOtp.save();
    
    if (process.env.FAST2SMS_API_KEY) {
      await axios.get("https://www.fast2sms.com/dev/bulkV2", {
        params: {
          authorization: process.env.FAST2SMS_API_KEY,
          variables_values: otp,
          route: "otp",
          numbers: phone,
        }
      });
    } else {
      console.log(`[MOCK FAST2SMS] Sending OTP ${otp} to phone ${phone}`);
    }
    
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post("/signup", async (req, res) => {
  const { name, email, phone, city, password, otp } = req.body;

  try {
    if (!name || !email || !password || !phone || !otp) {
      return res.status(400).json({ error: "Please enter all required fields including OTP" });
    }

    // Verify OTP
    const validOtp = await OTP.findOne({ phone, otp });
    if (!validOtp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
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
    
    // Delete OTP after successful signup
    await OTP.deleteOne({ _id: validOtp._id });

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

// @route   PUT api/auth/update-password
// @desc    Update current user's password
// @access  Private
router.put("/update-password", auth, async (req, res) => {
  const { currentPassword, newPassword, otp } = req.body;

  try {
    if (!currentPassword || !newPassword || !otp) {
      return res.status(400).json({ error: "Please provide current password, new password, and OTP" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    // Verify OTP
    if (!user.phone) {
      return res.status(400).json({ error: "No phone number associated with this account to verify OTP" });
    }

    const validOtp = await OTP.findOne({ phone: user.phone, otp });
    if (!validOtp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Update password
    user.password = newPassword;
    await user.save(); // The pre('save') hook will handle hashing automatically

    // Delete OTP after successful password change
    await OTP.deleteOne({ _id: validOtp._id });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error while updating password" });
  }
});

// @route   PUT api/auth/update-profile
// @desc    Update current user's profile (name, phone, city)
// @access  Private
router.put("/update-profile", auth, async (req, res) => {
  const { name, phone, city } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (city !== undefined) user.city = city;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error while updating profile" });
  }
});

// @route   PUT api/auth/update-phone
// @desc    Update current user's phone number
// @access  Private
router.put("/update-phone", auth, async (req, res) => {
  const { currentPassword, newPhone } = req.body;

  try {
    if (!currentPassword || !newPhone) {
      return res.status(400).json({ error: "Please provide both current password and new phone number" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    // Update phone
    user.phone = newPhone;
    await user.save(); 

    res.json({ message: "Phone number updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error while updating phone number" });
  }
});

// @route   PUT api/auth/update-profile-image
// @desc    Update current user's profile image
// @access  Private
router.put("/update-profile-image", auth, upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload an image" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "isiri_profiles" });
      user.profileImage = result.secure_url;
      fs.unlinkSync(req.file.path);
    } else {
      user.profileImage = req.file.filename;
    }

    await user.save();
    res.json({ message: "Profile image updated successfully", profileImage: user.profileImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error while updating profile image" });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Reset password using OTP
// @access  Public
router.post("/forgot-password", async (req, res) => {
  const { phone, otp, newPassword } = req.body;
  
  try {
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ error: "Please provide phone, OTP and new password" });
    }
    
    // Verify OTP
    const validOtp = await OTP.findOne({ phone, otp });
    if (!validOtp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found with this phone number" });
    }
    
    user.password = newPassword;
    await user.save();
    
    await OTP.deleteOne({ _id: validOtp._id });
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during password reset" });
  }
});

module.exports = router;
