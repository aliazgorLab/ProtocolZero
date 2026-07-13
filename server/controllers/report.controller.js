const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");
const Notification = require("../models/Notification");

const generatePostId = () => {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REP-${timestampPart}-${randomPart}`;
};

const resolveReportById = (id) => {
  const queryConditions = [{ postId: id }];

  if (mongoose.Types.ObjectId.isValid(id)) {
    queryConditions.push({ _id: id });
  }

  return Report.findOne({ $or: queryConditions });
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

const buildMajorReportNotifications = (report, recipientIds) => {
  return recipientIds.map((recipientId) => ({
    recipientId,
    referenceId: report._id,
    referenceModel: "Report",
    type: "report_created",
    message: `A major report has been created: ${report.category || "General Hazard"}.`,
  }));
};

const buildMinorReportNotifications = (report, recipientIds) => {
  return recipientIds.map((recipientId) => ({
    recipientId,
    referenceId: report._id,
    referenceModel: "Report",
    type: "report_created",
    message: `A minor report has been created nearby: ${report.category || "General Hazard"}.`,
  }));
};

const getNearbyMinorReportRecipients = async (report, excludeUserId) => {
  const searchRadiusMeters = 1000;
  const earthRadiusMeters = 6378137;
  const searchRadiusRadians = searchRadiusMeters / earthRadiusMeters;

  const nearbyUsers = await User.find({
    _id: { $ne: excludeUserId },
    accountType: { $in: ["User", "Volunteer", "ResponseTeam"] },
    $or: [
      {
        gps: {
          $geoWithin: {
            $centerSphere: [report.location.coordinates, searchRadiusRadians],
          },
        },
      },
      {
        currentAddressGps: {
          $geoWithin: {
            $centerSphere: [report.location.coordinates, searchRadiusRadians],
          },
        },
      },
      {
        homeAddressGps: {
          $geoWithin: {
            $centerSphere: [report.location.coordinates, searchRadiusRadians],
          },
        },
      },
    ],
  })
    .select("_id")
    .lean();

  return nearbyUsers.map((user) => user._id);
};

// @desc    Create a new emergency incident report
// @route   POST /api/reports
// @access  Protected (User, Volunteer, Reporter)
exports.createReport = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      type = "minor",
      category = "General Hazard",
      description,
      location,
      impactAreas,
      images,
    } = req.body;

    if (
      !["User", "Volunteer", "Reporter", "Admin", "SuperAdmin"].includes(
        req.user.accountType,
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: Only User, Volunteer, Reporter, Admin, and SuperAdmin accounts can create incident reports.",
      });
    }

    if (
      type === "major" &&
      !["Reporter", "Admin", "SuperAdmin"].includes(req.user.accountType)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: Only verified Reporters, Admins, and SuperAdmins are authorized to issue Major emergency broadcasts.",
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

    const isTrustedAuthor = ["Reporter", "Admin", "SuperAdmin"].includes(
      req.user.accountType,
    );

    let newReport;
    let notificationCount = 0;

    await session.withTransaction(async () => {
      newReport = new Report({
        postId: generatePostId(),
        issuerId: req.user._id,
        type,
        category,
        description: description || null,
        location,
        impactAreas: type === "major" ? impactAreas : [],
        image: normalizeImageList(images),
        reliability: isTrustedAuthor ? "valid" : "none",
      });

      await newReport.save({ session });

      if (type === "minor") {
        const recipientIds = await getNearbyMinorReportRecipients(
          newReport,
          req.user._id,
        );

        if (recipientIds.length > 0) {
          const notificationDocs = buildMinorReportNotifications(
            newReport,
            recipientIds,
          );

          await Notification.insertMany(notificationDocs, { session });
          notificationCount = notificationDocs.length;
        }
      }

      if (type === "major" && req.user.accountType === "Reporter") {
        const recipients = await User.find({
          accountType: { $in: ["User", "Volunteer", "ResponseTeam"] },
        })
          .select("_id")
          .lean();

        if (recipients.length > 0) {
          const notificationDocs = buildMajorReportNotifications(
            newReport,
            recipients.map((recipient) => recipient._id),
          );

          await Notification.insertMany(notificationDocs, { session });
          notificationCount = notificationDocs.length;
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: `${type.toUpperCase()} incident report broadcasted successfully.`,
      data: {
        report: newReport,
        notificationCount,
      },
    });
  } catch (error) {
    console.error("[ERROR] Create Report Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during report creation.",
    });
  } finally {
    session.endSession();
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

// @desc    Add a comment to a report
// @route   POST /api/reports/:id/comment
// @access  Protected
exports.addReportComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const report = await resolveReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const comment = {
      commenterId: req.user._id,
      text,
      createdAt: new Date(),
    };

    report.comments.push(comment);
    await report.save();

    const createdComment = report.comments[report.comments.length - 1].toObject();

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      data: createdComment,
    });
  } catch (error) {
    console.error("[ERROR] Add Report Comment Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while adding report comment.",
    });
  }
};

// @desc    Vote on a report
// @route   PATCH /api/reports/:id/vote
// @access  Protected
exports.voteOnReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, comment } = req.body;

    const report = await resolveReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const voterId = req.user._id.toString();
    const upvoterIds = report.vote.upvoterId.map((userId) => userId.toString());
    const downvoterIds = report.vote.downvoterId.map((userId) => userId.toString());
    const alreadyUpvoted = upvoterIds.includes(voterId);
    const alreadyDownvoted = downvoterIds.includes(voterId);

    if (type === "upvote") {
      if (alreadyUpvoted) {
        return res.status(409).json({
          success: false,
          message: "You have already upvoted this report.",
        });
      }

      if (alreadyDownvoted) {
        report.vote.downvote = Math.max(0, report.vote.downvote - 1);
        report.vote.downvoterId = report.vote.downvoterId.filter(
          (userId) => userId.toString() !== voterId,
        );
      }

      report.vote.upvote += 1;
      report.vote.upvoterId.push(req.user._id);
    }

    if (type === "downvote") {
      if (alreadyDownvoted) {
        return res.status(409).json({
          success: false,
          message: "You have already downvoted this report.",
        });
      }

      if (alreadyUpvoted) {
        report.vote.upvote = Math.max(0, report.vote.upvote - 1);
        report.vote.upvoterId = report.vote.upvoterId.filter(
          (userId) => userId.toString() !== voterId,
        );
      }

      report.vote.downvote += 1;
      report.vote.downvoterId.push(req.user._id);

      report.comments.push({
        commenterId: req.user._id,
        text: comment.trim(),
        createdAt: new Date(),
      });
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Vote recorded successfully.",
      data: {
        upvote: report.vote.upvote,
        downvote: report.vote.downvote,
        score: report.score,
      },
    });
  } catch (error) {
    console.error("[ERROR] Vote On Report Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while recording vote.",
    });
  }
};

// @desc    Register the authenticated user as a victim on a report
// @route   POST /api/reports/:id/victim
// @access  Protected
exports.registerVictim = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const { gps } = req.body;
    const userId = req.user._id;

    const report = await resolveReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (report.status === "closed") {
      return res.status(409).json({
        success: false,
        message: "You cannot join a closed report.",
      });
    }

    const userIdString = userId.toString();
    const alreadyAttachedToReport = Array.isArray(report.victims)
      ? report.victims.some((victimId) => victimId.toString() === userIdString)
      : false;

    if (alreadyAttachedToReport) {
      return res.status(409).json({
        success: false,
        message: "You are already registered as a victim on this report.",
      });
    }

    if (req.user.victimReportID) {
      return res.status(409).json({
        success: false,
        message: "You are already registered as a victim on another report.",
      });
    }

    await session.withTransaction(async () => {
      const userUpdate = await User.updateOne(
        { _id: userId, victimReportID: null },
        {
          $set: {
            victimReportID: report._id,
            gps: {
              type: gps.type,
              coordinates: gps.coordinates,
            },
          },
        },
        { session },
      );

      if (userUpdate.modifiedCount !== 1) {
        throw new Error("User is already registered as a victim.");
      }

      const reportUpdate = await Report.updateOne(
        { _id: report._id, status: "active", victims: { $ne: userId } },
        { $addToSet: { victims: userId } },
        { session },
      );

      if (reportUpdate.modifiedCount !== 1) {
        throw new Error("Failed to register victim on report.");
      }
    });

    const updatedReport = await resolveReportById(id)
      .populate("issuerId", "name accountType face")
      .populate("comments.commenterId", "name accountType face")
      .populate(
        "victims",
        "name accountType face currentAddress homeAddress gps phone email",
      );

    return res.status(200).json({
      success: true,
      message: "Victim registration completed successfully.",
      data: updatedReport,
    });
  } catch (error) {
    console.error("[ERROR] Victim Registration Failure:", error.message);

    if (
      error.message === "User is already registered as a victim." ||
      error.message === "Failed to register victim on report."
    ) {
      return res.status(409).json({
        success: false,
        message: "You are already registered as a victim on this report.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error while registering victim.",
    });
  } finally {
    session.endSession();
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
    const isAdmin = ["Admin", "SuperAdmin"].includes(req.user.accountType);
    const isTargetAuthorReporter = report.issuerId.accountType === "Reporter";

    if (!isAdmin) {
      if (!isAuthor) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only delete your own report.",
        });
      }

      if (
        req.user.accountType === "Reporter" &&
        isTargetAuthorReporter &&
        !isAuthor
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: A Reporter cannot delete another Reporter's report.",
        });
      }
    }

    await Report.deleteOne({ _id: report._id });

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully.",
      data: { reportId: report.postId },
    });
  } catch (error) {
    console.error("[ERROR] Delete Report Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting report.",
    });
  }
};
