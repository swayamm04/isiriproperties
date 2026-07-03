const express = require("express");
const User = require("../models/User");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   POST api/admin/change-password
// @desc    Change password of the logged-in admin
// @access  Private (Admin only)
router.post("/change-password", auth, authorize("admin"), async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Please enter current and new passwords" });
    }

    const user = await User.findById(req.user.id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    // Set new password (will be automatically hashed by pre-save hook in User model)
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating password" });
  }
});

module.exports = router;
