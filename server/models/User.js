const mongoose = require("mongoose");
const pointSchema = require("./PointSchema");

const userSchema = new mongoose.Schema(
  {
    // --- Core Identity ---
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, default: null },

    // --- Location & Tracking ---
    currentAddress: { type: String },
    homeAddress: { type: String },
    gps: { type: pointSchema, default: null },

    // --- Platform Metrics & State ---
    score: { type: Number, default: null },
    victimReportID: { type: String, default: null },

    // --- Role-Based Access Control ---
    accountType: {
      type: String,
      enum: ["User", "Volunteer", "Reporter", "ResponseTeam"],
      required: true,
    },

    // --- Reporter & Response Team Specific Fields ---
    nid: { type: String },
    face: { type: String }, // Link to image

    // --- Response Team Exclusive Fields ---
    officeName: { type: String },
    officeAddress: { type: String },
    role: {
      type: String,
      enum: ["police", "firefighter", "civilsurgeon"],
    },
  },
  { timestamps: true },
);

// Critical: 2dsphere index for radius-based geographical queries
userSchema.index({ gps: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
