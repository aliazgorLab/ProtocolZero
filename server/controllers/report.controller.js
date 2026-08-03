const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");
const Notification = require("../models/Notification");

const reportService = require("../services/report.service");
const scoringService = require("../services/scoring.service");
const reliabilityService = require("../services/reliability.service");
const SYSTEM = require("../constants/system");
const {
  emitReportToGeoRooms,
  emitVictimAttached,
  emitToRoom,
} = require("../socket");

const buildLeanReportPayload = (report) => ({
  _id: report._id,
  postId: report.postId,
  type: report.type,
  status: report.status,
  coordinates: report.location?.coordinates || [],
  vote: {
    upvote: report.vote?.upvote || 0,
    downvote: report.vote?.downvote || 0,
  },
});

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
      resourcesNeeded,
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

    if (!reportService.isValidGeoPoint(location)) {
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

    const duplicateReport = await reportService.findDuplicateReport(
      type,
      category,
      location,
    );

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

    const formattedResourcesNeeded = Array.isArray(resourcesNeeded)
      ? resourcesNeeded.map((item) => {
          const tax = RESOURCE_TAXONOMY.find(
            (r) => r.id === item.itemId || r.id === item.id,
          );
          return {
            itemId: item.itemId || item.id,
            itemName: tax ? tax.name : item.itemName || "Resource Item",
            category: tax ? tax.category : item.category || "Supplies",
            quantity: Math.max(1, Number(item.quantity) || 1),
            unit: tax ? tax.defaultUnit : item.unit || "units",
          };
        })
      : [];

    let newReport;
    let notificationCount = 0;
    let createdNotifications = [];

    await session.withTransaction(async () => {
      newReport = new Report({
        postId: reportService.generatePostId(),
        issuerId: req.user._id,
        type,
        category,
        description: description || null,
        location,
        impactAreas: type === "major" ? impactAreas : [],
        resourcesNeeded: type === "major" ? formattedResourcesNeeded : [],
        image: reportService.normalizeImageList(images),
        reliability: isTrustedAuthor ? "valid" : "none",
      });

      await newReport.save({ session });

      if (type === "minor") {
        const recipientIds = await reportService.getNearbyMinorReportRecipients(
          newReport,
          req.user._id,
        );

        if (recipientIds.length > 0) {
          const notificationDocs = reportService.buildMinorReportNotifications(
            newReport,
            recipientIds,
          );

          createdNotifications = await Notification.insertMany(notificationDocs, { session });
          notificationCount = createdNotifications.length;
        }
      }

      if (type === "major") {
        const recipients = await User.find({
          accountType: { $in: ["User", "Volunteer", "ResponseTeam"] },
        })
          .select("_id")
          .lean();

        if (recipients.length > 0) {
          const notificationDocs = reportService.buildMajorReportNotifications(
            newReport,
            recipients.map((recipient) => recipient._id),
          );

          createdNotifications = await Notification.insertMany(notificationDocs, { session });
          notificationCount = createdNotifications.length;
        }
      }
    });

    emitReportToGeoRooms("report:new", newReport, buildLeanReportPayload(newReport));

    createdNotifications.forEach((notif) => {
      emitToRoom(`user:${notif.recipientId}`, "notification:new", notif);
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

// @desc    Get all incident reports (active & closed, optional status/type filter)
// @route   GET /api/reports
// @access  Protected
exports.getAllReports = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    const reports = await Report.find(filter)
      .populate("issuerId", "name accountType face")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("[ERROR] Fetch All Reports Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching reports feed.",
    });
  }
};

