const User = require("../models/User");
const Report = require("../models/Report");
const { RESOURCE_TAXONOMY } = require("../constants/resources");

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
 * Updates the authenticated user's currentAddress, homeAddress, gps, and inventory.
 */
exports.updateProfileAddresses = async (req, res) => {
  try {
    const { currentAddress, homeAddress, gps, currentAddressGps, homeAddressGps, inventory, avatar, face } = req.body;
    const userId = req.user._id;

    const updateData = {};

    if (avatar !== undefined) updateData.avatar = avatar;
    if (face !== undefined) updateData.face = face;
    if (currentAddress !== undefined) updateData.currentAddress = String(currentAddress).trim();
    if (homeAddress !== undefined) updateData.homeAddress = String(homeAddress).trim();

    if (gps && gps.type === "Point" && Array.isArray(gps.coordinates)) {
      updateData.gps = {
        type: "Point",
        coordinates: gps.coordinates,
      };
    }

    if (currentAddressGps && currentAddressGps.type === "Point" && Array.isArray(currentAddressGps.coordinates)) {
      updateData.currentAddressGps = {
        type: "Point",
        coordinates: currentAddressGps.coordinates,
      };
    }

    if (homeAddressGps && homeAddressGps.type === "Point" && Array.isArray(homeAddressGps.coordinates)) {
      updateData.homeAddressGps = {
        type: "Point",
        coordinates: homeAddressGps.coordinates,
      };
    }

    if (Array.isArray(inventory)) {
      updateData.inventory = inventory.map(item => {
        const tax = RESOURCE_TAXONOMY.find(r => r.id === (item.itemId || item.id));
        return {
          itemId: item.itemId || item.id,
          itemName: tax ? tax.name : item.itemName || "Resource Item",
          category: tax ? tax.category : item.category || "Supplies",
          quantity: Math.max(0, Number(item.quantity) || 0),
          unit: tax ? tax.defaultUnit : item.unit || "units",
        };
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
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
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("[ERROR] Profile Address Update Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating profile details.",
    });
  }
};

/**
 * Toggle Email OTP Two-Factor Authentication
 */
exports.toggleTwoFactor = async (req, res) => {
  try {
    const user = req.user;
    const newStatus = !user.twoFactorEnabled;

    user.twoFactorEnabled = newStatus;
    user.emailOtp = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Email OTP 2FA is now ${user.twoFactorEnabled ? "ENABLED" : "DISABLED"}.`,
      data: {
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("[ERROR] Toggle 2FA Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while toggling 2FA setting.",
    });
  }
};

/**
 * Updates the user's live GPS coordinates (when they click 'Recenter' or grant location).
 */
exports.updateLiveLocation = async (req, res) => {
  try {
    const { gps } = req.body;
    const userId = req.user._id;

    if (!gps || gps.type !== 'Point' || !Array.isArray(gps.coordinates) || gps.coordinates.length !== 2) {
      return res.status(400).json({ success: false, message: "Invalid GPS coordinates." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { gps },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Live location updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("[ERROR] Update Live Location Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating live location.",
    });
  }
};
