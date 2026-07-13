const Report = require("../models/Report");

const generatePostId = () => {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REP-${timestampPart}-${randomPart}`;
};

const resolveReportById = (id) => {
  return Report.findOne({ $or: [{ _id: id }, { postId: id }] });
};

const isValidGeoPoint = (location) => {
  return (
    location &&
    location.type === "Point" &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2
  );
};

const normalizeImageList = (images) => {
  if (!images) return [];
  return Array.isArray(images) ? images : [images];
};

// @desc    Create a new emergency incident report
// @route   POST /api/reports
// @access  Protected (User, Volunteer, Reporter)
exports.createReport = async (req, res) => {
  try {
    const {
      type = "minor",
      category = "General Hazard",
      description,
      location,
      impactAreas,
      images,
    } = req.body;

    if (!["User", "Volunteer", "Reporter"].includes(req.user.accountType)) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: Only User, Volunteer, and Reporter accounts can create incident reports.",
      });
    }

    if (type === "major" && req.user.accountType !== "Reporter") {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: Only verified Reporters are authorized to issue Major emergency broadcasts.",
      });
    }

    if (!isValidGeoPoint(location)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid GeoJSON Point location [longitude, latitude] is required.",
      });
    }

    if (
      type === "major" &&
      (!Array.isArray(impactAreas) || impactAreas.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Impact areas are required for Major reports.",
      });
    }

    const radiusMeters = type === "major" ? 500 : 100;
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const duplicateReport = await Report.findOne({
      status: "active",
      category,
      createdAt: { $gte: threeHoursAgo },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: location.coordinates,
          },
          $maxDistance: radiusMeters,
        },
      },
    });

    if (duplicateReport) {
      return res.status(409).json({
        success: false,
        message:
          "An active report for this incident category already exists nearby. We are redirecting you to the existing report.",
        existingReportId: duplicateReport.postId,
        data: duplicateReport,
      });
    }

    const newReport = await Report.create({
      postId: generatePostId(),
      issuerId: req.user._id,
      type,
      category,
      description: description || null,
      location,
      impactAreas: type === "major" ? impactAreas : [],
      image: normalizeImageList(images),
      reliability: req.user.accountType === "Reporter" ? "valid" : "none",
    });

    return res.status(201).json({
      success: true,
      message: `${type.toUpperCase()} incident report broadcasted successfully.`,
      data: newReport,
    });
  } catch (error) {
    console.error("[ERROR] Create Report Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during report creation.",
    });
  }
};

// @desc    Get nearby active reports for the Leaflet Map
// @route   GET /api/reports/nearby?lng={}&lat={}&radius={}
// @access  Protected
exports.getNearbyReports = async (req, res) => {
  try {
    const { lng, lat, radius = 5000 } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({
        success: false,
        message:
          "Longitude (lng) and Latitude (lat) query parameters are required.",
      });
    }

    const nearbyReports = await Report.find({
      status: "active",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius, 10),
        },
      },
    })
      .populate("issuerId", "name accountType face")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: nearbyReports.length,
      data: nearbyReports,
    });
  } catch (error) {
    console.error("[ERROR] Fetch Nearby Reports Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while querying geospatial reports.",
    });
  }
};

// @desc    Get report details by ID
// @route   GET /api/reports/:id
// @access  Protected
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await resolveReportById(id)
      .populate("issuerId", "name accountType face")
      .populate("comments.commenterId", "name accountType face")
      .populate(
        "victims",
        "name accountType face currentAddress homeAddress gps phone email",
      );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const reportData = report.toObject();
    const isVettedResponder = [
      "Reporter",
      "ResponseTeam",
      "Admin",
      "SuperAdmin",
    ].includes(req.user.accountType);

    if (!isVettedResponder && Array.isArray(reportData.victims)) {
      reportData.victims = reportData.victims.map((victim) => ({
        _id: victim._id,
        name: victim.name,
        face: victim.face,
      }));
    }

    return res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("[ERROR] Fetch Report Details Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching report details.",
    });
  }
};

// @desc    Edit/Update an existing report
// @route   PATCH /api/reports/:id
// @access  Protected
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      category,
      images,
      status,
      location,
      impactAreas,
      type,
    } = req.body;

    const report = await resolveReportById(id).populate(
      "issuerId",
      "accountType name",
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const isAuthor = report.issuerId._id.toString() === req.user._id.toString();
    const isTargetAuthorReporter = report.issuerId.accountType === "Reporter";
    const editorType = req.user.accountType;

    if (!isAuthor) {
      if (editorType === "Reporter") {
        if (isTargetAuthorReporter) {
          return res.status(403).json({
            success: false,
            message:
              "Forbidden: A Reporter cannot edit or override a report issued by another verified Reporter.",
          });
        }
      } else if (!["Admin", "SuperAdmin"].includes(editorType)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You do not have permission to edit this report.",
        });
      }
    }

    if (description !== undefined) report.description = description;
    if (category !== undefined) report.category = category;
    if (images !== undefined) report.image = normalizeImageList(images);
    if (location !== undefined) {
      if (!isValidGeoPoint(location)) {
        return res.status(400).json({
          success: false,
          message:
            "Valid GeoJSON Point location [longitude, latitude] is required.",
        });
      }
      report.location = location;
    }
    if (impactAreas !== undefined) report.impactAreas = impactAreas;
    if (type !== undefined) report.type = type;

    if (status === "closed") {
      report.status = "closed";
      report.closedBy = req.user._id;
      report.closedAt = new Date();
    }

    if (!isAuthor) {
      report.updaterId = req.user._id;
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report updated successfully.",
      data: report,
    });
  } catch (error) {
    console.error("[ERROR] Update Report Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating report.",
    });
  }
};

// @desc    Delete an existing report
// @route   DELETE /api/reports/:id
// @access  Protected
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await resolveReportById(id).populate(
      "issuerId",
      "accountType name",
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const isAuthor = report.issuerId._id.toString() === req.user._id.toString();
    const isTargetAuthorReporter = report.issuerId.accountType === "Reporter";
    const currentUserType = req.user.accountType;

    if (currentUserType === "Reporter") {
      if (isTargetAuthorReporter && !isAuthor) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: A Reporter cannot delete another Reporter's report.",
        });
      }
    } else if (!["Admin", "SuperAdmin"].includes(currentUserType)) {
      if (!isAuthor) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: You do not have permission to delete this report.",
        });
      }
    }

    await report.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully.",
    });
  } catch (error) {
    console.error("[ERROR] Delete Report Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting report.",
    });
  }
};
