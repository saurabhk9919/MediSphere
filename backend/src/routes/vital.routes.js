const express = require("express");
const router = express.Router();
const vitalController = require("../controllers/vital.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

router.post("/device/start", authMiddleware, authorize("doctor"), vitalController.startDeviceSimulation);
router.post("/device/stop", authMiddleware, authorize("doctor"), vitalController.stopDeviceSimulation);
router.get("/device/status", authMiddleware, authorize("doctor"), vitalController.getDeviceSimulationStatus);
router.put("/device/source", authMiddleware, authorize("doctor"), vitalController.updateDeviceSource);
router.post("/device/telemetry", vitalController.recordDeviceTelemetry);

router.get("/my", authMiddleware, authorize("patient"), vitalController.getPatientVitals);
router.get("/patient/:patientId/latest", authMiddleware, authorize("doctor"), vitalController.getLatestPatientVitalsForDoctor);
router.get("/patient/:patientId/history", authMiddleware, authorize("doctor"), vitalController.getPatientVitalsHistory);
router.get("/patient/:patientId", authMiddleware, authorize("doctor"), vitalController.getPatientVitalsForDoctor);
router.post("/", authMiddleware, authorize("doctor"), vitalController.recordVitals);

module.exports = router;
