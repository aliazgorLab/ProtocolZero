const express = require("express");
const router = express.Router();
const verifyFirebaseAuth = require("../middleware/auth.middleware");
const notificationController = require("../controllers/notification.controller");

// @route   GET /api/notifications
// @desc    Get user notifications (paginated)
// @access  Protected
router.get("/", verifyFirebaseAuth, notificationController.getNotifications);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Protected
router.patch("/:id/read", verifyFirebaseAuth, notificationController.markAsRead);

module.exports = router;
