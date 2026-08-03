const User = require("../models/User");
const Report = require("../models/Report");
const Notification = require("../models/Notification");
const scoringService = require("../services/scoring.service");

// @desc    Get all users pending verification (Reporters & ResponseTeams)
// @route   GET /api/admin/pending-users
// @access  Protected (Admin, SuperAdmin)
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ verificationStatus: "pending" })
      .select("-__v -emailOtp")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers,
    });
  } catch (error) {
    console.error("[ERROR] Fetch Pending Users Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching pending verifications.",
    });
  }
};

// @desc    Approve or Reject a pending vetted user
// @route   PATCH /api/admin/users/:userId/verify
// @access  Protected (Admin, SuperAdmin)
exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, rejectionReason, reason } = req.body;
    const finalReason = rejectionReason || reason;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be either 'verified' or 'rejected'.",
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    targetUser.verificationStatus = status;
    await targetUser.save();

    const alertMessage =
      status === "verified"
        ? `Your ${targetUser.accountType} account has been verified by an Admin. You now have full operational permissions.`
        : `Your ${targetUser.accountType} application was rejected. Reason: ${finalReason || "Credentials could not be verified."}`;

    const notificationDoc = await Notification.create({
      recipientId: targetUser._id,
      referenceId: targetUser._id,
      referenceModel: "User",
      type: `account_${status}`,
      message: alertMessage,
    });

    // Real-time socket event emission to user's room
    try {
      const { emitToRoom } = require("../socket");
      emitToRoom(`user:${targetUser._id}`, "user:verification_updated", {
        userId: targetUser._id,
        verificationStatus: status,
        accountType: targetUser.accountType,
        notification: notificationDoc,
      });
    } catch (socketErr) {
      console.warn("Socket emission failed during user verification:", socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `User successfully marked as ${status}. Notification dispatched.`,
      data: targetUser,
    });
  } catch (error) {
    console.error("[ERROR] Admin User Verification Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during user verification processing.",
    });
  }
};

// @desc    Get low-trust flagged accounts (score <= -40)
// @route   GET /api/admin/flagged-users
// @access  Protected (Admin, SuperAdmin)
exports.getFlaggedUsers = async (req, res) => {
  try {
    const { threshold = -40 } = req.query;

    const flaggedUsers = await User.find({ score: { $lte: Number(threshold) } })
      .select("-__v -emailOtp")
      .sort({ score: 1 });

    return res.status(200).json({
      success: true,
      count: flaggedUsers.length,
      data: flaggedUsers,
    });
  } catch (error) {
    console.error("[ERROR] Fetch Flagged Users Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching flagged users.",
    });
  }
};

// @desc    Get escalated & suspicious reports (flagged as false or by detection)
// @route   GET /api/admin/escalated-reports
// @access  Protected (Admin, SuperAdmin)
exports.getEscalatedReports = async (req, res) => {
  try {
    const escalatedReports = await Report.find({ reliability: "false" })
      .populate("issuerId", "name email accountType score phone")
      .populate("comments.commenterId", "name email accountType")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: escalatedReports.length,
      data: escalatedReports,
    });
  } catch (error) {
    console.error("[ERROR] Fetch Escalated Reports Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching escalated reports.",
    });
  }
};

// @desc    Reset user reliability score to 0
// @route   PATCH /api/admin/users/:userId/reset-score
// @access  Protected (Admin, SuperAdmin)
exports.resetUserScore = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    targetUser.score = 0;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `Reliability score for ${targetUser.name} has been reset to 0.`,
      data: targetUser,
    });
  } catch (error) {
    console.error("[ERROR] Reset User Score Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while resetting user score.",
    });
  }
};

// @desc    Restore report reliability or confirm fake
// @route   PATCH /api/admin/reports/:id/reliability
// @access  Protected (Admin, SuperAdmin)
exports.restoreReportReliability = async (req, res) => {
  try {
    const { id } = req.params;
    const { reliability } = req.body;

    if (!["valid", "false", "none"].includes(reliability)) {
      return res.status(400).json({
        success: false,
        message: "reliability must be 'valid', 'false', or 'none'.",
      });
    }

    const reportService = require("../services/report.service");
    const report = await reportService.resolveReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    report.reliability = reliability;

    if (reliability === "valid") {
      // Restore report: clear false flag and reactivate if closed
      if (report.status === "closed") {
        report.status = "active";
        report.closedBy = null;
        report.closedAt = null;
      }
    } else if (reliability === "false") {
      // Mark as false and permanently close as fake
      report.status = "closed";
      report.closedBy = req.user._id;
      report.closedAt = new Date();
    }

    await report.save();

    // Recompute reliability score for author
    const authorId = report.issuerId?._id || report.issuerId;
    if (authorId) {
      scoringService.recomputeUserScore(authorId).catch((err) =>
        console.error("Score recompute failed after reliability update:", err.message)
      );
    }

    // Broadcast update via socket
    try {
      const { emitReportToGeoRooms } = require("../socket");
      emitReportToGeoRooms("report:vote", report, {
        reportId: report._id,
        reliability: report.reliability,
        status: report.status,
      });
    } catch (socketErr) {
      console.warn("Socket emission failed for reliability update:", socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Report reliability updated to '${reliability}' successfully.`,
      data: report,
    });
  } catch (error) {
    console.error("[ERROR] Restore Report Reliability Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while restoring report reliability.",
    });
  }
};
