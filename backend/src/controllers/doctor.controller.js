const doctorService = require("../services/doctor.service");

/**
 * Handle listing of all doctors, supporting optional search, specialization filtering, and pagination.
 */
const getAllDoctors = async (req, res, next) => {
  try {
    const { search, specialization, page, limit } = req.query;
    
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 10;

    const result = await doctorService.getAllDoctors({
      search,
      specialization,
      page: parsedPage,
      limit: parsedLimit
    });

    return res.status(200).json({
      success: true,
      pagination: result.pagination,
      count: result.doctors.length,
      data: result.doctors
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while listing doctors",
      error: error.message
    });
  }
};

/**
 * Handle fetching doctor details by User ID.
 */
const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while fetching doctor details",
      error: error.message
    });
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById
};
