const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const { normalizePhone, isValidPhone } = require("../utils/phoneValidation");
const User = require("../models/User");
const Property = require("../models/Property");
const InterestRequest = require("../models/InterestRequest");
const Counter = require("../models/Counter");
const ActivityLog = require("../models/ActivityLog");
const { auth, authorize } = require("../middleware/auth");
const { logActivity } = require("../utils/logger");

const router = express.Router();

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

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images are allowed (jpeg, jpg, png, webp, gif)!"));
    }
  },
});

// Most routes here require super_admin or employee authorization
// Specific sensitive routes (like admins/employees) will override this
router.use(auth, authorize(["super_admin", "employee"]));

// @route   GET api/superadmin/stats
// @desc    Get dashboard stats (users, admins, properties, pending requests)
// @access  Private (Super Admin)
router.get("/stats", async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    const userCount = await User.countDocuments({ role: "user" });
    const propertyCount = await Property.countDocuments({});
    const soldPropertyCount = await Property.countDocuments({ status: "sold" });
    const availablePropertyCount = await Property.countDocuments({ status: "available" });
    const pendingInquiriesCount = await InterestRequest.countDocuments({ status: "new" });

    res.json({
      admins: adminCount,
      users: userCount,
      totalProperties: propertyCount,
      soldProperties: soldPropertyCount,
      availableProperties: availablePropertyCount,
      pendingInquiries: pendingInquiriesCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching system statistics" });
  }
});

// @route   POST api/superadmin/admins
// @desc    Add a new admin
// @access  Private (Super Admin)
router.post("/admins", authorize("super_admin"), upload.single("profileImage"), async (req, res) => {
  let { name, password } = req.body;
  let { phone } = req.body;

  try {
    if (!name || !password || !phone) {
      return res.status(400).json({ error: "Please enter all required fields" });
    }

    phone = normalizePhone(phone);
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: "Invalid Indian mobile number" });
    }

    const existingUserPhone = await User.findOne({ phone });
    if (existingUserPhone) {
      return res.status(400).json({ error: "Phone number is already registered to another user" });
    }

    let profileImageUrl = "";
    if (req.file) {
      if (isCloudinaryConfigured) {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: "isiri_profiles" });
        profileImageUrl = result.secure_url;
        fs.unlinkSync(req.file.path);
      } else {
        profileImageUrl = req.file.filename;
      }
    }

    const newAdmin = new User({
      name,
      phone,
      password,
      role: "admin",
      profileImage: profileImageUrl,
    });

    await newAdmin.save();
    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        phone: newAdmin.phone,
        role: newAdmin.role,
        profileImage: newAdmin.profileImage,
      },
    });
    
    await logActivity(req, "added a new vendor", `Vendor Name: ${newAdmin.name} | Phone: ${newAdmin.phone}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Error creating admin" });
  }
});

// @route   GET api/superadmin/admins
// @desc    Get all admins list
// @access  Private (Super Admin, Employee)
router.get("/admins", authorize(["super_admin", "employee"]), async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password").sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching admins list" });
  }
});

// @route   PUT api/superadmin/admins/:id
// @desc    Edit admin details
// @access  Private (Super Admin)
router.put("/admins/:id", authorize("super_admin"), upload.single("profileImage"), async (req, res) => {
  const { name, password } = req.body;
  let { phone } = req.body;

  try {
    const admin = await User.findOne({ _id: req.params.id, role: "admin" });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (name) admin.name = name;
    
    if (phone) {
      phone = normalizePhone(phone);
      if (!isValidPhone(phone)) {
        return res.status(400).json({ error: "Invalid Indian mobile number" });
      }
      
      const existingPhone = await User.findOne({ phone, _id: { $ne: req.params.id } });
      if (existingPhone) {
        return res.status(400).json({ error: "Phone number is already used by another user" });
      }
      admin.phone = phone;
    }

    if (password) admin.password = password;

    if (req.file) {
      if (isCloudinaryConfigured) {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: "isiri_profiles" });
        admin.profileImage = result.secure_url;
        fs.unlinkSync(req.file.path);
      } else {
        admin.profileImage = req.file.filename;
      }
    }

    await admin.save();
    
    await logActivity(req, "updated a vendor account", `Vendor Name: ${admin.name} | Vendor ID: ${admin._id}`);
    
    res.json({ message: "Admin updated successfully", admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Error updating admin" });
  }
});

// @route   DELETE api/superadmin/admins/:id
// @desc    Delete an admin (they can no longer log in)
// @access  Private (Super Admin)
router.delete("/admins/:id", authorize("super_admin"), async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: "admin" });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const adminName = admin.name;
    await User.findByIdAndDelete(req.params.id);
    
    await logActivity(req, "deleted a vendor account", `Vendor Name: ${adminName} | Vendor ID: ${req.params.id}`);
    
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting admin" });
  }
});

// --- EMPLOYEE MANAGEMENT ROUTES (SUPER ADMIN ONLY) ---

// @route   POST api/superadmin/employees
// @desc    Add a new employee
// @access  Private (Super Admin)
router.post("/employees", authorize("super_admin"), upload.single("profileImage"), async (req, res) => {
  let { name, password } = req.body;
  let { phone } = req.body;

  try {
    if (!name || !password || !phone) {
      return res.status(400).json({ error: "Please enter all required fields" });
    }

    phone = normalizePhone(phone);
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: "Invalid Indian mobile number" });
    }

    const existingUserPhone = await User.findOne({ phone });
    if (existingUserPhone) {
      return res.status(400).json({ error: "Phone number is already registered to another user" });
    }

    let profileImageUrl = "";
    if (req.file) {
      if (isCloudinaryConfigured) {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: "isiri_profiles" });
        profileImageUrl = result.secure_url;
        fs.unlinkSync(req.file.path);
      } else {
        profileImageUrl = req.file.filename;
      }
    }

    const newEmployee = new User({
      name,
      phone,
      password,
      role: "employee",
      profileImage: profileImageUrl,
    });

    await newEmployee.save();
    res.status(201).json({
      message: "Employee created successfully",
      employee: {
        id: newEmployee._id,
        name: newEmployee.name,
        phone: newEmployee.phone,
        role: newEmployee.role,
        role: newEmployee.role,
        profileImage: newEmployee.profileImage,
      },
    });
    
    await logActivity(req, "added a new employee", `Employee Name: ${newEmployee.name} | Phone: ${newEmployee.phone}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Error creating employee" });
  }
});

