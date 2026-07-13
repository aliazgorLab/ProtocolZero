const express = require("express");
const router = express.Router();
const verifyFirebaseAuth = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/rbac.middleware");
const adminController = require("../controllers/admin.controller");

router.use(verifyFirebaseAuth, authorizeRoles("Admin", "SuperAdmin"));

router.get("/pending-users", adminController.getPendingUsers);
router.patch("/users/:userId/verify", adminController.verifyUser);

module.exports = router;
