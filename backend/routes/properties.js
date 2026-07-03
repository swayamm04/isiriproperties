const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const Property = require("../models/Property");
const User = require("../models/User");
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
  console.log("Cloudinary Media Engine Initialized.");
} else {
  console.log("Cloudinary credentials not set. Falling back to local disk storage.");
}

// Multer Storage Configuration for temporary local uploads
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

// @route   GET api/properties
// @desc    Get all properties (with search & filters)
// @access  Public
router.get("/", async (req, res) => {
  const { search, type, price, status } = req.query;

  try {
    let query = {};

    // Filter by status (default to available if not specified)
    if (status) {
      query.status = status;
    } else {
      query.status = "available";
    }

    // Keyword Search (title, location)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    // Property Type
    if (type) {
      query.type = type;
    }

    // Maximum Price
    if (price) {
      query.price = { $lte: Number(price) };
    }

    const properties = await Property.find(query).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching properties" });
  }
});

// @route   GET api/properties/admin/my-list
// @desc    Get properties added by the logged-in admin
// @access  Private (Admin only)
router.get("/admin/my-list", auth, authorize("admin"), async (req, res) => {
  try {
    const properties = await Property.find({ addedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching admin's properties" });
  }
});

// @route   GET api/properties/:id
// @desc    Get property by ID or propertyId (e.g. 0000)
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let property;

    // Check if ID is a valid MongoDB ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      property = await Property.findById(id);
    } else {
      // Find by sequential custom propertyId
      property = await Property.findOne({ propertyId: id });
    }

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching property details" });
  }
});

// @route   POST api/properties
// @desc    Create a new property (Upload files + form data)
// @access  Private (Admin & Super Admin)
router.post("/", auth, authorize(["admin", "super_admin"]), upload.array("imageFiles", 6), async (req, res) => {
  try {
    const { title, description, location, price, beds, baths, area, type, imageUrls } = req.body;

    if (!title || !description || !location || !price || !area) {
      return res.status(400).json({ error: "Please provide all required fields" });
    }

    let images = [];

    // 1. Process uploaded files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (isCloudinaryConfigured) {
          try {
            // Upload local file to Cloudinary
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "i_siri_properties",
            });
            images.push(result.secure_url);
            
            // Delete temp local file after successful Cloudinary upload
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error deleting local temp file:", err);
            });
          } catch (uploadError) {
            console.error("Cloudinary upload failure, fallback to local file:", uploadError);
            images.push(`/uploads/${file.filename}`);
          }
        } else {
          // Serve locally if Cloudinary config is missing
          images.push(`/uploads/${file.filename}`);
        }
      }
    }

    // 2. Process image URLs (if any, provided as comma-separated or array)
    if (imageUrls) {
      let urls = Array.isArray(imageUrls)
        ? imageUrls
        : imageUrls.split(",").map((url) => url.trim());
      urls.forEach((url) => {
        if (url) images.push(url);
      });
    }

    // 3. Fallback to default if no image is provided
    if (images.length === 0) {
      images.push("/prop-1.png"); // Default mockup image
    }

    const newProperty = new Property({
      title,
      description,
      location,
      price: Number(price),
      images,
      beds: Number(beds) || 0,
      baths: Number(baths) || 0,
      area,
      type: type || "Villa",
      addedBy: req.user._id,
      addedByName: req.user.role === "super_admin" ? "Super Admin" : req.user.name,
      status: "available",
    });

    await newProperty.save();
    res.status(201).json(newProperty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Error creating property" });
  }
});

// @route   POST api/properties/wishlist/:id
// @desc    Add or remove a property from the user's wishlist
// @access  Private (User only)
router.post("/wishlist/:id", auth, authorize("user"), async (req, res) => {
  try {
    const propertyId = req.params.id;
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const user = await User.findById(req.user.id);
    const wishlistIndex = user.wishlist.indexOf(propertyId);

    let isWishlisted = false;
    if (wishlistIndex > -1) {
      // Remove from wishlist
      user.wishlist.splice(wishlistIndex, 1);
    } else {
      // Add to wishlist
      user.wishlist.push(propertyId);
      isWishlisted = true;
    }

    await user.save();
    res.json({ isWishlisted, wishlist: user.wishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error managing wishlist" });
  }
});

module.exports = router;
