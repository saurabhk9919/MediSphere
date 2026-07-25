const prescriptionService = require("../services/prescription.service");

const createPrescription = async (req, res, next) => {
  try {
    const { appointmentId, diagnosis, medications, notes } = req.body;

    if (appointmentId === undefined || appointmentId === null) {
      return res.status(400).json({
        success: false,
        message: "appointmentId is required"
      });
    }
    if (diagnosis === undefined || diagnosis === null) {
      return res.status(400).json({
        success: false,
        message: "diagnosis is required"
      });
    }
    if (medications === undefined || medications === null) {
      return res.status(400).json({
        success: false,
        message: "medications is required"
      });
    }
    if (notes === undefined || notes === null) {
      return res.status(400).json({
        success: false,
        message: "notes is required"
      });
    }

    const result = await prescriptionService.createPrescription(req.user.userId, req.body);

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    if (result.forbidden) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    if (result.statusConflict) {
      return res.status(409).json({
        success: false,
        message: "Prescription can only be created for completed appointments"
      });
    }

    if (result.prescriptionConflict) {
      return res.status(409).json({
        success: false,
        message: "A prescription already exists for this appointment"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: result.prescription
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while creating prescription",
      error: error.message
    });
  }
};

const getPatientPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await prescriptionService.getPatientPrescriptions(req.user.userId);
    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while retrieving patient prescriptions",
      error: error.message
    });
  }
};

const getDoctorPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await prescriptionService.getDoctorPrescriptions(req.user.userId);
    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while retrieving doctor prescriptions",
      error: error.message
    });
  }
};

module.exports = {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions
};
