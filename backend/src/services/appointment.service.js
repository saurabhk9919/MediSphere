const pool = require("../config/db");

class AppointmentService {
  /**
   * Book a new appointment for a patient, preventing double booking.
   * 
   * @param {number|string} userId - User ID of the logged-in patient.
   * @param {Object} appointmentData - Appointment details.
   * @param {number} appointmentData.doctorId - Exposed doctor ID (User ID or Doctor PK ID).
   * @param {string} appointmentData.appointmentDate - Date in YYYY-MM-DD.
   * @param {string} appointmentData.appointmentTime - Time in HH:MM.
   * @param {string} appointmentData.reason - Reason for booking.
   * @returns {Promise<Object|null>} Created appointment object, `{ conflict: true }`, or null if doctor is not found.
   */
  async bookAppointment(userId, appointmentData) {
    const { doctorId, appointmentDate, appointmentTime, reason } = appointmentData;

    // 1. Fetch patient's DB primary key 'id' using their user_id
    const patientQuery = "SELECT id FROM patients WHERE user_id = $1;";
    const patientResult = await pool.query(patientQuery, [userId]);
    
    if (patientResult.rows.length === 0) {
      throw new Error("Logged-in user does not have a patient profile.");
    }
    const patientId = patientResult.rows[0].id;

    // 2. Fetch doctor's DB primary key 'id'
    let doctorIdDb = null;
    const doctorUserQuery = "SELECT id FROM doctors WHERE user_id = $1;";
    const doctorUserResult = await pool.query(doctorUserQuery, [doctorId]);
    
    if (doctorUserResult.rows.length > 0) {
      doctorIdDb = doctorUserResult.rows[0].id;
    } else {
      const doctorIdQuery = "SELECT id FROM doctors WHERE id = $1;";
      const doctorIdResult = await pool.query(doctorIdQuery, [doctorId]);
      if (doctorIdResult.rows.length > 0) {
        doctorIdDb = doctorIdResult.rows[0].id;
      }
    }

    if (!doctorIdDb) {
      return null;
    }

    // 3. Combine date and time to parse as PostgreSQL timestamp
    const appointmentTimestamp = `${appointmentDate} ${appointmentTime}`;

    // 4. Prevent double booking: check if another scheduled appointment exists for the same doctor/time
    const checkQuery = `
      SELECT id FROM appointments
      WHERE doctor_id = $1 AND appointment_date = $2 AND status = 'Scheduled';
    `;
    const checkResult = await pool.query(checkQuery, [doctorIdDb, appointmentTimestamp]);
    if (checkResult.rows.length > 0) {
      return { conflict: true };
    }

    // 5. Insert appointment record
    const insertQuery = `
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const insertResult = await pool.query(insertQuery, [
      patientId,
      doctorIdDb,
      appointmentTimestamp,
      "Scheduled",
      reason
    ]);

    return insertResult.rows[0];
  }

  /**
   * Fetch all appointments belonging to the authenticated patient, joined and formatted.
   * Sorts newest appointments first.
   * 
   * @param {number|string} userId - User ID of the patient.
   * @returns {Promise<Array>} List of formatted patient appointments.
   */
  async getPatientAppointments(userId) {
    const query = `
      SELECT 
        a.id AS "appointmentId",
        a.appointment_date,
        a.reason,
        a.status,
        u.id AS "doctorId",
        u.full_name AS "doctorFullName",
        d.specialization AS "doctorSpecialization",
        d.consultation_fee AS "doctorConsultationFee"
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.id
      INNER JOIN doctors d ON a.doctor_id = d.id
      INNER JOIN users u ON d.user_id = u.id
      WHERE p.user_id = $1
      ORDER BY a.appointment_date DESC;
    `;

    const result = await pool.query(query, [userId]);

    return result.rows.map(row => {
      const dateObj = new Date(row.appointment_date);
      
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const date = String(dateObj.getDate()).padStart(2, '0');
      const appointmentDate = `${year}-${month}-${date}`;

      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const appointmentTime = `${hours}:${minutes}`;

      return {
        appointmentId: row.appointmentId,
        appointmentDate,
        appointmentTime,
        reason: row.reason,
        status: row.status,
        doctor: {
          id: row.doctorId,
          fullName: row.doctorFullName,
          specialization: row.doctorSpecialization,
          consultationFee: row.doctorConsultationFee
        }
      };
    });
  }

  /**
   * Fetch all appointments assigned to the authenticated doctor, joined and formatted.
   * Sorts newest appointments first.
   * 
   * @param {number|string} userId - User ID of the doctor.
   * @returns {Promise<Array>} List of formatted doctor appointments.
   */
  async getDoctorAppointments(userId) {
    const query = `
      SELECT 
        a.id AS "appointmentId",
        a.appointment_date,
        a.reason,
        a.status,
        u.id AS "patientId",
        u.full_name AS "patientFullName",
        u.email AS "patientEmail",
        p.phone AS "patientPhone",
        p.age AS "patientAge",
        p.gender AS "patientGender",
        p.blood_group AS "patientBloodGroup"
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.id
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN doctors d ON a.doctor_id = d.id
      WHERE d.user_id = $1
      ORDER BY a.appointment_date DESC;
    `;

    const result = await pool.query(query, [userId]);

    return result.rows.map(row => {
      const dateObj = new Date(row.appointment_date);
      
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const date = String(dateObj.getDate()).padStart(2, '0');
      const appointmentDate = `${year}-${month}-${date}`;

      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const appointmentTime = `${hours}:${minutes}`;

      return {
        appointmentId: row.appointmentId,
        appointmentDate,
        appointmentTime,
        reason: row.reason,
        status: row.status,
        patient: {
          id: row.patientId,
          fullName: row.patientFullName,
          email: row.patientEmail,
          phone: row.patientPhone,
          age: row.patientAge,
          gender: row.patientGender,
          bloodGroup: row.patientBloodGroup
        }
      };
    });
  }

  /**
   * Update the status of an appointment.
   * Restricted to the assigned doctor.
   * Cannot modify status once Completed or Cancelled.
   * 
   * @param {number|string} userId - User ID of the logged-in doctor.
   * @param {number|string} appointmentId - ID of the appointment.
   * @param {string} newStatus - New status ("Scheduled", "Completed", or "Cancelled").
   * @returns {Promise<Object>} Status update result metadata and updated appointment.
   */
  async updateAppointmentStatus(userId, appointmentId, newStatus) {
    // 1. Fetch the doctor's DB primary key 'id' using user_id
    const doctorQuery = "SELECT id FROM doctors WHERE user_id = $1;";
    const doctorResult = await pool.query(doctorQuery, [userId]);
    
    if (doctorResult.rows.length === 0) {
      return { forbidden: true };
    }
    const doctorIdDb = doctorResult.rows[0].id;

    // 2. Fetch the appointment to verify existence and doctor ownership
    const appointmentQuery = "SELECT * FROM appointments WHERE id = $1;";
    const appointmentResult = await pool.query(appointmentQuery, [appointmentId]);

    if (appointmentResult.rows.length === 0) {
      return { notFound: true };
    }
    const appointment = appointmentResult.rows[0];

    // 3. Verify ownership
    if (appointment.doctor_id !== doctorIdDb) {
      return { forbidden: true };
    }

    // 4. Verify that current status is not Completed or Cancelled
    if (appointment.status === "Completed" || appointment.status === "Cancelled") {
      return { conflict: true };
    }

    // 5. Update appointment status
    const updateQuery = `
      UPDATE appointments
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const updateResult = await pool.query(updateQuery, [newStatus, appointmentId]);
    return { success: true, appointment: updateResult.rows[0] };
  }

