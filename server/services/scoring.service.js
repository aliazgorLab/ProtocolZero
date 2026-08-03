const User = require("../models/User");
const Report = require("../models/Report");
const Notification = require("../models/Notification");

// @desc    Recompute a user's reliability score and check for flagging
// @param   {ObjectId|string} userId - The ID of the user whose score needs updating
exports.recomputeUserScore = async (userId) => {
  try {
    if (!userId) return null;
    const user = await User.findById(userId);

    // Reporters, Response Teams, and Admins are never scored
    if (!user || ["Reporter", "ResponseTeam", "Admin", "SuperAdmin"].includes(user.accountType)) {
      return null;
    }

    const closedReports = await Report.find({
      issuerId: userId,
      status: "closed",
    });

    let validCount = 0;
    let falseCount = 0;

    for (const report of closedReports) {
      if (report.reliability === "valid") validCount += 1;
      if (report.reliability === "false") falseCount += 1;
    }

    const newScore = (validCount * 10) - (falseCount * 20);

    const previousScore = user.score || 0;
    user.score = newScore;
    await user.save();

    // Flag account if score drops below threshold (-40)
    if (newScore <= -40 && previousScore > -40) {
      await exports.notifyAdminsOfFlaggedAccount(user);
    }

    return newScore;
  } catch (error) {
    console.error("[ERROR] Scoring Service:", error.message);
    throw error;
  }
};

exports.notifyAdminsOfFlaggedAccount = async (flaggedUser) => {
  const admins = await User.find({ accountType: { $in: ["Admin", "SuperAdmin"] } }).select("_id");

  if (admins.length === 0) return;

  const notifications = admins.map(admin => ({
    recipientId: admin._id,
    referenceId: flaggedUser._id,
    referenceModel: "User",
    type: "account_flagged",
    message: `Account Flagged: User ${flaggedUser.name} (${flaggedUser.accountType}) has a reliability score of ${flaggedUser.score} due to false reporting.`,
  }));

  await Notification.insertMany(notifications);
};
