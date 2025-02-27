const mongoose = require("mongoose");

const MobileUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    enrollmentDate: { type: Date, default: Date.now },
    role: {
      type: String,
      required: true,
      enum: ["admin", "mobileEnumerator", "webEnumerator"],
    },
    status: {
      type: String,
      enum: ["pending", "active", "disable"],
      default: "pending",
    },
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    picture: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MobileUser", MobileUserSchema);
