const vitalService = require("../services/vital.service");

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

module.exports = {
  recordVitals,
  getPatientVitals,
  getPatientVitalsForDoctor,
  getLatestPatientVitalsForDoctor,
  getPatientVitalsHistory
};
