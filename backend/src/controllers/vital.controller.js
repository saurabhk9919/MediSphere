const vitalService = require("../services/vital.service");
const virtualDeviceService = require("../services/virtualDevice.service");
const userService = require("../services/user.service");

const recordVitals = async (req, res, next) => {
  try {
    const { patientId, heartRate, spo2, temperature } = req.body;

    if (patientId === undefined || patientId === null) {
      return res.status(400).json({
        success: false,
        message: "patientId is required"
      });
    }

    if (heartRate === undefined || heartRate === null || typeof heartRate !== "number" || heartRate < 20 || heartRate > 250) {
      return res.status(400).json({
        success: false,
        message: "Invalid heartRate. Must be a number between 20 and 250"
      });
    }

    if (spo2 === undefined || spo2 === null || typeof spo2 !== "number" || spo2 < 0 || spo2 > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid spo2. Must be a number between 0 and 100"
      });
    }

    if (temperature === undefined || temperature === null || typeof temperature !== "number" || temperature < 25 || temperature > 45) {
      return res.status(400).json({
        success: false,
        message: "Invalid temperature. Must be a number between 25 and 45"
      });
    }

    const result = await vitalService.recordVitals(req.user.userId, req.body);

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    if (result.forbidden) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    if (result.noAppointment) {
      return res.status(400).json({
        success: false,
        message: "No appointment found for this patient to record vitals"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Vitals recorded successfully",
      data: result.vitals
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while recording vitals",
      error: error.message
    });
  }
};

const getPatientVitals = async (req, res, next) => {
  try {
    const vitals = await vitalService.getPatientVitals(req.user.userId);
    return res.status(200).json({
      success: true,
      count: vitals.length,
      data: vitals
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while retrieving patient vitals",
      error: error.message
    });
  }
};

const getPatientVitalsForDoctor = async (req, res, next) => {
  try {
    const result = await vitalService.getPatientVitalsForDoctor(req.params.patientId);

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    return res.status(200).json({
      success: true,
      count: result.vitals.length,
      data: result.vitals
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while retrieving patient vitals",
      error: error.message
    });
  }
};

const getLatestPatientVitalsForDoctor = async (req, res, next) => {
  try {
    const result = await vitalService.getLatestPatientVitalsForDoctor(req.params.patientId);

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: result.vitals
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while retrieving latest patient vitals",
      error: error.message
    });
  }
};

const getPatientVitalsHistory = async (req, res, next) => {
  try {
    const result = await vitalService.getPatientVitalsHistory(req.params.patientId, req.query);

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    return res.status(200).json({
      success: true,
      count: result.vitals.length,
      data: result.vitals
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while retrieving patient vitals history",
      error: error.message
    });
  }
};

const startDeviceSimulation = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "patientId is required"
      });
    }

    const state = virtualDeviceService.start(req.user.userId, patientId);

    return res.status(200).json({
      success: true,
      message: "Virtual device simulation started",
      data: state
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to start virtual device simulation",
      error: error.message
    });
  }
};

const stopDeviceSimulation = async (req, res, next) => {
  try {
    const state = virtualDeviceService.stop();
    return res.status(200).json({
      success: true,
      message: "Virtual device simulation stopped",
      data: state
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to stop virtual device simulation",
      error: error.message
    });
  }
};

const getDeviceSimulationStatus = async (req, res, next) => {
  try {
    const state = virtualDeviceService.status();
    return res.status(200).json({
      success: true,
      data: state
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get virtual device status",
      error: error.message
    });
  }
};

const updateDeviceSource = async (req, res, next) => {
  try {
    const { patientId, deviceSource } = req.body;
    if (!patientId || !deviceSource) {
      return res.status(400).json({
        success: false,
        message: "patientId and deviceSource are required"
      });
    }

    if (deviceSource !== "LIVE" && deviceSource !== "VIRTUAL") {
      return res.status(400).json({
        success: false,
        message: "Invalid deviceSource. Must be LIVE or VIRTUAL"
      });
    }

    const patient = await userService.updatePatientDeviceSource(patientId, deviceSource);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Device source updated successfully",
      data: patient
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update device source",
      error: error.message
    });
  }
};

const recordDeviceTelemetry = async (req, res, next) => {
  try {
    const deviceIdHeader = req.headers["x-device-id"];
    const deviceApiKeyHeader = req.headers["x-device-api-key"];

    const expectedDeviceId = process.env.DEVICE_ID;
    const expectedDeviceApiKey = process.env.DEVICE_API_KEY;

    if (!deviceIdHeader || !deviceApiKeyHeader || deviceIdHeader !== expectedDeviceId || deviceApiKeyHeader !== expectedDeviceApiKey) {
      return res.status(401).json({
        success: false,
        message: "Invalid device credentials"
      });
    }

    const { patientId, heartRate, spo2, temperature } = req.body;

    if (patientId === undefined || patientId === null) {
      return res.status(400).json({
        success: false,
        message: "patientId is required"
      });
    }

    if (heartRate === undefined || heartRate === null || typeof heartRate !== "number" || heartRate < 20 || heartRate > 250) {
      return res.status(400).json({
        success: false,
        message: "Invalid heartRate. Must be a number between 20 and 250"
      });
    }

    if (spo2 === undefined || spo2 === null || typeof spo2 !== "number" || spo2 < 0 || spo2 > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid spo2. Must be a number between 0 and 100"
      });
    }

    if (temperature === undefined || temperature === null || typeof temperature !== "number" || temperature < 25 || temperature > 45) {
      return res.status(400).json({
        success: false,
        message: "Invalid temperature. Must be a number between 25 and 45"
      });
    }

    const result = await vitalService.recordDeviceTelemetry(req.body);

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    if (result.noAppointment) {
      return res.status(400).json({
        success: false,
        message: "No appointment found for this patient to link telemetry data"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Vital recorded successfully",
      data: result.vitals
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while recording telemetry vitals",
      error: error.message
    });
  }
};

module.exports = {
  recordVitals,
  getPatientVitals,
  getPatientVitalsForDoctor,
  getLatestPatientVitalsForDoctor,
  getPatientVitalsHistory,
  startDeviceSimulation,
  stopDeviceSimulation,
  getDeviceSimulationStatus,
  updateDeviceSource,
  recordDeviceTelemetry
};
