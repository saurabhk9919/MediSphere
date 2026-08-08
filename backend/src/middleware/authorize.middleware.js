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
