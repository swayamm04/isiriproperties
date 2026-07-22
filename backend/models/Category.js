const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["text", "number"], // We can expand this later if needed (e.g. date, boolean)
  },
  unit: {
    type: String,
    trim: true,
  },
});

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fields: [fieldSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
