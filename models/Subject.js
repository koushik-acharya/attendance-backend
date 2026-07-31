const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Data Structures"
    code: { type: String, required: true }, // e.g. "CS201"
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // teachers who can take this subject
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
