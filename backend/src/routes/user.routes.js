const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

// GET /api/users/profile - Fetch logged-in user profile
router.get("/profile", authMiddleware, authorize("patient", "doctor"), userController.getProfile);

// PUT /api/users/profile - Update logged-in user profile
router.put("/profile", authMiddleware, authorize("patient", "doctor"), userController.updateProfile);

// GET /api/users/:id - Fetch user profile by user ID (restricted to doctors)
router.get("/:id", authMiddleware, authorize("doctor"), userController.getUserProfileById);

module.exports = router;
