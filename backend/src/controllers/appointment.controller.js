const appointmentService = require("../services/appointment.service");

/**
 * Handle request to book a new appointment.
 */
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

    // Validate required fields
    if (doctorId === undefined || doctorId === null) {
      return res.status(400).json({
        success: false,
        message: "doctorId is required"
      });
    }
    if (!appointmentDate || (typeof appointmentDate === "string" && appointmentDate.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "appointmentDate is required"
      });
    }
    if (!appointmentTime || (typeof appointmentTime === "string" && appointmentTime.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "appointmentTime is required"
      });
    }
    if (!reason || (typeof reason === "string" && reason.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "reason is required"
      });
    }

    // Call service to book appointment
    const appointment = await appointmentService.bookAppointment(req.user.userId, req.body);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Check for schedule conflict (double booking)
    if (appointment.conflict) {
      return res.status(409).json({
        success: false,
        message: "This appointment slot is already booked."
      });
    }

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while booking appointment",
      error: error.message
    });
  }
};

/**
 * Handle request to retrieve all appointments belonging to the logged-in patient.
 */
const getPatientAppointments = async (req, res, next) => {
  try {
    const appointments = await appointmentService.getPatientAppointments(req.user.userId);
    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while retrieving patient appointments",
      error: error.message
    });
  }
};

/**
 * Handle request to retrieve all appointments assigned to the logged-in doctor.
 */
const getDoctorAppointments = async (req, res, next) => {
  try {
    const appointments = await appointmentService.getDoctorAppointments(req.user.userId);
    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while retrieving doctor appointments",
      error: error.message
    });
  }
};

/**
 * Handle request to update the status of an appointment.
 */
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const appointmentId = req.params.id;

    // Validate status values
    const allowedStatuses = ["Scheduled", "Completed", "Cancelled"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Allowed values: Scheduled, Completed, Cancelled"
      });
    }

    const result = await appointmentService.updateAppointmentStatus(req.user.userId, appointmentId, status);

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

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: "Cannot update status of a Completed or Cancelled appointment"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: result.appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while updating appointment status",
      error: error.message
    });
  }
};

/**
 * Handle request to cancel an appointment.
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;

    const result = await appointmentService.cancelAppointment(req.user.userId, appointmentId);

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

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: "Cannot cancel a Completed or Cancelled appointment"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: result.appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while cancelling appointment",
      error: error.message
    });
  }
};

/**
 * Handle request to save consultation vitals on an appointment.
 */
const updateConsultationVitals = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const { heartRate, spo2, temperature } = req.body;

    if (heartRate === undefined || heartRate === null) {
      return res.status(400).json({ success: false, message: "heartRate is required" });
    }
    if (spo2 === undefined || spo2 === null) {
      return res.status(400).json({ success: false, message: "spo2 is required" });
    }
    if (temperature === undefined || temperature === null) {
      return res.status(400).json({ success: false, message: "temperature is required" });
    }

    const result = await appointmentService.updateConsultationVitals(req.user.userId, appointmentId, {
      heartRate: parseInt(heartRate, 10),
      spo2: parseInt(spo2, 10),
      temperature: parseFloat(temperature)
    });

    if (result.notFound) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    if (result.forbidden) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({
      success: true,
      message: "Consultation vitals updated successfully",
      data: result.appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while updating consultation vitals",
      error: error.message
    });
  }
};
/**
 * Handle request to hide an appointment from doctor's view.
 */
const hideAppointmentFromDoctor = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const result = await appointmentService.hideAppointmentFromDoctor(req.user.userId, appointmentId);

    if (result.notFound) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    if (result.forbidden) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment hidden from dashboard successfully",
      data: result.appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while hiding appointment",
      error: error.message
    });
  }
};

module.exports = {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  updateConsultationVitals,
  hideAppointmentFromDoctor
};
