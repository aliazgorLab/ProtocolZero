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
    const targetEmail = (
      email ||
      decodedToken.email ||
      `${phone.replace(/\+/g, "")}@protocolzero.local`
    ).toLowerCase();

    const conflictConditions = [
      phone ? { phone } : null,
      targetEmail ? { email: targetEmail } : null,
      nid ? { nid } : null,
    ].filter(Boolean);

    const existingUser = await User.findOne({ $or: conflictConditions });

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
      email: targetEmail,
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
    console.error("[ERROR] Vetted Registration Failure:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'credentials';
      return res.status(409).json({
        success: false,
        message: `Conflict: An account with this ${field} already exists in the system.`,
      });
    }
    if (error.name === 'ValidationError') {
      const validationDetails = Object.values(error.errors).map(err => err.message).join("; ");
      return res.status(400).json({
        success: false,
        message: `Validation Error: ${validationDetails}`,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during professional profile registration.",
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

    // Enforce verification status check (Pending or Rejected accounts CANNOT log in)
    if (user.verificationStatus === 'pending') {
      return res.status(403).json({
        success: false,
        message: "Your account application is currently under review by system administrators. You cannot log in until an admin approves your credentials."
      });
    }

    if (user.verificationStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: "Your registration application was rejected by system administrators."
      });
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

const crypto = require("crypto");
const otpLockoutMap = new Map(); // email -> { attempts: number, lockUntil: number }

const getLockoutInfo = (email) => {
  const normEmail = (email || "").toLowerCase().trim();
  const record = otpLockoutMap.get(normEmail);
  if (!record) return { isLocked: false, attempts: 0 };
  if (Date.now() > record.lockUntil) {
    otpLockoutMap.delete(normEmail);
    return { isLocked: false, attempts: 0 };
  }
  const remainingMins = Math.ceil((record.lockUntil - Date.now()) / 60000);
  return { isLocked: true, attempts: record.attempts, remainingMins };
};

const recordFailedOtpAttempt = (email) => {
  const normEmail = (email || "").toLowerCase().trim();
  const record = otpLockoutMap.get(normEmail) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockUntil = Date.now() + 10 * 60 * 1000; // 10 minutes lock
  }
  otpLockoutMap.set(normEmail, record);
  return record;
};

const clearOtpLockout = (email) => {
  const normEmail = (email || "").toLowerCase().trim();
  otpLockoutMap.delete(normEmail);
};

const passwordLockoutMap = new Map(); // email -> { attempts: number, lockUntil: number }

const getPasswordLockoutInfo = (email) => {
  const normEmail = (email || "").toLowerCase().trim();
  const record = passwordLockoutMap.get(normEmail);
  if (!record) return { isLocked: false, attempts: 0 };
  if (Date.now() > record.lockUntil) {
    passwordLockoutMap.delete(normEmail);
    return { isLocked: false, attempts: 0 };
  }
  const remainingMins = Math.ceil((record.lockUntil - Date.now()) / 60000);
  return { isLocked: true, attempts: record.attempts, remainingMins };
};

const recordFailedPasswordAttempt = (email) => {
  const normEmail = (email || "").toLowerCase().trim();
  const record = passwordLockoutMap.get(normEmail) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockUntil = Date.now() + 10 * 60 * 1000; // 10 minutes lockout
  }
  passwordLockoutMap.set(normEmail, record);
  return record;
};

const clearPasswordLockout = (email) => {
  const normEmail = (email || "").toLowerCase().trim();
  passwordLockoutMap.delete(normEmail);
};

// @desc    Pre-check if email is currently locked out from password attempts
// @route   POST /api/auth/login-precheck
exports.loginPrecheck = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(200).json({ success: true, isLocked: false });

    const lockout = getPasswordLockoutInfo(email);
    if (lockout.isLocked) {
      return res.status(429).json({
        success: false,
        isLocked: true,
        message: `Too many failed password attempts. Login attempts for this account are suspended for ${lockout.remainingMins} more minute(s).`,
      });
    }

    return res.status(200).json({ success: true, isLocked: false });
  } catch (error) {
    return res.status(200).json({ success: true, isLocked: false });
  }
};

// @desc    Record a failed password attempt
// @route   POST /api/auth/record-login-failure
exports.recordLoginFailure = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required." });

    const targetEmail = email.trim().toLowerCase();
    const lockout = getPasswordLockoutInfo(targetEmail);

    if (lockout.isLocked) {
      return res.status(429).json({
        success: false,
        isLocked: true,
        message: `Too many failed password attempts. Login suspended for ${lockout.remainingMins} more minute(s).`,
      });
    }

    const record = recordFailedPasswordAttempt(targetEmail);
    if (record.attempts >= 5) {
      return res.status(429).json({
        success: false,
        isLocked: true,
        message: "Maximum password attempts (5/5) exceeded. Login suspended for 10 minutes.",
      });
    }

    const remaining = 5 - record.attempts;
    return res.status(400).json({
      success: false,
      attempts: record.attempts,
      message: `Invalid email or password. You have ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before a 10-minute lockout.`,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid email or password." });
  }
};

