const express = require("express");
const router = express.Router();
const prescriptionController = require("../controllers/prescription.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

router.get("/my", authMiddleware, authorize("patient"), prescriptionController.getPatientPrescriptions);
router.get("/doctor", authMiddleware, authorize("doctor"), prescriptionController.getDoctorPrescriptions);
router.post("/", authMiddleware, authorize("doctor"), prescriptionController.createPrescription);

module.exports = router;
