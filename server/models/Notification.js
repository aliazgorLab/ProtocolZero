// backend/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // --- Recipient ---
    // References the User.js model
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --- Dynamic Reference (Polymorphic) ---
    // Points to the triggering entity (Report for incidents, User for account alerts like NID verification)
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "referenceModel",
    },
    referenceModel: {
      type: String,
      enum: ["Report", "User"],
      required: true,
      default: "Report",
    },

    // --- Notification Classification & Content ---
    // Represents the category or trigger event (e.g., 'report_created', 'report_escalated', 'account_locked')
    type: {
      type: String,
      required: true,
    },
    // Descriptive message body sent to the client
    message: {
      type: String,
      required: true,
    },

    // --- State & Tracking ---
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// --- Performance Indexing Strategy ---
// Compound index to optimize querying a user's unread notifications sorted by newest first
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
