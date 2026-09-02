const ActivityLog = require("../models/ActivityLog");

/**
 * Logs an activity to the database.
 * @param {Object} req - The Express request object containing `req.user`.
 * @param {String} action - The action performed (e.g., "added a new property").
 * @param {String} details - Additional details (e.g., "Property ID: 1234").
 */
const logActivity = async (req, action, details = "") => {
  try {
    if (!req || !req.user) return; // Cannot log without a user context
    
    let roleStr = "User";
    if (req.user.role === "super_admin") roleStr = "Super Admin";
    else if (req.user.role === "admin") roleStr = "Vendor";
    else if (req.user.role === "employee") roleStr = "Employee";

    const log = new ActivityLog({
      user: req.user.id || req.user._id,
      userName: req.user.name || "Unknown",
      userRole: roleStr,
      action: action,
      details: details,
    });

    await log.save();
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};

module.exports = { logActivity };
