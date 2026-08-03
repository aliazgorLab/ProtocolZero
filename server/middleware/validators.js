const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
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
};

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
  handleValidationErrors,
];

const validateReportVote = [
  body("type")
    .customSanitizer((val, { req }) => val || req.body.vote)
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
  handleValidationErrors,
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
      if (!Number.isFinite(Number(lng)) || !Number.isFinite(Number(lat))) {
        throw new Error("gps.coordinates must contain valid numeric values.");
      }
      if (Number(lng) < -180 || Number(lng) > 180) {
        throw new Error("Longitude must be between -180 and 180.");
      }
      if (Number(lat) < -90 || Number(lat) > 90) {
        throw new Error("Latitude must be between -90 and 90.");
      }
      return true;
    }),
  handleValidationErrors,
];

const validateCreateReport = [
  body("type")
    .optional()
    .isIn(["minor", "major"])
    .withMessage('Type must be either "minor" or "major".'),
  body("location")
    .exists({ checkFalsy: true })
    .withMessage("Location is required.")
    .custom((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("location must be a GeoJSON Point object.");
      }
      if (value.type !== "Point") {
        throw new Error('location.type must be "Point".');
      }
      if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
        throw new Error("location.coordinates must be an array with [lng, lat].");
      }
      return true;
    }),
  handleValidationErrors,
];

const validateResources = [
  body("items").isArray().withMessage("items must be an array."),
  body("items.*.itemName").notEmpty().withMessage("itemName is required."),
  body("items.*.quantity").isNumeric().withMessage("quantity must be a number."),
  body("items.*.unit").notEmpty().withMessage("unit is required."),
  handleValidationErrors,
];

const validateRegisterVetted = [
  body("accountType")
    .exists({ checkFalsy: true })
    .isIn(["Reporter", "ResponseTeam"])
    .withMessage('accountType must be either "Reporter" or "ResponseTeam".'),
  body("name").trim().notEmpty().withMessage("Full name is required."),
  body("phone").trim().notEmpty().withMessage("Phone number is required."),
  body("nid").trim().notEmpty().withMessage("National ID (NID) is required."),
  body("face").notEmpty().withMessage("Facial verification image is required."),
  body("role")
    .optional({ nullable: true })
    .isIn(["police", "firefighter", "civilsurgeon", "", null])
    .withMessage("Invalid response team sub-role."),
  handleValidationErrors,
];

module.exports = {
  validateReportComment,
  validateReportVote,
  validateVictimRegistration,
  validateCreateReport,
  validateResources,
  validateRegisterVetted,
};
