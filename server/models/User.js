const mongoose = require("mongoose");
const pointSchema = require("./PointSchema");

const userSchema = new mongoose.Schema(
  {
    // Core Identity & Constraints (One Citizen = One Account)
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Location Data
    currentAddress: { type: String, default: null },
    homeAddress: { type: String, default: null },
    gps: { type: pointSchema, default: null },

    // Platform Classification & State
    accountType: {
      type: String,
      enum: [
        "User",
        "Volunteer",
        "Reporter",
        "ResponseTeam",
        "Admin",
        "SuperAdmin",
      ],
      default: "User",
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ["verified", "pending", "rejected"],
      default: "verified", // Standard citizens are verified via Firebase OTP by default
    },
    score: { type: Number, default: 0 }, // Starts at 0; can go negative. Only applies to User/Volunteer.
    victimReportID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null,
    },

    // Manual Inventory Tracking (For Volunteers and Response Teams)
    inventory: [
      {
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true }, // e.g., 'packets', 'vehicles', 'units'
      },
    ],

    // Vetted Professional Fields (Mandatory for Reporter & ResponseTeam)
    nid: {
      type: String,
      default: null,
      required: function () {
        return ["Reporter", "ResponseTeam"].includes(this.accountType);
      },
    },
    face: { type: String, default: null }, // Link to verified photo ID/image

    // Office details (Applicable to ResponseTeam and Reporter)
    officeName: { type: String, default: null },
    officeAddress: { type: String, default: null },

    // Exclusive Sub-role for Response Teams
    role: {
      type: String,
      enum: ["police", "firefighter", "civilsurgeon", null],
      default: null,
    },
  },
  { timestamps: true },
);

// Geospatial Indexing for radius-based responder lookup
userSchema.index({ gps: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
