// server/controllers/user.controller.js
const User = require("../models/User");
const Report = require("../models/Report");

/**
 * Toggles a user's accountType between 'User' and 'Volunteer'.
 * Enforces safety guardrail: blocks opt-out if assigned to an active incident.
 */
exports.toggleVolunteerMode = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentStatus = req.user.accountType;

    // Only allow citizens and volunteers to use this toggle
    if (!["User", "Volunteer"].includes(currentStatus)) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: Vetted professionals (Reporters/Response Teams) cannot toggle into volunteer mode.",
      });
    }

    // Case A: Standard User opting IN to become a Volunteer
    if (currentStatus === "User") {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { accountType: "Volunteer" },
        { new: true },
      );

      return res.status(200).json({
        success: true,
        message:
          "Status upgraded to Volunteer. You will now receive regional emergency broadcast alerts.",
        data: updatedUser,
      });
    }

    // Case B: Volunteer attempting to opt OUT back to standard User
    if (currentStatus === "Volunteer") {
      // Safety Guardrail Check: Verify if the volunteer has committed resources to any active reports
      const activeCommitments = await Report.findOne({
        status: "active",
        "resourcesCommitted.providerId": userId,
      });

      if (activeCommitments) {
        return res.status(409).json({
          success: false,
          message:
            "Action Blocked: You cannot withdraw from Volunteer mode while currently assigned or committed to an active emergency report. Please complete or unassign your tasks first.",
          activeReportId: activeCommitments.postId,
        });
      }

      // Safe to revert
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { accountType: "User" },
        { new: true },
      );

      return res.status(200).json({
        success: true,
        message:
          "Status reverted to standard User. Volunteer broadcast alerts disabled.",
        data: updatedUser,
      });
    }
  } catch (error) {
    console.error("[ERROR] Volunteer Toggle Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while toggling volunteer mode.",
    });
  }
};

/**
 * Updates the authenticated user's currentAddress, homeAddress, and gps only.
 * Ownership is enforced by using req.user._id; no other profile fields are changed.
 */
exports.updateProfileAddresses = async (req, res) => {
  try {
    const { currentAddress, homeAddress, gps } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        currentAddress: currentAddress.trim(),
        homeAddress: homeAddress.trim(),
        gps: {
          type: gps.type,
          coordinates: gps.coordinates,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile addresses updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("[ERROR] Profile Address Update Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating profile addresses.",
    });
  }
};
