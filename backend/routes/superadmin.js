const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");
const Property = require("../models/Property");
const InterestRequest = require("../models/InterestRequest");
const { auth, authorize } = require("../middleware/auth");

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

// All routes here require super_admin authorization
router.use(auth, authorize("super_admin"));

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
router.post("/admins", upload.single("profileImage"), async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "Please enter all required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email or username is already registered" });
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
      email,
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
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role,
        profileImage: newAdmin.profileImage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating admin" });
  }
});

// @route   GET api/superadmin/admins
// @desc    Get all admins list
// @access  Private (Super Admin)
router.get("/admins", async (req, res) => {
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
router.put("/admins/:id", upload.single("profileImage"), async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    const admin = await User.findOne({ _id: req.params.id, role: "admin" });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    if (email) {
      if (email !== admin.email) {
        const existing = await User.findOne({ email });
        if (existing) {
          return res.status(400).json({ error: "Email is already registered" });
        }
        admin.email = email;
      }
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
    res.json({ message: "Admin updated successfully", admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating admin" });
  }
});

// @route   DELETE api/superadmin/admins/:id
// @desc    Delete an admin (they can no longer log in)
// @access  Private (Super Admin)
router.delete("/admins/:id", async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: "admin" });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting admin" });
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

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting user" });
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

module.exports = router;
