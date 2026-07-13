// server/routes/user.routes.js
const express = require("express");
const router = express.Router();
const verifyFirebaseAuth = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/rbac.middleware");
const userController = require("../controllers/user.controller");

// @route   PATCH /api/users/toggle-volunteer
// @desc    Switch between standard User and Volunteer mode
// @access  Protected (User, Volunteer)
router.patch(
  "/toggle-volunteer",
  verifyFirebaseAuth,
  authorizeRoles("User", "Volunteer"),
  userController.toggleVolunteerMode,
);

module.exports = router;