  /**
   * Cancel an appointment.
   * Restricted to the booking patient.
   * Can only cancel Scheduled appointments.
   * 
   * @param {number|string} userId - User ID of the logged-in patient.
   * @param {number|string} appointmentId - ID of the appointment.
   * @returns {Promise<Object>} Cancellation result metadata and updated appointment.
   */
  async cancelAppointment(userId, appointmentId) {
    // 1. Fetch patient's DB primary key 'id' using user_id
    const patientQuery = "SELECT id FROM patients WHERE user_id = $1;";
    const patientResult = await pool.query(patientQuery, [userId]);

    if (patientResult.rows.length === 0) {
      return { forbidden: true };
    }
    const patientIdDb = patientResult.rows[0].id;

    // 2. Fetch appointment to verify existence and ownership
    const appointmentQuery = "SELECT * FROM appointments WHERE id = $1;";
    const appointmentResult = await pool.query(appointmentQuery, [appointmentId]);

    if (appointmentResult.rows.length === 0) {
      return { notFound: true };
    }
    const appointment = appointmentResult.rows[0];

    // 3. Verify ownership
    if (appointment.patient_id !== patientIdDb) {
      return { forbidden: true };
    }

    // 4. Verify that current status is Scheduled (i.e. not Completed or Cancelled)
    if (appointment.status === "Completed" || appointment.status === "Cancelled") {
      return { conflict: true };
    }

    // 5. Update status to Cancelled
    const updateQuery = `
      UPDATE appointments
      SET status = 'Cancelled'
      WHERE id = $1
      RETURNING *;
    `;
    const updateResult = await pool.query(updateQuery, [appointmentId]);
    return { success: true, appointment: updateResult.rows[0] };
  }
}

module.exports = new AppointmentService();