// @route   GET api/superadmin/employees
// @desc    Get all employees list
// @access  Private (Super Admin, Employee)
router.get("/employees", authorize(["super_admin", "employee"]), async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password").sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching employees list" });
  }
});

// @route   PUT api/superadmin/employees/:id
// @desc    Edit employee details
// @access  Private (Super Admin)
router.put("/employees/:id", authorize("super_admin"), upload.single("profileImage"), async (req, res) => {
  const { name, password } = req.body;
  let { phone } = req.body;

  try {
    const employee = await User.findOne({ _id: req.params.id, role: "employee" });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (name) employee.name = name;
    
    if (phone) {
      phone = normalizePhone(phone);
      if (!isValidPhone(phone)) {
        return res.status(400).json({ error: "Invalid Indian mobile number" });
      }
      
      const existingPhone = await User.findOne({ phone, _id: { $ne: req.params.id } });
      if (existingPhone) {
        return res.status(400).json({ error: "Phone number is already used by another user" });
      }
      employee.phone = phone;
    }

    if (password) employee.password = password;

    if (req.file) {
      if (isCloudinaryConfigured) {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: "isiri_profiles" });
        employee.profileImage = result.secure_url;
        fs.unlinkSync(req.file.path);
      } else {
        employee.profileImage = req.file.filename;
      }
    }

    await employee.save();
    
    await logActivity(req, "updated an employee account", `Employee Name: ${employee.name} | Employee ID: ${employee._id}`);
    
    res.json({ message: "Employee updated successfully", employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Error updating employee" });
  }
});

// @route   DELETE api/superadmin/employees/:id
// @desc    Delete an employee
// @access  Private (Super Admin)
router.delete("/employees/:id", authorize("super_admin"), async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, role: "employee" });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const empName = employee.name;
    await User.findByIdAndDelete(req.params.id);
    
    await logActivity(req, "deleted an employee account", `Employee Name: ${empName} | Employee ID: ${req.params.id}`);
    
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting employee" });
  }
});

// @route   GET api/superadmin/users
// @desc    Get all users list
// @access  Private (Super Admin)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching users list" });
  }
});

