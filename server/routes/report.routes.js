const express = require("express");
const router = express.Router();
const verifyFirebaseAuth = require("../middleware/auth.middleware");
const reportController = require("../controllers/report.controller");
const resourceController = require("../controllers/resource.controller");
const { authorizeRoles } = require("../middleware/rbac.middleware");
const {
  validateReportComment,
  validateReportVote,
  validateVictimRegistration,
  validateCreateReport,
  validateResources,
} = require("../middleware/validators");

router.use(verifyFirebaseAuth);

router.post("/", validateCreateReport, reportController.createReport);
router.get("/", reportController.getAllReports);
router.get("/nearby", reportController.getNearbyReports);
router.get("/:id", reportController.getReportById);
router.post("/:id/comment", validateReportComment, reportController.addReportComment);
router.post("/:id/victim", validateVictimRegistration, reportController.registerVictim);
router.delete("/:id/victim", reportController.detachVictim);
router.patch("/:id/vote", validateReportVote, reportController.voteOnReport);
router.patch("/:id/close", reportController.closeReport);
router.patch("/:id/resources-needed", reportController.updateResourcesNeeded);
router.patch(
  "/:id/resources",
  authorizeRoles("ResponseTeam"),
  validateResources,
  resourceController.commitResources
);
router.patch("/:id", reportController.updateReport);
router.delete("/:id", reportController.deleteReport);

module.exports = router;
