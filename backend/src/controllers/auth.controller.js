const authService = require("../services/auth.service");

/**
 * Handle user registration request
 */
const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    return res.status(201).json(result);
  } catch (error) {
    // Basic error handling propagation
    return res.status(500).json({
      success: false,
      message: "Internal Server Error during registration",
      error: error.message
    });
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error during login",
      error: error.message
    });
  }
};

const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile
};
