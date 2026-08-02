const express = require("express");
const router = express.Router();
const verifyFirebaseAuth = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/rbac.middleware");
const resourceController = require("../controllers/resource.controller");

// @route   PATCH /api/resources/inventory
// @desc    Update user resource inventory
// @access  Protected (Volunteer, ResponseTeam)
router.patch(
  "/inventory",
  verifyFirebaseAuth,
  authorizeRoles("Volunteer", "ResponseTeam"),
  resourceController.updateInventory
);

router.patch(
  "/inventory/deduct",
  verifyFirebaseAuth,
  authorizeRoles("Volunteer", "ResponseTeam"),
  resourceController.deductInventory
);

module.exports = router;
