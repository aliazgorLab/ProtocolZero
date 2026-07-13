const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc    Get all users pending verification
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ verificationStatus: "pending" })
      .select("-__v")
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
exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, rejectionReason } = req.body;

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
        ? `Your ${targetUser.accountType} account has been verified by an Admin. You now have full broadcast permissions.`
        : `Your ${targetUser.accountType} application was rejected. Reason: ${rejectionReason || "Credentials could not be verified."}`;

    await Notification.create({
      recipientId: targetUser._id,
      referenceId: targetUser._id,
      referenceModel: "User",
      type: `account_${status}`,
      message: alertMessage,
    });

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
