const userService = require("../services/user.service");

/**
 * Handle request to retrieve the authenticated user's profile.
 * Expects req.user (populated by authMiddleware) to contain userId.
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid token payload: User ID is missing"
      });
    }

    const profile = await userService.getProfile(userId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while retrieving user profile",
      error: error.message
    });
  }
};

/**
 * Handle request to update the authenticated user's profile.
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid token payload: User ID is missing"
      });
    }

    const updatedProfile = await userService.updateProfile(userId, req.body);
    
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while updating user profile",
      error: error.message
    });
  }
};

const getUserProfileById = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while retrieving user profile",
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserProfileById
};
