const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    verificationAttempts: {
      type: Number,
      default: 0,
    },
    lastRequestedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // 5 minutes TTL
    },
  }
);

module.exports = mongoose.model("OTP", otpSchema);
