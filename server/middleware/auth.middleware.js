const admin = require("../config/firebase");
const User = require("../models/User");

const verifyFirebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing or invalid Authorization header.",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const queryConditions = [
      decodedToken.email ? { email: decodedToken.email } : null,
      decodedToken.phone_number ? { phone: decodedToken.phone_number } : null,
    ].filter(Boolean);

    const user = await User.findOne({ $or: queryConditions });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User profile not synchronized in database. Please call /auth/register.",
      });
    }

    req.user = user;
    req.firebaseUid = decodedToken.uid;

    const isProfileCheck =
      req.path.endsWith("/me") || req.path.endsWith("/profile");

    if (!isProfileCheck) {
      if (user.verificationStatus === "pending") {
        return res.status(403).json({
          success: false,
          errorType: "ACCOUNT_PENDING_VERIFICATION",
          message:
            "Access Denied: Your account is currently PENDING institutional verification by an Admin. You cannot perform operational API actions until approved.",
          data: {
            name: user.name,
            email: user.email,
            accountType: user.accountType,
            verificationStatus: user.verificationStatus,
          },
        });
      }

      if (user.verificationStatus === "rejected") {
        return res.status(403).json({
          success: false,
          errorType: "ACCOUNT_REJECTED",
          message:
            "Access Denied: Your account application was rejected by an Admin. Operational API access is disabled.",
          data: {
            name: user.name,
            accountType: user.accountType,
            verificationStatus: user.verificationStatus,
          },
        });
      }
    }

    next();
  } catch (error) {
    console.error("[ERROR] Firebase Auth Verification Failure:", error.message);
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired Firebase ID token.",
    });
  }
};

module.exports = verifyFirebaseAuth;
