const mongoose = require("mongoose");

const interestRequestSchema = new mongoose.Schema(
  {
    user: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: { type: String, required: true },
      phone: { type: String, required: true },
      city: { type: String },
    },
    property: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true,
      },
      propertyId: { type: String, required: true },
      title: { type: String, required: true },
      location: { type: String, required: true },
      price: { type: Number, required: true },
      addedByAdminName: { type: String, required: true },
    },
    queryText: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "reviewed"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InterestRequest", interestRequestSchema);
