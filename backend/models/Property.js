const mongoose = require("mongoose");
const Counter = require("./Counter");

const propertySchema = new mongoose.Schema(
  {
    propertyId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    images: {
      type: [String],
      required: true,
    },
    beds: {
      type: Number,
      default: 0,
    },
    baths: {
      type: Number,
      default: 0,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Villa", "Chalet", "Penthouse"],
      default: "Villa",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addedByName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-increment hook for propertyId
propertySchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  try {
    const counter = await Counter.findOneAndUpdate(
      { id: "propertyId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seqNum = counter.seq - 1;
    this.propertyId = String(seqNum).padStart(4, "0");
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Property", propertySchema);
