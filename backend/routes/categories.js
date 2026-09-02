const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const { auth, authorize } = require("../middleware/auth");
const { logActivity } = require("../utils/logger");

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

// POST a new category (Super Admin, Employee)
router.post("/", auth, authorize(["super_admin", "employee"]), async (req, res) => {
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
    
    await logActivity(req, "added a new category", `Category Name: ${category.name}`);

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error creating category", error: error.message });
  }
});

// PUT update a category (Super Admin, Employee)
router.put("/:id", auth, authorize(["super_admin", "employee"]), async (req, res) => {
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
    
    await logActivity(req, "updated a category", `Category Name: ${category.name}`);
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error updating category", error: error.message });
  }
});

// DELETE a category (Super Admin, Employee)
router.delete("/:id", auth, authorize(["super_admin", "employee"]), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const catName = category.name;
    await category.deleteOne();
    
    await logActivity(req, "deleted a category", `Category Name: ${catName}`);
    
    res.json({ message: "Category removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting category", error: error.message });
  }
});

module.exports = router;
