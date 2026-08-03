const Notification = require("../models/Notification");

// @desc    Get user notifications (paginated)
// @route   GET /api/notifications
// @access  Protected
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ read: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipientId: req.user._id });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: notifications,
    });
  } catch (error) {
    console.error("[ERROR] Fetch Notifications Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching notifications.",
    });
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Protected
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipientId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or unauthorized.",
      });
    }

    if (notification.read) {
      return res.status(200).json({
        success: true,
        message: "Notification is already marked as read.",
        data: notification,
      });
    }

    notification.read = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    console.error("[ERROR] Mark Notification Read Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating notification.",
    });
  }
};

// @desc    Mark all notifications for the authenticated user as read
// @route   PATCH /api/notifications/read-all
// @access  Protected
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("[ERROR] Mark All Notifications Read Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating notifications.",
    });
  }
};