// @desc    Clear password lockout counter on successful password login
// @route   POST /api/auth/clear-login-failure
exports.clearLoginFailure = async (req, res) => {
  try {
    const { email } = req.body;
    if (email) clearPasswordLockout(email);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(200).json({ success: true });
  }
};

const generateRegistrationToken = (email, phone, otp) => {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  const otpHash = crypto.createHmac("sha256", JWT_SECRET).update(`${otp}:${email}:${expiresAt}`).digest("hex");
  const payload = JSON.stringify({ email, phone, expiresAt, otpHash });
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ payload, signature })).toString("base64");
};

const verifyRegistrationTokenHelper = (tokenStr, inputOtp) => {
  try {
    const decoded = JSON.parse(Buffer.from(tokenStr, "base64").toString("utf-8"));
    const { payload, signature } = decoded;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false, message: "Invalid registration token signature." };
    }

    const { email, phone, expiresAt, otpHash } = JSON.parse(payload);
    if (Date.now() > expiresAt) {
      return { valid: false, message: "Registration OTP has expired. Please request a new verification code." };
    }

    const inputHash = crypto.createHmac("sha256", JWT_SECRET).update(`${inputOtp}:${email}:${expiresAt}`).digest("hex");
    if (inputHash !== otpHash) {
      return { valid: false, message: "Incorrect OTP code. Please check your email and try again." };
    }

    return { valid: true, email, phone };
  } catch (err) {
    return { valid: false, message: "Malformed or invalid registration token." };
  }
};

