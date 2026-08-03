const express = require("express");
const router = express.Router();
const verifyFirebaseAuth = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/rbac.middleware");
const adminController = require("../controllers/admin.controller");

router.use(verifyFirebaseAuth, authorizeRoles("Admin", "SuperAdmin"));

// @route   GET /api/admin/pending-users
// @desc    Get pending professional applications (Reporters & ResponseTeams)
router.get("/pending-users", adminController.getPendingUsers);

// @route   PATCH /api/admin/users/:userId/verify
// @desc    Approve or reject a pending vetted application
router.patch("/users/:userId/verify", adminController.verifyUser);

// @route   GET /api/admin/flagged-users
// @desc    Get low-trust flagged accounts (score <= -40)
router.get("/flagged-users", adminController.getFlaggedUsers);

// @route   PATCH /api/admin/users/:userId/reset-score
// @desc    Reset a user's reliability score to 0
router.patch("/users/:userId/reset-score", adminController.resetUserScore);

// @route   GET /api/admin/escalated-reports
// @desc    Get escalated & suspicious reports (flagged as false)
router.get("/escalated-reports", adminController.getEscalatedReports);

// @route   PATCH /api/admin/reports/:id/reliability
// @desc    Restore report reliability or mark as false fake
router.patch("/reports/:id/reliability", adminController.restoreReportReliability);

module.exports = router;