// @desc    Get nearby active reports for the Leaflet Map
// @route   GET /api/reports/nearby?lng={}&lat={}&radius={}
// @access  Protected
exports.getNearbyReports = async (req, res) => {
  try {
    const { lng, lat, radius = SYSTEM.NEARBY_DEFAULT_RADIUS_M } = req.query;

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

    const report = await reportService.resolveReportById(id)
      .populate("issuerId", "name accountType face")
      .populate("comments.commenterId", "name accountType face")
      .populate(
        "victims.userId",
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
      reportData.victims = reportData.victims.map((victim) => {
        const u = victim.userId || victim;
        return {
          _id: u._id,
          name: u.name,
          face: u.face,
        };
      });
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

    const report = await reportService.resolveReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (report.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Cannot comment on a closed report.",
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

    // --- DISPATCH COMMENT NOTIFICATION TO REPORT ISSUER ---
    const issuerId = report.issuerId?._id ? report.issuerId._id.toString() : report.issuerId?.toString();
    const commenterId = req.user._id.toString();

    if (issuerId && issuerId !== commenterId) {
      try {
        const commenterName = req.user.name || "A user";
        const snippet = text.length > 60 ? `${text.substring(0, 60)}...` : text;
        const notification = await Notification.create({
          recipientId: issuerId,
          referenceId: report._id,
          referenceModel: "Report",
          type: "report_comment",
          message: `${commenterName} commented on your report (${report.postId || report.category}): "${snippet}"`,
        });

        emitToRoom(`user:${issuerId}`, "notification:new", notification);
      } catch (notifErr) {
        console.error("[WARNING] Failed to dispatch comment notification:", notifErr.message);
      }
    }

    emitReportToGeoRooms("report:update", report, buildLeanReportPayload(report));

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

    const report = await reportService.resolveReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (report.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Cannot vote on a closed report.",
      });
    }

    const voterId = req.user._id.toString();
    const upvoterIds = report.vote.upvoterId.map((userId) => userId.toString());
    const downvoterIds = report.vote.downvoterId.map((userId) => userId.toString());
    const alreadyUpvoted = upvoterIds.includes(voterId);
    const alreadyDownvoted = downvoterIds.includes(voterId);

    const voteType = type || req.body.vote;

    if (voteType === "upvote") {
      if (alreadyUpvoted) {
        // Toggle off upvote
        report.vote.upvote = Math.max(0, report.vote.upvote - 1);
        report.vote.upvoterId = report.vote.upvoterId.filter(
          (userId) => userId.toString() !== voterId,
        );
      } else {
        if (alreadyDownvoted) {
          report.vote.downvote = Math.max(0, report.vote.downvote - 1);
          report.vote.downvoterId = report.vote.downvoterId.filter(
            (userId) => userId.toString() !== voterId,
          );
        }
        report.vote.upvote += 1;
        report.vote.upvoterId.push(req.user._id);
      }
    }

    if (voteType === "downvote") {
      if (alreadyDownvoted) {
        // Toggle off downvote
        report.vote.downvote = Math.max(0, report.vote.downvote - 1);
        report.vote.downvoterId = report.vote.downvoterId.filter(
          (userId) => userId.toString() !== voterId,
        );
      } else {
        if (alreadyUpvoted) {
          report.vote.upvote = Math.max(0, report.vote.upvote - 1);
          report.vote.upvoterId = report.vote.upvoterId.filter(
            (userId) => userId.toString() !== voterId,
          );
        }
        report.vote.downvote += 1;
        report.vote.downvoterId.push(req.user._id);

        if (comment && String(comment).trim()) {
          const commentText = String(comment).trim();
          report.comments.push({
            commenterId: req.user._id,
            text: commentText,
            createdAt: new Date(),
          });

          // Dispatch comment notification to report issuer
          const issuerId = report.issuerId?._id ? report.issuerId._id.toString() : report.issuerId?.toString();
          if (issuerId && issuerId !== voterId) {
            try {
              const commenterName = req.user.name || "A user";
              const snippet = commentText.length > 60 ? `${commentText.substring(0, 60)}...` : commentText;
              const notification = await Notification.create({
                recipientId: issuerId,
                referenceId: report._id,
                referenceModel: "Report",
                type: "report_comment",
                message: `${commenterName} commented on your report (${report.postId || report.category}): "${snippet}"`,
              });

              emitToRoom(`user:${issuerId}`, "notification:new", notification);
            } catch (notifErr) {
              console.error("[WARNING] Failed to dispatch downvote comment notification:", notifErr.message);
            }
          }
        }
      }
    }

    await report.save();

    // Trigger fake report detection logic (Phase 4.2)
    reliabilityService.checkAndEscalateReport(report._id).catch(err => console.error(err));

    emitReportToGeoRooms("report:vote", report, buildLeanReportPayload(report));

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
    const { gps, gpsStatus } = req.body;
    const userId = req.user._id;

    const report = await reportService.resolveReportById(id);

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
      ? report.victims.some((victim) => victim.userId.toString() === userIdString)
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

    // Phase 4.3: Victim GPS Fallback Logic
    let finalGps = null;
    let actualGpsStatus = gpsStatus || "success";
    let usedFallback = false;

    if (actualGpsStatus === "failed") {
      if (req.user.currentAddressGps) {
        finalGps = req.user.currentAddressGps;
        usedFallback = true;
      } else if (req.user.homeAddressGps) {
        finalGps = req.user.homeAddressGps;
        usedFallback = true;
      }
      // If no fallback is available, we do NOT block the victim per user requirements.
    } else {
      if (gps && gps.type && gps.coordinates) {
        finalGps = { type: gps.type, coordinates: gps.coordinates };
      }
    }

    await session.withTransaction(async () => {
      const userUpdateFields = { victimReportID: report._id };
      if (finalGps) {
        userUpdateFields.gps = finalGps;
      } else if (actualGpsStatus === "failed") {
        userUpdateFields.gps = null;
      }

      const userUpdate = await User.updateOne(
        { _id: userId, victimReportID: null },
        { $set: userUpdateFields },
        { session },
      );

      if (userUpdate.modifiedCount !== 1) {
        throw new Error("User is already registered as a victim.");
      }

      const reportUpdate = await Report.updateOne(
        { _id: report._id, status: "active", "victims.userId": { $ne: userId } },
        { $addToSet: { victims: { userId: userId, gpsStatus: actualGpsStatus, gpsFallback: usedFallback } } },
        { session },
      );

      if (reportUpdate.modifiedCount !== 1) {
        throw new Error("Failed to register victim on report.");
      }
    });

    const updatedReport = await reportService.resolveReportById(id)
      .populate("issuerId", "name accountType face")
      .populate("comments.commenterId", "name accountType face")
      .populate(
        "victims.userId",
        "name accountType face currentAddress homeAddress gps phone email",
      );

    emitVictimAttached({
      reportId: updatedReport._id,
      postId: updatedReport.postId,
      type: updatedReport.type,
      status: updatedReport.status,
      coordinates: updatedReport.location?.coordinates || [],
      vote: {
        upvote: updatedReport.vote?.upvote || 0,
        downvote: updatedReport.vote?.downvote || 0,
      },
      victimId: req.user._id,
      gpsStatus: actualGpsStatus,
      gpsFallback: usedFallback,
    });

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

// @desc    Detach current user from victim status on a report (Mark Self Safe)
// @route   DELETE /api/reports/:id/victim
// @access  Protected
exports.detachVictim = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const userId = req.user._id;

    const report = await reportService.resolveReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    await session.withTransaction(async () => {
      await User.updateOne(
        { _id: userId },
        { $set: { victimReportID: null } },
        { session }
      );

      await Report.updateOne(
        { _id: report._id },
        { $pull: { victims: { userId: userId } } },
        { session }
      );
    });

    const updatedReport = await reportService.resolveReportById(id)
      .populate("issuerId", "name accountType face")
      .populate("comments.commenterId", "name accountType face")
      .populate(
        "victims.userId",
        "name accountType face currentAddress homeAddress gps phone email"
      );

    return res.status(200).json({
      success: true,
      message: "You have been marked safe and detached from victim status.",
      data: updatedReport,
    });
  } catch (error) {
    console.error("[ERROR] Victim Detach Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to detach from victim status.",
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
      location,
      impactAreas,
      type,
    } = req.body;

    const report = await reportService.resolveReportById(id).populate(
      "issuerId",
      "accountType name",
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const isAuthor = report.issuerId?._id
      ? report.issuerId._id.toString() === req.user._id.toString()
      : report.issuerId?.toString() === req.user._id.toString();
    const isAdmin = ["Admin", "SuperAdmin"].includes(req.user.accountType);
    const isTargetAuthorReporter = report.issuerId?.accountType === "Reporter";

    let canEdit = false;

    if (isAdmin) {
      canEdit = true;
    } else if (isTargetAuthorReporter) {
      // If the author is a Reporter, only that author or an Admin can edit.
      if (isAuthor) canEdit = true;
    } else {
      // If the author is a normal user or volunteer, the author, or ANY Reporter (or Admin) can edit.
      if (isAuthor || req.user.accountType === "Reporter") {
        canEdit = true;
      }
    }

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to edit this report.",
      });
    }

    const updatesProvided = [description, category, images, location, impactAreas, type].some(val => val !== undefined);

    if (updatesProvided) {
      // Snapshot the current state before making changes
      const previousState = {
        description: report.description,
        category: report.category,
        image: report.image,
        location: report.location,
        impactAreas: report.impactAreas,
        type: report.type,
      };

      report.editHistory.push({
        editorId: req.user._id,
        editedAt: new Date(),
        previousState,
      });

      report.updaterId = req.user._id;
    }

    if (description !== undefined) report.description = description;
    if (category !== undefined) report.category = category;
    if (images !== undefined) report.image = reportService.normalizeImageList(images);
    if (location !== undefined) {
      if (!reportService.isValidGeoPoint(location)) {
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

    const report = await reportService.resolveReportById(id).populate(
      "issuerId",
      "accountType name",
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const isAuthor = report.issuerId?._id
      ? report.issuerId._id.toString() === req.user._id.toString()
      : report.issuerId?.toString() === req.user._id.toString();
    const isAdmin = ["Admin", "SuperAdmin"].includes(req.user.accountType);
    const isTargetAuthorReporter = report.issuerId?.accountType === "Reporter";

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

// @desc    Close a report
// @route   PATCH /api/reports/:id/close
// @access  Protected (Reporter, Admin, SuperAdmin)
exports.closeReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reliability } = req.body;

    if (!["valid", "false"].includes(reliability)) {
      return res.status(400).json({
        success: false,
        message: "reliability must be 'valid' or 'false' when closing a report.",
      });
    }

    const report = await reportService.resolveReportById(id).populate("issuerId", "accountType");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (report.status === "closed") {
      return res.status(409).json({
        success: false,
        message: "Report is already closed.",
      });
    }

    const isAuthor = report.issuerId?._id
      ? report.issuerId._id.toString() === req.user._id.toString()
      : report.issuerId?.toString() === req.user._id.toString();
    const isAdmin = ["Admin", "SuperAdmin"].includes(req.user.accountType);
    const isTargetAuthorReporter = report.issuerId?.accountType === "Reporter";

    let canClose = false;

    if (isAdmin) {
      canClose = true;
    } else if (isTargetAuthorReporter) {
      // If the author is a Reporter, only that author or an Admin can close it.
      if (isAuthor) canClose = true;
    } else {
      // If the author is a normal user or volunteer, the author, or ANY Reporter (or Admin) can close it.
      if (isAuthor || req.user.accountType === "Reporter") {
        canClose = true;
      }
    }

    if (!canClose) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to close this report.",
      });
    }

    report.status = "closed";
    report.closedBy = req.user._id;
    report.closedAt = new Date();
    report.reliability = reliability;

    await report.save();

    // Recompute reliability score for the author (Phase 4.1)
    const authorId = report.issuerId?._id || report.issuerId;
    if (authorId) {
      scoringService.recomputeUserScore(authorId).catch(err => console.error(err));
    }

    return res.status(200).json({
      success: true,
      message: "Report closed successfully.",
      data: report,
    });
  } catch (error) {
    console.error("[ERROR] Close Report Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while closing report.",
    });
  }
};