// @desc    Pre-Registration Step 1: Send 6-Digit Email OTP
// @route   POST /api/auth/send-registration-otp
// @access  Public
exports.sendRegistrationOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Email address and phone number are required for OTP verification.",
      });
    }

    const targetEmail = email.trim().toLowerCase();
    const targetPhone = phone.trim();

    // Check if account is locked out from too many failed OTP attempts
    const lockout = getLockoutInfo(targetEmail);
    if (lockout.isLocked) {
      return res.status(429).json({
        success: false,
        message: `Too many failed OTP attempts. Account registration is locked for ${lockout.remainingMins} more minute(s).`,
      });
    }

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({
      $or: [{ phone: targetPhone }, { email: targetEmail }],
    });

    if (existingUser) {
      const isMatchingEmail = existingUser.email.toLowerCase() === targetEmail;
      const matchedField = isMatchingEmail ? `email address (${targetEmail})` : `phone number (${targetPhone})`;

      if (existingUser.verificationStatus === 'pending') {
        return res.status(409).json({
          success: false,
          message: `An account application with this ${matchedField} is currently PENDING Admin verification. Please wait for an administrator to review your credentials.`,
        });
      }
      if (existingUser.verificationStatus === 'rejected') {
        return res.status(409).json({
          success: false,
          message: `A registration application with this ${matchedField} was rejected by system administrators.`,
        });
      }
      return res.status(409).json({
        success: false,
        message: `An account with this ${matchedField} already exists in the system. Please proceed to the login portal.`,
      });
    }

    // Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const tempRegistrationToken = generateRegistrationToken(targetEmail, targetPhone, generatedOtp);

    console.log(`\n=========================================`);
    console.log(`[DEV PRE-REGISTRATION OTP] Code for ${targetEmail}: [ ${generatedOtp} ]`);
    console.log(`=========================================\n`);

    // Send email
    await sendEmail({
      to: targetEmail,
      subject: "Protocol Zero - Account Registration Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #6200ee; text-align: center;">Protocol Zero</h2>
          <h3 style="color: #333333; text-align: center; margin-top: 0;">Email Registration Verification</h3>
          <p>Hello,</p>
          <p>Thank you for registering with Protocol Zero. Please use the following 6-digit verification code to complete your registration:</p>
          <div style="font-size: 28px; font-weight: bold; text-align: center; letter-spacing: 6px; padding: 15px; background-color: #f3e8ff; border: 1px dashed #6200ee; border-radius: 6px; margin: 20px 0; color: #6200ee;">
            ${generatedOtp}
          </div>
          <p>This verification code is valid for 10 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="font-size: 11px; color: #999; text-align: center;">This is an automated system notification.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit OTP verification code has been sent to ${targetEmail}.`,
      tempRegistrationToken,
      email: targetEmail,
    });
  } catch (error) {
    console.error("[ERROR] Send Registration OTP Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during pre-registration OTP dispatch.",
    });
  }
};

// @desc    Pre-Registration Step 2: Verify OTP & Finalize MongoDB User Account
// @route   POST /api/auth/verify-registration-otp
// @access  Public (Optionally includes Bearer Token)
exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { tempRegistrationToken, otp, registrationPayload } = req.body;

    if (!tempRegistrationToken || !otp || !registrationPayload) {
      return res.status(400).json({
        success: false,
        message: "Missing required registration verification parameters (tempRegistrationToken, otp, registrationPayload).",
      });
    }

    const targetEmail = (registrationPayload?.email || "").trim().toLowerCase();

    // 1. Check if user is locked out
    const lockout = getLockoutInfo(targetEmail);
    if (lockout.isLocked) {
      return res.status(429).json({
        success: false,
        message: `Too many failed OTP attempts. Account registration is locked for ${lockout.remainingMins} more minute(s).`,
      });
    }

    // 2. Verify OTP
    const verifyResult = verifyRegistrationTokenHelper(tempRegistrationToken, otp);
    if (!verifyResult.valid) {
      const attemptRecord = recordFailedOtpAttempt(targetEmail);
      if (attemptRecord.attempts >= 5) {
        return res.status(429).json({
          success: false,
          message: "Maximum OTP verification attempts (5/5) exceeded. Registration is locked for 10 minutes.",
        });
      }
      const remaining = 5 - attemptRecord.attempts;
      return res.status(401).json({
        success: false,
        message: `${verifyResult.message} (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`,
      });
    }

    // On success: clear lockout counter
    clearOtpLockout(targetEmail);

    const {
      name,
      phone,
      email,
      password,
      accountType = "User",
      nid,
      face,
      avatar,
      officeName,
      officeAddress,
      role,
      inventory,
      homeAddress,
      homeAddressGps,
      currentAddress,
      currentAddressGps,
      gps
    } = registrationPayload;

    const userEmail = (email || verifyResult.email || targetEmail || "").toLowerCase();
    const targetPhone = phone || verifyResult.phone;

    // Check duplicate in DB before creating
    let existingUser = await User.findOne({
      $or: [{ phone: targetPhone }, { email: userEmail }],
    });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "Account already registered and verified.",
        data: existingUser,
      });
    }

    // Synchronize / Create user account in Firebase Authentication
    let firebaseUid = null;
    try {
      let fbUser;
      try {
        fbUser = await admin.auth().getUserByEmail(userEmail);
      } catch (notFoundErr) {
        if (password) {
          try {
            fbUser = await admin.auth().createUser({
              email: userEmail,
              password: password,
              displayName: name,
              phoneNumber: targetPhone.startsWith("+") ? targetPhone : undefined,
            });
          } catch (phoneErr) {
            fbUser = await admin.auth().createUser({
              email: userEmail,
              password: password,
              displayName: name,
            });
          }
        }
      }
      if (fbUser?.uid) {
        firebaseUid = fbUser.uid;
      }
    } catch (fbSyncErr) {
      console.warn("[WARN] Firebase Auth sync in verifyRegistrationOtp failed:", fbSyncErr.message);
    }

    // Determine verification status
    const isVetted = ["Reporter", "ResponseTeam"].includes(accountType);
    const verificationStatus = isVetted ? "pending" : "verified";

    const userData = {
      name,
      phone: targetPhone,
      email: userEmail,
      accountType,
      verificationStatus,
      firebaseUid,
      score: 0,
    };

    if (nid) userData.nid = nid;
    if (face) userData.face = face;
    if (avatar) userData.avatar = avatar;
    if (officeName) userData.officeName = officeName;
    if (officeAddress) userData.officeAddress = officeAddress;
    if (role) userData.role = role;
    if (Array.isArray(inventory)) userData.inventory = inventory;
    if (homeAddress) userData.homeAddress = homeAddress;
    if (homeAddressGps) userData.homeAddressGps = homeAddressGps;
    if (currentAddress) userData.currentAddress = currentAddress;
    if (currentAddressGps) userData.currentAddressGps = currentAddressGps;
    if (gps) userData.gps = gps;

    // Optional Firebase Token resolution
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const idToken = authHeader.split(" ")[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        if (decodedToken?.uid) {
          userData.firebaseUid = decodedToken.uid;
        }
      } catch (fbErr) {
        console.warn("Optional Firebase token decoding failed in verifyRegistrationOtp:", fbErr.message);
      }
    }

    const newUser = await User.create(userData);

    // If vetted account, send admin notification
    if (isVetted) {
      try {
        const adminUsers = await User.find({ accountType: { $in: ["Admin", "SuperAdmin"] } });
        const notifDocs = adminUsers.map(a => ({
          recipientId: a._id,
          referenceId: newUser._id,
          referenceModel: "User",
          type: "vetted_application",
          message: `New ${newUser.accountType} application pending verification: ${newUser.name} (${newUser.email}).`,
        }));
        if (notifDocs.length > 0) {
          await Notification.insertMany(notifDocs);
        }
      } catch (nErr) {
        console.warn("Failed to dispatch admin notification for vetted app:", nErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `${newUser.accountType} account verified & registered successfully!`,
      data: newUser,
    });
  } catch (error) {
    console.error("[ERROR] Verify Registration OTP Failure:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Conflict: An account with this phone number or email already exists in the system.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error during registration OTP verification.",
    });
  }
};

