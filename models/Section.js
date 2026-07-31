const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. "CSE-A"
    department: { type: String, required: true },
    year: { type: Number, required: true }, // e.g. 3rd year
  },
  { timestamps: true }
);

module.exports = mongoose.model("Section", sectionSchema);
