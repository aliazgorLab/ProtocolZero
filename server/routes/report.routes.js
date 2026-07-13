const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const verifyFirebaseAuth = require("../middleware/auth.middleware");
const reportController = require("../controllers/report.controller");

const validateReportComment = [
    body("text")
        .exists({ checkFalsy: true })
        .withMessage("Comment is required.")
        .isString()
        .withMessage("Comment must be a string.")
        .trim()
        .notEmpty()
        .withMessage("Comment is required.")
        .isLength({ max: 500 })
        .withMessage("Comment must not exceed 500 characters."),
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                data: {
                    errors: errors.array().map((error) => ({
                        field: error.path,
                        message: error.msg,
                    })),
                },
            });
        }

        next();
    },
];

const validateReportVote = [
    body("type")
        .exists({ checkFalsy: true })
        .withMessage("Vote type is required.")
        .isIn(["upvote", "downvote"])
        .withMessage('Vote type must be either "upvote" or "downvote".'),
    body("comment")
        .optional({ nullable: true })
        .isString()
        .withMessage("Comment must be a string.")
        .trim()
        .isLength({ max: 500 })
        .withMessage("Comment must not exceed 500 characters."),
    body("type").custom((value, { req }) => {
        if (value === "downvote") {
            if (!req.body.comment || !String(req.body.comment).trim()) {
                throw new Error("Comment is required for downvotes.");
            }
        }

        return true;
    }),
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                data: {
                    errors: errors.array().map((error) => ({
                        field: error.path,
                        message: error.msg,
                    })),
                },
            });
        }

        next();
    },
];

const validateVictimRegistration = [
    body("gps")
        .exists({ checkFalsy: true })
        .withMessage("GPS is required.")
        .custom((value) => {
            if (!value || typeof value !== "object" || Array.isArray(value)) {
                throw new Error("gps must be a GeoJSON Point object.");
            }

            if (value.type !== "Point") {
                throw new Error('gps.type must be "Point".');
            }

            if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
                throw new Error("gps.coordinates must be an array with [lng, lat].");
            }

            const [lng, lat] = value.coordinates;
            const parsedLng = Number(lng);
            const parsedLat = Number(lat);

            if (!Number.isFinite(parsedLng) || !Number.isFinite(parsedLat)) {
                throw new Error("gps.coordinates must contain valid numeric values.");
            }

            if (parsedLng < -180 || parsedLng > 180) {
                throw new Error("Longitude must be between -180 and 180.");
            }

            if (parsedLat < -90 || parsedLat > 90) {
                throw new Error("Latitude must be between -90 and 90.");
            }

            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                data: {
                    errors: errors.array().map((error) => ({
                        field: error.path,
                        message: error.msg,
                    })),
                },
            });
        }

        next();
    },
];

router.use(verifyFirebaseAuth);

router.post("/", reportController.createReport);
router.get("/nearby", reportController.getNearbyReports);
router.get("/:id", reportController.getReportById);
router.post("/:id/comment", ...validateReportComment, reportController.addReportComment);
router.post("/:id/victim", ...validateVictimRegistration, reportController.registerVictim);
router.patch("/:id/vote", ...validateReportVote, reportController.voteOnReport);
router.patch("/:id", reportController.updateReport);
router.delete("/:id", reportController.deleteReport);

module.exports = router;
