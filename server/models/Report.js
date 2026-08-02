const mongoose = require("mongoose");
const pointSchema = require("./PointSchema");

const reportSchema = new mongoose.Schema(
  {
    postId: { type: String, required: true, unique: true },
    issuerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updaterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    //For Auditing purpose
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    closedAt: { type: Date, default: null },

    type: {
      type: String,
      enum: ["minor", "major", "predictive"],
      default: "minor",
      required: true,
    },

    // --- Geospatial Data ---
    // Primary location:
    location: { type: pointSchema, required: true },

    // Multi-point blast/impact zones: Used when type === 'major' or 'predictive'
    impactAreas: [
      {
        coordinate: { type: pointSchema, required: true },
        radius: { type: Number, required: true }, // Radius in meters
      },
    ],

    // --- Incident Details ---
    time: { type: Date, default: Date.now }, // When the incident actually occurred
    category: { type: String, default: null },
    description: { type: String, default: null },
    image: [{ type: String }], // Array of image URLs/Cloudinary links

    victims: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        gpsStatus: { type: String, enum: ["success", "failed"], default: "success" },
        gpsFallback: { type: Boolean, default: false },
      },
    ],

    resourcesNeeded: [
      {
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true },
      },
    ],

    resourcesCommitted: [
      {
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        location: { type: pointSchema, default: null },
      },
    ],

    // --- Community Verification Engine ---
    vote: {
      upvote: { type: Number, default: 0 },
      downvote: { type: Number, default: 0 },
      upvoterId: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      downvoterId: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },

    reliability: {
      type: String,
      enum: ["none", "valid", "false"],
      default: "none",
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },

    // --- Community Discussion ---
    comments: [
      {
        text: { type: String, required: true },
        commenterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // --- Tracking & History ---
    updaterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    closedAt: { type: Date },

    editHistory: [
      {
        editorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        editedAt: { type: Date, default: Date.now },
        previousState: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// --- Virtual Properties ---
// Dynamically calculates credibility score on the fly during API serialization
reportSchema.virtual("score").get(function () {
  if (!this.vote) return 0;
  return (this.vote.upvote || 0) - (this.vote.downvote || 0);
});

// --- Database Indexing Strategy ---
// 1. Core geospatial index for finding nearby incidents ($near / $geoWithin)
reportSchema.index({ location: "2dsphere" });

// 2. Secondary spatial index for querying inside multi-point blast zones
reportSchema.index({ "impactAreas.coordinate": "2dsphere" });

// 3. Compound index to optimize dashboard feeds that filter by status and type while sorting by newest
reportSchema.index({ status: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
