const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing or invalid token format"
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || process.env.JWT_Secret;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "JWT secret key is not configured"
      });
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
      error: error.message
    });
  }
};

module.exports = authMiddleware;
