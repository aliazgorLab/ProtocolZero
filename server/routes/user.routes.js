// server/routes/user.routes.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const verifyFirebaseAuth = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/rbac.middleware");
const userController = require("../controllers/user.controller");

const rejectUnexpectedAddressFields = (req, res, next) => {
  const allowedFields = ["currentAddress", "homeAddress", "gps", "currentAddressGps", "homeAddressGps"];
  const extraFields = Object.keys(req.body || {}).filter(
    (field) => !allowedFields.includes(field),
  );

  if (extraFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Only currentAddress, homeAddress, gps, currentAddressGps, and homeAddressGps can be updated.",
      data: {
        fields: extraFields,
      },
    });
  }

  next();
};

const validateGpsPoint = (value, { path }) => {
  if (value === undefined || value === null) return true; // Optional
  
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be a GeoJSON Point object.`);
  }

  if (value.type !== "Point") {
    throw new Error(`${path}.type must be "Point".`);
  }

  if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
    throw new Error(`${path}.coordinates must be an array with [longitude, latitude].`);
  }

  const [longitude, latitude] = value.coordinates;
  const parsedLongitude = Number(longitude);
  const parsedLatitude = Number(latitude);

  if (!Number.isFinite(parsedLongitude) || !Number.isFinite(parsedLatitude)) {
    throw new Error(`${path}.coordinates must contain valid numeric values.`);
  }

  if (parsedLongitude < -180 || parsedLongitude > 180) {
    throw new Error("Longitude must be between -180 and 180.");
  }

  if (parsedLatitude < -90 || parsedLatitude > 90) {
    throw new Error("Latitude must be between -90 and 90.");
  }

  return true;
};

const validateLocationUpdate = [
  body("currentAddress")
    .isString()
    .withMessage("currentAddress must be a string.")
    .trim()
    .notEmpty()
    .withMessage("currentAddress is required."),
  body("homeAddress")
    .isString()
    .withMessage("homeAddress must be a string.")
    .trim()
    .notEmpty()
    .withMessage("homeAddress is required."),
  body("gps")
    .custom((value) => {
      // Retain original required behavior for gps
      if (!value) throw new Error("gps must be a GeoJSON Point object.");
      return validateGpsPoint(value, { path: "gps" });
    })
    .withMessage("Invalid gps payload."),
  body("currentAddressGps")
    .optional()
    .custom(validateGpsPoint)
    .withMessage("Invalid currentAddressGps payload."),
  body("homeAddressGps")
    .optional()
    .custom(validateGpsPoint)
    .withMessage("Invalid homeAddressGps payload."),
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

// @route   PATCH /api/users/profile
// @desc    Update the authenticated User or Volunteer's profile addresses
// @access  Protected (User, Volunteer)
router.patch(
  "/profile",
  verifyFirebaseAuth,
  authorizeRoles("User", "Volunteer"),
  rejectUnexpectedAddressFields,
  ...validateLocationUpdate,
  userController.updateProfileAddresses,
);

// @route   PATCH /api/users/toggle-volunteer
// @desc    Switch between standard User and Volunteer mode
// @access  Protected (User, Volunteer)
router.patch(
  "/toggle-volunteer",
  verifyFirebaseAuth,
  authorizeRoles("User", "Volunteer"),
  userController.toggleVolunteerMode,
);

// @route   PATCH /api/users/toggle-2fa
// @desc    Toggle Email OTP Two-Factor Authentication
// @access  Protected
router.patch(
  "/toggle-2fa",
  verifyFirebaseAuth,
  userController.toggleTwoFactor,
);

module.exports = router;
