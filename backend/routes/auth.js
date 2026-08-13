const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");
const OTP = require("../models/OTP");
const axios = require("axios");
const { auth } = require("../middleware/auth");
const upload = require("../utils/upload");
const { normalizePhone, isValidPhone } = require("../utils/phoneValidation");


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


// @route   POST api/auth/send-otp
// @desc    Send OTP to phone
// @access  Public
router.post("/send-otp", async (req, res) => {
  let { phone, mode } = req.body;
  try {
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    
    phone = normalizePhone(phone);
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: "Invalid Indian mobile number" });
    }

    // Check if user exists based on mode to prevent OTP abuse and confusion
    if (mode === "signup") {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ error: "Phone number already registered. Please login instead." });
      }
    } else if (mode === "login" || mode === "forgot_password") {
      const existingUser = await User.findOne({ phone });
      if (!existingUser) {
        return res.status(400).json({ error: "Phone number not found. Please register first." });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check for existing active OTP session
    let otpSession = await OTP.findOne({ phone });
    
    if (otpSession) {
      // 1. Check Cooldown (60 seconds)
      const timeSinceLastRequest = Date.now() - otpSession.lastRequestedAt.getTime();
      if (timeSinceLastRequest < 60000) {
        return res.status(429).json({ error: `Please wait ${Math.ceil((60000 - timeSinceLastRequest) / 1000)} seconds before requesting a new OTP` });
      }
      
      // 2. Check Resend Limits
      if (otpSession.resendCount >= 3) {
        return res.status(429).json({ error: "Maximum OTP resend limit reached. Please try again after 5 minutes." });
      }
      
      // Update existing session
      otpSession.otp = otp;
      otpSession.resendCount += 1;
      otpSession.lastRequestedAt = Date.now();
      otpSession.createdAt = Date.now(); // Reset the 5-minute TTL
      await otpSession.save();
    } else {
      // Create new session
      otpSession = new OTP({ phone, otp });
      await otpSession.save();
    }
    
    let otpSentSuccessfully = false;

    // 1. Try MSG91 WhatsApp OTP API
    if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
      try {
        await axios.get("https://control.msg91.com/api/v5/otp", {
          params: {
            authkey: process.env.MSG91_AUTH_KEY,
            template_id: process.env.MSG91_TEMPLATE_ID,
            mobile: `91${phone}`,
            otp: otp
          }
        });
        console.log(`[MSG91] Successfully sent OTP to ${phone} via WhatsApp`);
        otpSentSuccessfully = true;
      } catch (msgError) {
        console.warn(`[MSG91 WARNING] Failed. Error: ${msgError.response?.data?.message || msgError.message}`);
      }
    }
    
    // 2. Fallback to Console Mock if MSG91 fails (or no keys are set)
    if (!otpSentSuccessfully) {
      console.log(`[MOCK OTP FALLBACK] Sending OTP ${otp} to phone ${phone}`);
    }
    
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Critical error in send-otp:", error);
    res.status(500).json({ error: "Failed to send OTP", details: error.message });
  }
});

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post("/signup", async (req, res) => {
  let { name, phone, password, otp } = req.body;

  try {
    if (!name || !password || !phone) { // Temporarily disabled OTP check
      return res.status(400).json({ error: "Please enter all required fields" });
    }

    phone = normalizePhone(phone);
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: "Invalid Indian mobile number" });
    }

    /* --- OTP VERIFICATION TEMPORARILY DISABLED ---
    // Verify OTP
    const validOtp = await OTP.findOne({ phone });
    if (!validOtp) {
      return res.status(400).json({ error: "OTP expired or not found. Please request a new one." });
    }
    if (validOtp.otp !== otp) {
      validOtp.verificationAttempts = (validOtp.verificationAttempts || 0) + 1;
      if (validOtp.verificationAttempts >= 5) {
        await OTP.deleteOne({ _id: validOtp._id });
        return res.status(400).json({ error: "Too many failed attempts. OTP invalidated. Please request a new one." });
      }
      await validOtp.save();
      return res.status(400).json({ error: "Invalid OTP" });
    }
    ------------------------------------------------ */

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    // Create user (role defaults to "user")
    const user = new User({
      name,
      phone,
      password,
      role: "user",
    });

    await user.save();
    
    /* --- OTP VERIFICATION TEMPORARILY DISABLED ---
    // Delete OTP after successful signup
    if (validOtp) await OTP.deleteOne({ _id: validOtp._id });
    ------------------------------------------------ */

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
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `An account with this ${field} already exists` });
    }
    res.status(500).json({ error: "Server registration error", details: error.message });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  let { phone, password } = req.body;

  try {
    if (!phone || !password) {
      return res.status(400).json({ error: "Please enter phone number and password" });
    }

    phone = normalizePhone(phone);
    // Not validating explicitly for login, but normalizing is enough to match the database


    // Find user
    const user = await User.findOne({ phone });
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
    if (!currentPassword || !newPassword) { // Temporarily disabled OTP check
      return res.status(400).json({ error: "Please provide current password and new password" });
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

    /* --- OTP VERIFICATION TEMPORARILY DISABLED ---
    // Verify OTP
    if (!user.phone) {
      return res.status(400).json({ error: "No phone number associated with this account to verify OTP" });
    }

    const validOtp = await OTP.findOne({ phone: user.phone });
    if (!validOtp) {
      return res.status(400).json({ error: "OTP expired or not found. Please request a new one." });
    }
    if (validOtp.otp !== otp) {
      validOtp.verificationAttempts = (validOtp.verificationAttempts || 0) + 1;
      if (validOtp.verificationAttempts >= 5) {
        await OTP.deleteOne({ _id: validOtp._id });
        return res.status(400).json({ error: "Too many failed attempts. OTP invalidated. Please request a new one." });
      }
      await validOtp.save();
      return res.status(400).json({ error: "Invalid OTP" });
    }
    ------------------------------------------------ */

    // Update password
    user.password = newPassword;
    await user.save(); // The pre('save') hook will handle hashing automatically

    /* --- OTP VERIFICATION TEMPORARILY DISABLED ---
    // Delete OTP after successful password change
    if (typeof validOtp !== 'undefined' && validOtp) await OTP.deleteOne({ _id: validOtp._id });
    ------------------------------------------------ */

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
  let { name, phone, city, profileImage } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = name;
    if (phone) {
      phone = normalizePhone(phone);
      if (!isValidPhone(phone)) {
        return res.status(400).json({ error: "Invalid Indian mobile number" });
      }
      user.phone = phone;
    }
    if (city !== undefined) user.city = city;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Phone number already exists" });
    }
    res.status(500).json({ error: "Server error while updating profile" });
  }
});

