// server/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const verifyFirebaseAuth = require("../middleware/auth.middleware");

// @route   POST /api/auth/register
// @desc    Register a new citizen in MongoDB after Firebase frontend signup
// @access  Public (Requires Firebase Bearer Token in Headers)
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Full name is required."),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required for emergency triage."),
    body("accountType")
      .optional()
      .isIn([
        "User",
        "Volunteer",
        "Reporter",
        "ResponseTeam",
        "Admin",
        "SuperAdmin",
      ])
      .withMessage("Invalid account classification."),
    body("role")
      .optional()
      .isIn(["police", "firefighter", "civilsurgeon"])
      .withMessage("Invalid response team sub-role."),
  ],
  authController.registerOrSyncUser,
);

const { validateRegisterVetted } = require("../middleware/validators");

// @route   POST /api/auth/vetted-register or /register-vetted
// @desc    Register a vetted professional (Reporter or ResponseTeam)
// @access  Protected (Requires Firebase Bearer Token in Headers)
router.post("/vetted-register", validateRegisterVetted, authController.registerVettedProfessional);
router.post("/register-vetted", validateRegisterVetted, authController.registerVettedProfessional);

// @route   GET /api/auth/me
// @desc    Get current logged-in user profile, even when pending verification
// @access  Protected (Requires Firebase Bearer Token in Headers)
router.get("/me", verifyFirebaseAuth, authController.getCurrentUser);

// @route   POST /api/auth/login-check
// @desc    Step 1 of Login: Check if user requires Email OTP 2FA
// @access  Protected (Requires Firebase Bearer Token)
router.post("/login-check", verifyFirebaseAuth, authController.loginCheck);

// @route   POST /api/auth/send-registration-otp
// @desc    Pre-Registration Step 1: Dispatch 6-digit OTP code to email
// @access  Public
router.post("/send-registration-otp", authController.sendRegistrationOtp);

// @route   POST /api/auth/verify-registration-otp
// @desc    Pre-Registration Step 2: Validate OTP code & write user document to MongoDB
// @access  Public (Optionally includes Bearer Token)
router.post("/verify-registration-otp", authController.verifyRegistrationOtp);

// @route   POST /api/auth/verify-otp
// @desc    Step 2 of Login: Verify the 6-digit Email OTP
// @access  Protected (Requires Firebase Bearer Token + OTP in body)
router.post("/verify-otp", verifyFirebaseAuth, authController.verifyEmailOtp);

// @route   POST /api/auth/login-precheck
router.post("/login-precheck", authController.loginPrecheck);

// @route   POST /api/auth/record-login-failure
router.post("/record-login-failure", authController.recordLoginFailure);

// @route   POST /api/auth/clear-login-failure
router.post("/clear-login-failure", authController.clearLoginFailure);

module.exports = router;