const { RESOURCE_TAXONOMY } = require("../constants/resources");

// @desc    Update resources needed by the report author or admin
// @route   PATCH /api/reports/:id/resources-needed
// @access  Protected (Report Author or Admin)
exports.updateResourcesNeeded = async (req, res) => {
  try {
    const { id } = req.params;
    const { resourcesNeeded } = req.body;

    if (!Array.isArray(resourcesNeeded)) {
      return res.status(400).json({
        success: false,
        message: "resourcesNeeded must be an array of items.",
      });
    }

    const report = await reportService.resolveReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const isAuthor = report.issuerId?._id
      ? report.issuerId._id.toString() === req.user._id.toString()
      : report.issuerId?.toString() === req.user._id.toString();
    const isAdmin = ["Admin", "SuperAdmin"].includes(req.user.accountType);

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only the Report Author or an Admin can update resources needed.",
      });
    }

    const formattedResources = [];
    for (const item of resourcesNeeded) {
      const tax = RESOURCE_TAXONOMY.find((r) => r.id === item.itemId || r.id === item.id);
      if (!tax && !item.itemName) {
        return res.status(400).json({
          success: false,
          message: `Invalid resource itemId: '${item.itemId}'`,
        });
      }
      formattedResources.push({
        itemId: item.itemId || item.id,
        itemName: tax ? tax.name : item.itemName,
        category: tax ? tax.category : item.category,
        quantity: Math.max(1, Number(item.quantity) || 1),
        unit: tax ? tax.defaultUnit : item.unit,
      });
    }

    report.resourcesNeeded = formattedResources;
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Required resources updated successfully.",
      data: report.resourcesNeeded,
    });
  } catch (error) {
    console.error("[ERROR] Update Resources Needed Failure:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating resources needed.",
    });
  }
};
