const express = require("express");
const router = express.Router();
const verifyFirebaseAuth = require("../middleware/auth.middleware");
const reportController = require("../controllers/report.controller");

router.use(verifyFirebaseAuth);

router.post("/", reportController.createReport);
router.get("/nearby", reportController.getNearbyReports);
router.get("/:id", reportController.getReportById);
router.patch("/:id", reportController.updateReport);
router.delete("/:id", reportController.deleteReport);

module.exports = router;
