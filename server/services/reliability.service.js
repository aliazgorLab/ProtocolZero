const Report = require("../models/Report");
const Notification = require("../models/Notification");
const { emitToRoom } = require("../socket");
const User = require("../models/User");

// §17.4 logic
function isSuspicious(u, d) {
  if (d === 0) return false;                  // a brand-new 0/0 report is not suspicious
  if (u === 0 && d < 2) return true;
  if (u <= d && u > 2 && d > 2) return true;  // clauses 2 and 3 merged
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

    const u = report.vote.upvote || 0;
    const d = report.vote.downvote || 0;

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
        const notifications = authorities.map(auth => ({
          recipientId: auth._id,
          type: "report_escalated",
          title: "Suspicious Report Detected",
          message: `Report ${report.postId} has been flagged as potentially false by community votes.`,
          data: {
            reportId: report._id,
            postId: report.postId,
          },
        }));

        await Notification.insertMany(notifications);
      }
    }
  } catch (error) {
    console.error("[ERROR] Reliability Service:", error.message);
  }
};

exports.isSuspicious = isSuspicious; // exported for testing
