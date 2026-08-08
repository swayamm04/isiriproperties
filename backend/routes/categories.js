const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const { auth, authorize } = require("../middleware/auth");

// GET all categories
router.get("/", async (req, res) => {
  try {
    let query = {};
    if (req.query.listingType) {
      query.listingType = req.query.listingType;
    }
    const categories = await Category.find(query).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching categories", error: error.message });
  }
});

// POST a new category (Super Admin only)
router.post("/", auth, authorize("super_admin"), async (req, res) => {
  try {
    const { name, fields, listingType } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const typeToUse = listingType || "Sell";

    const categoryExists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, listingType: typeToUse });
    if (categoryExists) {
      return res.status(400).json({ message: "Category already exists for this listing type" });
    }

    const category = new Category({ name, fields, listingType: typeToUse });
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error creating category", error: error.message });
  }
});

// PUT update a category (Super Admin only)
router.put("/:id", auth, authorize("super_admin"), async (req, res) => {
  try {
    const { name, fields, listingType } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name || listingType) {
        const newName = name || category.name;
        const newListingType = listingType || category.listingType || "Sell";
        
        // Check name uniqueness if changed
        if (newName.toLowerCase() !== category.name.toLowerCase() || newListingType !== category.listingType) {
            const exists = await Category.findOne({ name: { $regex: new RegExp(`^${newName}$`, "i") }, listingType: newListingType });
            if (exists) {
                return res.status(400).json({ message: "Category with this name already exists for this listing type" });
            }
        }
        if (name) category.name = name;
        if (listingType) category.listingType = listingType;
    }
    
    if (fields) category.fields = fields;

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error updating category", error: error.message });
  }
});

// DELETE a category (Super Admin only)
router.delete("/:id", auth, authorize("super_admin"), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.deleteOne();
    res.json({ message: "Category removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting category", error: error.message });
  }
});

module.exports = router;