// @route   PUT api/auth/update-phone
// @desc    Update current user's phone number
// @access  Private
router.put("/update-phone", auth, async (req, res) => {
  let { currentPassword, newPhone } = req.body;

  try {
    if (!currentPassword || !newPhone) {
      return res.status(400).json({ error: "Please provide both current password and new phone number" });
    }
    
    newPhone = normalizePhone(newPhone);
    if (!isValidPhone(newPhone)) {
      return res.status(400).json({ error: "Invalid Indian mobile number" });
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
  let { phone, otp, newPassword } = req.body;
  
  try {
    if (!phone || !newPassword) { // Temporarily disabled OTP check
      return res.status(400).json({ error: "Please provide phone and new password" });
    }
    
    phone = normalizePhone(phone);
    
    /* --- OTP VERIFICATION TEMPORARILY DISABLED ---
    // Verify OTP
    const validOtp = await OTP.findOne({ phone });
    if (!validOtp) {
      return res.status(400).json({ error: "OTP expired or not found. Please request a new one." });
    }
    if (validOtp.otp !== otp) {
      validOtp.verificationAttempts = (validOtp.verificationAttempts || 0) + 1;
      if (validOtp.verificationAttempts >= 5) {
        await OTP.deleteOne({ _id: validOtp._id });
        return res.status(400).json({ error: "Too many failed attempts. OTP invalidated. Please request a new one." });
      }
      await validOtp.save();
      return res.status(400).json({ error: "Invalid OTP" });
    }
    ------------------------------------------------ */
    
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found with this phone number" });
    }
    
    user.password = newPassword;
    await user.save();
    
    /* --- OTP VERIFICATION TEMPORARILY DISABLED ---
    if (typeof validOtp !== 'undefined' && validOtp) await OTP.deleteOne({ _id: validOtp._id });
    ------------------------------------------------ */
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during password reset" });
  }
});

module.exports = router;
