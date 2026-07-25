/**
 * Reusable Role-Based Authorization Middleware Factory.
 * Checks if the user's role exists in the allowed roles.
 * Expects req.user.role to be populated by authMiddleware.
 * 
 * @param {...string} allowedRoles - List of permitted roles.
 * @returns {Function} Express middleware.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user && req.user.role;

      if (!userRole || !allowedRoles.map(r => r.toLowerCase()).includes(userRole.toLowerCase())) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error during authorization",
        error: error.message
      });
    }
  };
};

module.exports = authorize;
