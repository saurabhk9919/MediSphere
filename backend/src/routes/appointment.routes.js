const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

// GET /api/appointments/my - Get all appointments belonging to the authenticated patient
router.get("/my", authMiddleware, authorize("patient"), appointmentController.getPatientAppointments);

// GET /api/appointments/doctor - Get all appointments assigned to the authenticated doctor
router.get("/doctor", authMiddleware, authorize("doctor"), appointmentController.getDoctorAppointments);

// PATCH /api/appointments/:id/status - Update appointment status (restricted to doctor role)
router.patch("/:id/status", authMiddleware, authorize("doctor"), appointmentController.updateAppointmentStatus);

// PATCH /api/appointments/:id/cancel - Cancel appointment status (restricted to patient role)
router.patch("/:id/cancel", authMiddleware, authorize("patient"), appointmentController.cancelAppointment);

// POST /api/appointments - Book a new appointment
router.post("/", authMiddleware, authorize("patient"), appointmentController.bookAppointment);

module.exports = router;
