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

module.exports = router;
