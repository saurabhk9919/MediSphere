const express = require("express");
const router = express.Router();
const vitalController = require("../controllers/vital.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

router.get("/my", authMiddleware, authorize("patient"), vitalController.getPatientVitals);
router.get("/patient/:patientId", authMiddleware, authorize("doctor"), vitalController.getPatientVitalsForDoctor);
router.post("/", authMiddleware, authorize("doctor"), vitalController.recordVitals);

module.exports = router;
