const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher"], required: true },

    // Student-only fields
    srn: { type: String, unique: true, sparse: true }, // e.g. PES1UG21CS001
    idCardBarcode: { type: String, unique: true, sparse: true }, // barcode value on ID card
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },

    // Teacher-only fields
    employeeId: { type: String, unique: true, sparse: true },
    department: { type: String },

    // Profile picture stored as a base64 data URI (e.g. "data:image/jpeg;base64,...")
    profilePicture: { type: String },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);