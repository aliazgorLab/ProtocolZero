const admin = require("../config/firebase");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");

// 1. Standard Citizen Registration/Sync Endpoint
exports.registerOrSyncUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No Firebase token provided." });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const { name, phone, email, currentAddress, homeAddress, accountType } =
      req.body;

    // Prevent duplicate account creation by checking unique email or phone
    let existingUser = await User.findOne({
      $or: [{ phone: phone }, { email: email || decodedToken.email }],
    });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "User already exists. Synchronized successfully.",
        data: existingUser,
      });
    }

    // Assemble user document
    const userData = {
      name,
      phone,
      email: email || decodedToken.email || null,
      currentAddress: currentAddress || null,
      homeAddress: homeAddress || null,
      accountType: accountType || "User",
      score: 0,
    };

    const newUser = await User.create(userData);

    return res.status(201).json({
      success: true,
      message: `${newUser.accountType} account synchronized successfully with MongoDB.`,
      data: newUser,
    });
  } catch (error) {
    console.error("Registration/Sync Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Conflict: An account with this phone number or email already exists in the system.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal Server Error during user synchronization.",
    });
  }
};

// 2. Vetted Professional Registration Endpoint (Reporter & Response Team)
exports.registerVettedProfessional = async (req, res) => {
  try {
    // 1. Verify Firebase Bearer Token directly
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No Firebase token provided in headers.",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const {
      name,
      phone,
      email,
      accountType,
      nid,
      face,
      officeName,
      officeAddress,
      role,
    } = req.body;

    // 2. Enforce strict mandatory fields for vetted classifications
    if (!["Reporter", "ResponseTeam"].includes(accountType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid classification. This endpoint is strictly for Reporter and Response Team registration.",
      });
    }

    if (!nid || !face) {
      return res.status(400).json({
        success: false,
        message:
          "National ID (NID) and facial verification image are strictly required for vetted roles.",
      });
    }

    if (
      accountType === "ResponseTeam" &&
      (!officeName || !officeAddress || !role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Office Name, Office Address, and Unit Role (police, firefighter, civilsurgeon) are required for Response Teams.",
      });
    }

    // 3. Check for duplicate credentials in MongoDB
    const existingUser = await User.findOne({
      $or: [{ phone }, { email: email || decodedToken.email }, { nid }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "Conflict: An account with this phone number, email, or NID already exists.",
      });
    }

    // 4. Create the vetted profile
    const newProfessional = await User.create({
      name,
      phone,
      email: email || decodedToken.email || null,
      accountType,
      nid,
      face,
      officeName: officeName || null,
      officeAddress: officeAddress || null,
      role: role || null,
      score: 0, // Vetted roles bypass public reliability scoring
      verificationStatus: "pending",
    });

    try {
      const admins = await User.find({
        accountType: { $in: ["Admin", "SuperAdmin"] },
      });

      if (admins.length > 0) {
        const adminAlerts = admins.map((adminDoc) => ({
          recipientId: adminDoc._id,
          referenceId: newProfessional._id,
          referenceModel: "User",
          type: "account_verification_pending",
          message: `New ${accountType} registration: ${name} (NID: ${nid}). Verification required.`,
        }));

        await Notification.insertMany(adminAlerts);
      }
    } catch (notifError) {
      console.error(
        "[WARNING] Failed to dispatch admin notifications:",
        notifError.message,
      );
    }

    return res.status(201).json({
      success: true,
      message: `${accountType} profile created successfully. Your account is PENDING admin verification.`,
      data: newProfessional,
    });
  } catch (error) {
    console.error("[ERROR] Vetted Registration Failure:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Conflict: A database record with these unique credentials already exists.",
      });
    }
    return res.status(500).json({
      success: false,
      message:
        "Internal server error during professional profile registration.",
    });
  }
};

// @desc    Get current logged-in user profile (Allowed even if pending verification)
exports.getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.error("[ERROR] Fetch Current User Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching user session.",
    });
  }
};
