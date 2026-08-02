const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");

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

const findDuplicateReport = async (type, category, location) => {
  const radiusMeters = type === "major" ? 500 : 100;
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

  return Report.findOne({
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
