const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },

    qrToken: { type: String, required: true, unique: true }, // unique token encoded in QR
    status: { type: String, enum: ["active", "ended"], default: "active" },

    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    qrExpiresAt: { type: Date, required: true },

    // students who scanned successfully
    presentStudents: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        scannedAt: { type: Date, default: Date.now },
        barcodeUsed: { type: String },
      },
    ],

    totalStudentsInSection: { type: Number, default: 0 },
    attendancePercentage: { type: Number }, // calculated when session ends
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttendanceSession", attendanceSessionSchema);
