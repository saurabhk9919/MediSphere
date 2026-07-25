const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctor.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

// GET /api/doctors - List all doctors (supports optional ?search= & ?specialization= & ?page= & ?limit= parameters)
router.get("/", authMiddleware, authorize("patient", "doctor"), doctorController.getAllDoctors);

// GET /api/doctors/:id - Fetch details of a single doctor by User ID
router.get("/:id", authMiddleware, authorize("patient", "doctor"), doctorController.getDoctorById);

module.exports = router;
