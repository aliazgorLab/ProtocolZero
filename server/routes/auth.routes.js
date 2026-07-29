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

// @route   POST /api/auth/register-vetted
// @desc    Register a vetted professional (Reporter or ResponseTeam)
// @access  Protected (Requires Firebase Bearer Token in Headers)
router.post("/register-vetted", authController.registerVettedProfessional);

// @route   GET /api/auth/me
// @desc    Get current logged-in user profile, even when pending verification
// @access  Protected (Requires Firebase Bearer Token in Headers)
router.get("/me", verifyFirebaseAuth, authController.getCurrentUser);

// @route   POST /api/auth/login-check
// @desc    Step 1 of Login: Check if user requires Email OTP 2FA
// @access  Protected (Requires Firebase Bearer Token)
router.post("/login-check", verifyFirebaseAuth, authController.loginCheck);

// @route   POST /api/auth/verify-otp
// @desc    Step 2 of Login: Verify the 6-digit Email OTP
// @access  Protected (Requires Firebase Bearer Token + OTP in body)
router.post("/verify-otp", verifyFirebaseAuth, authController.verifyEmailOtp);

module.exports = router;
