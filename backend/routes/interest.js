const express = require("express");
const InterestRequest = require("../models/InterestRequest");
const Property = require("../models/Property");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   POST api/interest
// @desc    Submit a user interest request for a property
// @access  Private (User only)
router.post("/", auth, authorize("user"), async (req, res) => {
  const { propertyId, queryText } = req.body;

  try {
    if (!propertyId || !queryText) {
      return res.status(400).json({ error: "Property ID and query message are required" });
    }

    // Find the property to get details
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Create the interest request
    const newRequest = new InterestRequest({
      user: {
        id: req.user._id,
        name: req.user.name,
        phone: req.user.phone,
        city: req.user.city,
        email: req.user.email,
      },
      property: {
        id: property._id,
        propertyId: property.propertyId,
        title: property.title,
        location: property.location,
        price: property.price,
        addedByAdminName: property.addedByName,
      },
      queryText,
      status: "new",
    });

    await newRequest.save();
    res.status(201).json({ message: "Your interest query has been sent to the Super Admin.", newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error submitting interest request" });
  }
});

// @route   GET api/interest
// @desc    Get all interest requests (sorted with 'new' on top, 'reviewed' on bottom)
// @access  Private (Super Admin only)
router.get("/", auth, authorize("super_admin"), async (req, res) => {
  try {
    // Sorting by status: 'new' first, then 'reviewed'.
    // In alphabetical order, 'new' comes before 'reviewed', but sorting custom status works beautifully
    // if we query pending/new and reviewed separately, or use a custom aggregation, or sort by status (ascending: "new" then "reviewed")
    // and then sort by createdAt descending. Let's do that!
    // Since "new" < "reviewed" alphabetically, sorting ascending on status will put "new" on top!
    const requests = await InterestRequest.find({})
      .sort({ status: 1, createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error retrieving interest queries" });
  }
});

// @route   PUT api/interest/:id/review
// @desc    Mark an interest request as reviewed
// @access  Private (Super Admin only)
router.put("/:id/review", auth, authorize("super_admin"), async (req, res) => {
  const { status } = req.body; // should be 'reviewed'

  try {
    const request = await InterestRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Interest request not found" });
    }

    request.status = status || "reviewed";
    await request.save();
    res.json({ message: `Query marked as ${request.status}`, request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating request status" });
  }
});

module.exports = router;
