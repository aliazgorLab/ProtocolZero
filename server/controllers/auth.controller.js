const admin = require("../config/firebase");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");
const { sendEmail } = require("../utils/email");

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
    const targetEmail = (email || decodedToken.email || "").toLowerCase();
    let existingUser = await User.findOne({
      $or: [{ phone: phone }, { email: targetEmail }],
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
    const targetEmail = (email || decodedToken.email || "").toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ phone }, { email: targetEmail }, { nid }],
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

// @desc    Step 1 of Login: Check if user requires Email OTP 2FA and validate roles
// @route   POST /api/auth/login-check
// @access  Protected (Requires Firebase Bearer Token)
exports.loginCheck = async (req, res) => {
  try {
    const user = req.user;
    const { loginType } = req.body;

    // Enforce login portal isolation
    if (loginType === 'citizen' && !['User', 'Volunteer'].includes(user.accountType)) {
      return res.status(403).json({ success: false, message: "Invalid portal for your account type. Please use the Vetted Professional or Admin login." });
    }
    
    if (loginType === 'vetted' && !['Reporter', 'ResponseTeam'].includes(user.accountType)) {
      return res.status(403).json({ success: false, message: "Invalid portal. This portal is strictly for Vetted Professionals (Reporters and Response Teams)." });
    }

    if (loginType === 'admin' && !['Admin', 'SuperAdmin'].includes(user.accountType)) {
      return res.status(403).json({ success: false, message: "Invalid portal. Administrators only." });
    }

    // Case A: Extra security layer is turned OFF -> Immediate Login
    if (!user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        requiresOtp: false,
        message: "Login successful.",
        data: user,
      });
    }

    // Case B: Extra security layer is turned ON -> Generate 6-Digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    user.emailOtp = generatedOtp;
    user.otpExpires = expiryTime;
    await user.save();

    console.log(`\n=========================================`);
    console.log(`[DEV OTP ALERT] Code for ${user.email}: [ ${generatedOtp} ]`);
    console.log(`=========================================\n`);

    // Call helper to send real email (or simulate in console if env is empty)
    await sendEmail({
      to: user.email,
      subject: "Your Protocol Zero Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #6200ee; text-align: center;">Protocol Zero</h2>
          <h3 style="color: #333333; text-align: center; margin-top: 0;">Secure Two-Factor Authentication</h3>
          <p>Hello,</p>
          <p>You are receiving this message because two-factor authentication is enabled for your account. Please use the following 6-digit code to log in:</p>
          <div style="font-size: 28px; font-weight: bold; text-align: center; letter-spacing: 6px; padding: 15px; background-color: #f3e8ff; border: 1px dashed #6200ee; border-radius: 6px; margin: 20px 0; color: #6200ee;">
            ${generatedOtp}
          </div>
          <p>This code is valid for 10 minutes. If you did not request this login, please change your password immediately.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="font-size: 11px; color: #999; text-align: center;">This is a system generated notification. Please do not reply directly to this email.</p>
        </div>
      `,
    });

    return res.status(202).json({
      success: true,
      requiresOtp: true,
      message: `An OTP has been sent to ${user.email}. Please verify to complete login.`,
      email: user.email,
    });
  } catch (error) {
    console.error("[ERROR] Login Check Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login verification.",
    });
  }
};

// @desc    Step 2 of Login: Verify the 6-digit Email OTP
// @route   POST /api/auth/verify-otp
// @access  Protected (Requires Firebase Bearer Token + OTP in body)
exports.verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide the 6-digit OTP code.",
      });
    }

    // 1. Check if OTP matches
    if (user.emailOtp !== otp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP code. Please try again.",
      });
    }

    // 2. Check if OTP has expired
    if (user.otpExpires < new Date()) {
      return res.status(401).json({
        success: false,
        message: "OTP code has expired. Please request a new one.",
      });
    }

    // 3. Success! Clear the OTP fields from database so code cannot be reused
    user.emailOtp = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      requiresOtp: false,
      message: "Two-factor authentication verified. Welcome back!",
      data: user,
    });
  } catch (error) {
    console.error("[ERROR] OTP Verification Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during OTP verification.",
    });
  }
};

