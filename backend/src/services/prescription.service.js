const pool = require("../config/db");

class PrescriptionService {
  async createPrescription(userId, prescriptionData) {
    const { appointmentId, diagnosis, medications, notes } = prescriptionData;

    const doctorQuery = "SELECT id FROM doctors WHERE user_id = $1;";
    const doctorResult = await pool.query(doctorQuery, [userId]);
    
    if (doctorResult.rows.length === 0) {
      return { forbidden: true };
    }
    const doctorIdDb = doctorResult.rows[0].id;

    const appointmentQuery = "SELECT * FROM appointments WHERE id = $1;";
    const appointmentResult = await pool.query(appointmentQuery, [appointmentId]);

    if (appointmentResult.rows.length === 0) {
      return { notFound: true };
    }
    const appointment = appointmentResult.rows[0];

    if (appointment.doctor_id !== doctorIdDb) {
      return { forbidden: true };
    }

    if (appointment.status !== "Completed") {
      return { statusConflict: true };
    }

    const checkQuery = "SELECT id FROM prescriptions WHERE appointment_id = $1;";
    const checkResult = await pool.query(checkQuery, [appointmentId]);
    if (checkResult.rows.length > 0) {
      return { prescriptionConflict: true };
    }

    const insertQuery = `
      INSERT INTO prescriptions (appointment_id, diagnosis, medicines, advice, prescribed_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    const insertResult = await pool.query(insertQuery, [
      appointmentId,
      diagnosis,
      medications,
      notes
    ]);

    return { success: true, prescription: insertResult.rows[0] };
  }

  async getPatientPrescriptions(userId) {
    const query = `
      SELECT 
        pr.id AS "prescriptionId",
        pr.diagnosis,
        pr.medicines AS "medications",
        pr.advice AS "notes",
        a.id AS "appointmentId",
        a.appointment_date,
        u.id AS "doctorId",
        u.full_name AS "doctorFullName",
        d.specialization AS "doctorSpecialization"
      FROM prescriptions pr
      INNER JOIN appointments a ON pr.appointment_id = a.id
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
        prescriptionId: row.prescriptionId,
        diagnosis: row.diagnosis,
        medications: row.medications,
        notes: row.notes,
        appointment: {
          appointmentId: row.appointmentId,
          appointmentDate,
          appointmentTime
        },
        doctor: {
          id: row.doctorId,
          fullName: row.doctorFullName,
          specialization: row.doctorSpecialization
        }
      };
    });
  }

  async getDoctorPrescriptions(userId) {
    const query = `
      SELECT 
        pr.id AS "prescriptionId",
        pr.diagnosis,
        pr.medicines AS "medications",
        pr.advice AS "notes",
        a.id AS "appointmentId",
        a.appointment_date,
        u.id AS "patientId",
        u.full_name AS "patientFullName",
        p.age AS "patientAge",
        p.gender AS "patientGender",
        p.blood_group AS "patientBloodGroup"
      FROM prescriptions pr
      INNER JOIN appointments a ON pr.appointment_id = a.id
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
        prescriptionId: row.prescriptionId,
        diagnosis: row.diagnosis,
        medications: row.medications,
        notes: row.notes,
        appointment: {
          appointmentId: row.appointmentId,
          appointmentDate,
          appointmentTime
        },
        patient: {
          id: row.patientId,
          fullName: row.patientFullName,
          age: row.patientAge,
          gender: row.patientGender,
          bloodGroup: row.patientBloodGroup
        }
      };
    });
  }
}

module.exports = new PrescriptionService();
