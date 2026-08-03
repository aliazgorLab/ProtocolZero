// @desc    Validate Base64 image & video uploads for file safety
const validateUploadedMedia = (req, res, next) => {
  const checkMediaString = (str) => {
    if (typeof str !== 'string') return true;
    // If it looks like a Base64 media URI, verify allowed formats
    if (str.startsWith('data:')) {
      const allowedRegex = /^data:(image\/(jpeg|png|webp|gif|svg\+xml)|video\/(mp4|webm|ogg));base64,/i;
      if (!allowedRegex.test(str)) {
        return false;
      }
    }
    return true;
  };

  const inspectPayload = (obj) => {
    if (!obj || typeof obj !== 'object') return true;
    for (const key in obj) {
      const val = obj[key];
      if (typeof val === 'string') {
        if (!checkMediaString(val)) return false;
      } else if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === 'string' && !checkMediaString(item)) return false;
          if (typeof item === 'object' && !inspectPayload(item)) return false;
        }
      } else if (typeof val === 'object') {
        if (!inspectPayload(val)) return false;
      }
    }
    return true;
  };

  if (!inspectPayload(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Security Alert: Invalid or potentially unsafe file format detected in media payload.",
    });
  }

  next();
};

module.exports = validateUploadedMedia;
