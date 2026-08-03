const Report = require("../models/Report");
const Notification = require("../models/Notification");
const { emitToRoom } = require("../socket");
const User = require("../models/User");

// §17.4 logic: Fake & Suspicious Report Detection
function isSuspicious(u, d) {
  if (d === 0) return false; // a report with 0 downvotes is not suspicious
  if (u === 0 && d >= 1) return true; // 0 upvotes with downvotes is suspicious
  if (u <= d && d >= 2) return true; // downvotes >= upvotes (at least 2 downvotes)
  return false;
}

exports.checkAndEscalateReport = async (reportId) => {
  try {
    const report = await Report.findById(reportId).populate("issuerId", "accountType");

    if (!report) return;
    
    // Skip entirely if the author is a Reporter
    if (report.issuerId && report.issuerId.accountType === "Reporter") {
      return;
    }

    const u = report.vote?.upvote || 0;
    const d = report.vote?.downvote || 0;

    if (isSuspicious(u, d)) {
      // Set reliability to false
      report.reliability = "false";
      await report.save();

      // Emit report:escalated to Reporter and Admin rooms
      const payload = {
        reportId: report._id,
        postId: report.postId,
        upvote: u,
        downvote: d,
        message: "This report has been flagged as suspicious by community voting.",
      };

      try {
        emitToRoom("role:Reporter", "report:escalated", payload);
        emitToRoom("role:Admin", "report:escalated", payload);
        emitToRoom("role:SuperAdmin", "report:escalated", payload);
      } catch (err) {
        console.error("Socket emission failed, continuing:", err.message);
      }

      // Notify Reporters and Admins
      const authorities = await User.find({
        accountType: { $in: ["Reporter", "Admin", "SuperAdmin"] }
      }).select("_id");

      if (authorities.length > 0) {
        const notifications = authorities.map((auth) => ({
          recipientId: auth._id,
          referenceId: report._id,
          referenceModel: "Report",
          type: "report_escalated",
          message: `Suspicious Report Detected: Report ${report.postId || report.category} has been flagged as potentially false by community votes (${u} upvotes / ${d} downvotes).`,
        }));

        const createdNotifs = await Notification.insertMany(notifications);
        createdNotifs.forEach((notif) => {
          try {
            emitToRoom(`user:${notif.recipientId}`, "notification:new", notif);
          } catch (e) {
            console.error("Failed to emit notification to admin:", e.message);
          }
        });
      }
    }
  } catch (error) {
    console.error("[ERROR] Reliability Service:", error.message);
  }
};

exports.isSuspicious = isSuspicious; // exported for testing
