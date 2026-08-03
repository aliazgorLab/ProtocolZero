const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");
const SYSTEM = require("../constants/system");

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
  const searchRadiusRadians = searchRadiusMeters / SYSTEM.EARTH_RADIUS_M;

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

const findDuplicateReport = async (type, category, location) => {
  const isMajor = type === "major";
  const radiusMeters = isMajor
    ? SYSTEM.DUPLICATE_RADIUS_MAJOR_M
    : SYSTEM.DUPLICATE_RADIUS_MINOR_M;

  const query = {
    status: "active",
    category,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: location.coordinates,
        },
        $maxDistance: radiusMeters,
      },
    },
  };

  // Hybrid Time Window Engine:
  // Minor Reports: 3-hour window (created at >= 3 hours ago)
  // Major Reports: No time window; active until officially marked as closed
  if (!isMajor) {
    const threeHoursAgo = new Date(
      Date.now() - SYSTEM.DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000
    );
    query.createdAt = { $gte: threeHoursAgo };
  }

  return Report.findOne(query);
};

module.exports = {
  generatePostId,
  resolveReportById,
  isValidGeoPoint,
  normalizeImageList,
  buildMajorReportNotifications,
  buildMinorReportNotifications,
  getNearbyMinorReportRecipients,
  findDuplicateReport,
};
