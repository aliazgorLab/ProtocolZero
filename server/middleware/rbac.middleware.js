/**
 * Middleware factory to restrict route access based on account classification.
 * @param  {...string} allowedRoles - List of accountTypes authorized for this route.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure auth middleware has already populated req.user
    if (!req.user || !req.user.accountType) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing user authentication context.",
      });
    }

    // Check if the authenticated user's role is in the allowed list
    if (!allowedRoles.includes(req.user.accountType)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Your account type (${req.user.accountType}) lacks required permissions.`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