// @route   PUT api/superadmin/users/:id/block
// @desc    Block or unblock a user
// @access  Private (Super Admin)
router.put("/users/:id/block", async (req, res) => {
  const { isBlocked } = req.body;

  try {
    const user = await User.findOne({ _id: req.params.id, role: "user" });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isBlocked = isBlocked;
    await user.save();
    res.json({ message: `User has been ${isBlocked ? "blocked" : "unblocked"} successfully`, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error blocking/unblocking user" });
  }
});

// @route   DELETE api/superadmin/users/:id
// @desc    Delete a user
// @access  Private (Super Admin)
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "user" });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userName = user.name;
    await User.findByIdAndDelete(req.params.id);
    
    await logActivity(req, "deleted a user account", `User Name: ${userName} | User ID: ${req.params.id}`);
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting user" });
  }
});

// @route   GET api/superadmin/activity-logs
// @desc    Get activity logs with optional filters
// @access  Private (Super Admin)
router.get("/activity-logs", authorize("super_admin"), async (req, res) => {
  try {
    const { startDate, endDate, role, userId } = req.query;
    let query = {};

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to the end of the specified day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Role filter
    if (role && role !== "All") {
      query.userRole = role;
    }

    // User ID filter
    if (userId) {
      query.user = userId;
    }

    const logs = await ActivityLog.find(query).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Error fetching activity logs" });
  }
});

// @route   GET api/superadmin/users-by-role
// @desc    Get users by their display role name
// @access  Private (Super Admin)
router.get("/users-by-role", authorize("super_admin"), async (req, res) => {
  try {
    const { role } = req.query;
    let dbRole = "";
    if (role === "Super Admin") dbRole = "super_admin";
    else if (role === "Vendor") dbRole = "admin";
    else if (role === "Employee") dbRole = "employee";
    
    if (!dbRole) return res.json([]);

    const users = await User.find({ role: dbRole }).select("_id name").sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users by role:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

// @route   GET api/superadmin/properties
// @desc    Get all properties (includes sold properties, with admin name & optional filter)
// @access  Private (Super Admin)
router.get("/properties", async (req, res) => {
  const { adminId } = req.query;

  try {
    let query = {};
    if (adminId) {
      if (adminId === "super_admin") {
        const superAdmin = await User.findOne({ role: "super_admin" });
        if (superAdmin) {
          query.addedBy = superAdmin._id;
        } else {
          query.addedByName = "Super Admin";
        }
      } else {
        query.addedBy = adminId;
      }
    }

    const properties = await Property.find(query).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching properties list" });
  }
});

// @route   PUT api/superadmin/properties/:id/sold
// @desc    Mark a property as sold
// @access  Private (Super Admin)
router.put("/properties/:id/sold", async (req, res) => {
  const { status } = req.body; // should be 'sold' or 'available'

  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    property.status = status || "sold";
    await property.save();
    res.json({ message: `Property status set to ${property.status}`, property });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating property status" });
  }
});

// @route   PUT api/superadmin/properties/reset-ids
// @desc    Reset all property IDs sequentially starting from 0001
// @access  Private (Super Admin)
router.put("/properties/reset-ids", async (req, res) => {
  try {
    // 1. Fetch all properties sorted by creation date
    const properties = await Property.find().sort({ createdAt: 1 });
    
    // 2. Pass 1: Assign temporary IDs to avoid MongoDB E11000 duplicate key conflicts
    for (let i = 0; i < properties.length; i++) {
      const tempId = `temp-${properties[i]._id}`;
      await Property.updateOne({ _id: properties[i]._id }, { $set: { propertyId: tempId } });
    }
    
    // 3. Pass 2: Assign the final sequential IDs
    for (let i = 0; i < properties.length; i++) {
      const seqNum = i + 1; // Start from 1
      const finalId = String(seqNum).padStart(4, "0");
      await Property.updateOne({ _id: properties[i]._id }, { $set: { propertyId: finalId } });
    }
    
    // 4. Update the Counter so new properties start from length + 2 (since seqNum in pre-save is seq - 1)
    await Counter.findOneAndUpdate(
      { id: "propertyId" },
      { seq: properties.length + 1 }, 
      { upsert: true }
    );
    
    res.json({ message: "All property reference IDs have been reset sequentially.", count: properties.length });
  } catch (error) {
    console.error("Error resetting property IDs:", error);
    res.status(500).json({ error: "Error resetting property IDs" });
  }
});

module.exports = router;
