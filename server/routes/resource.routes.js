const express = require("express");
const router = express.Router();
const verifyFirebaseAuth = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/rbac.middleware");
const resourceController = require("../controllers/resource.controller");

// @route   GET /api/resources/taxonomy
// @desc    Get standardized resource taxonomy catalog
// @access  Public / Authenticated
router.get("/taxonomy", resourceController.getTaxonomy);

// @route   PATCH /api/resources/inventory
// @desc    Update user resource inventory
// @access  Protected (Volunteer, ResponseTeam)
router.patch(
  "/inventory",
  verifyFirebaseAuth,
  authorizeRoles("Volunteer", "ResponseTeam"),
  resourceController.updateInventory
);

// @route   PATCH /api/resources/inventory/deduct
// @desc    Deduct items from personal inventory upon deployment
// @access  Protected (Volunteer, ResponseTeam)
router.patch(
  "/inventory/deduct",
  verifyFirebaseAuth,
  authorizeRoles("Volunteer", "ResponseTeam"),
  resourceController.deductInventory
);

module.exports = router;
