// @desc    Recursively sanitize input objects to prevent NoSQL injection
// @route   Middleware globally mounted in server.js
const sanitizeObject = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (key.includes("$") || key.includes(".")) {
        return false; // Found illegal character in key
      }
      if (typeof obj[key] === "object" && obj[key] !== null) {
        const isSafe = sanitizeObject(obj[key]);
        if (!isSafe) return false;
      }
    }
  }
  return true;
};

const sanitize = (req, res, next) => {
  const isBodySafe = sanitizeObject(req.body);
  const isQuerySafe = sanitizeObject(req.query);
  const isParamsSafe = sanitizeObject(req.params);

  if (!isBodySafe || !isQuerySafe || !isParamsSafe) {
    return res.status(400).json({
      success: false,
      message: "Bad Request: Illegal characters ($ or .) detected in input payload.",
    });
  }

  next();
};

module.exports = sanitize;
