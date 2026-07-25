const pool = require("../config/db");

class VitalService {
  async recordVitals(userId, vitalsData) {
    const { patientId, heartRate, spo2, temperature } = vitalsData;

    const doctorQuery = "SELECT id FROM doctors WHERE user_id = $1;";
    const doctorResult = await pool.query(doctorQuery, [userId]);
    
    if (doctorResult.rows.length === 0) {
      return { forbidden: true };
    }
    const doctorIdDb = doctorResult.rows[0].id;

    const patientQuery = "SELECT id FROM patients WHERE user_id = $1 OR id = $1 LIMIT 1;";
    const patientResult = await pool.query(patientQuery, [patientId]);

    if (patientResult.rows.length === 0) {
      return { notFound: true };
    }
    const patientIdDb = patientResult.rows[0].id;

    let appointmentId = null;
    const apptDocQuery = `
      SELECT id FROM appointments
      WHERE patient_id = $1 AND doctor_id = $2
      ORDER BY appointment_date DESC
      LIMIT 1;
    `;
    const apptDocResult = await pool.query(apptDocQuery, [patientIdDb, doctorIdDb]);
    
    if (apptDocResult.rows.length > 0) {
      appointmentId = apptDocResult.rows[0].id;
    } else {
      const apptFallbackQuery = `
        SELECT id FROM appointments
        WHERE patient_id = $1
        ORDER BY appointment_date DESC
        LIMIT 1;
      `;
      const apptFallbackResult = await pool.query(apptFallbackQuery, [patientIdDb]);
      if (apptFallbackResult.rows.length > 0) {
        appointmentId = apptFallbackResult.rows[0].id;
      }
    }

    if (!appointmentId) {
      return { noAppointment: true };
    }

    const insertQuery = `
      INSERT INTO vitals (appointment_id, heart_rate, spo2, body_temperature, captured_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    const insertResult = await pool.query(insertQuery, [
      appointmentId,
      heartRate,
      spo2,
      temperature
    ]);

    return { success: true, vitals: insertResult.rows[0] };
  }

  async getPatientVitals(userId) {
    const query = `
      SELECT 
        v.id AS "vitalId",
        v.heart_rate AS "heartRate",
        v.spo2,
        v.body_temperature AS "temperature",
        v.captured_at AS "recordedAt",
        u.id AS "doctorId",
        u.full_name AS "doctorFullName",
        d.specialization AS "doctorSpecialization"
      FROM vitals v
      INNER JOIN appointments a ON v.appointment_id = a.id
      INNER JOIN patients p ON a.patient_id = p.id
      INNER JOIN doctors d ON a.doctor_id = d.id
      INNER JOIN users u ON d.user_id = u.id
      WHERE p.user_id = $1
      ORDER BY v.captured_at DESC;
    `;

    const result = await pool.query(query, [userId]);

    return result.rows.map(row => ({
      vitalId: row.vitalId,
      heartRate: row.heartRate,
      spo2: row.spo2,
      temperature: row.temperature,
      recordedAt: row.recordedAt,
      doctor: {
        id: row.doctorId,
        fullName: row.doctorFullName,
        specialization: row.doctorSpecialization
      }
    }));
  }

  async getPatientVitalsForDoctor(patientId) {
    const patientQuery = "SELECT id FROM patients WHERE user_id = $1 OR id = $1 LIMIT 1;";
    const patientResult = await pool.query(patientQuery, [patientId]);

    if (patientResult.rows.length === 0) {
      return { notFound: true };
    }
    const patientIdDb = patientResult.rows[0].id;

    const query = `
      SELECT 
        v.id AS "vitalId",
        v.heart_rate AS "heartRate",
        v.spo2,
        v.body_temperature AS "temperature",
        v.captured_at AS "recordedAt"
      FROM vitals v
      INNER JOIN appointments a ON v.appointment_id = a.id
      WHERE a.patient_id = $1
      ORDER BY v.captured_at DESC;
    `;
    const result = await pool.query(query, [patientIdDb]);

    const mappedVitals = result.rows.map(row => ({
      vitalId: row.vitalId,
      heartRate: row.heartRate,
      spo2: row.spo2,
      temperature: row.temperature,
      recordedAt: row.recordedAt
    }));

    return { success: true, vitals: mappedVitals };
  }

  async getLatestPatientVitalsForDoctor(patientId) {
    const patientQuery = "SELECT id FROM patients WHERE user_id = $1 OR id = $1 LIMIT 1;";
    const patientResult = await pool.query(patientQuery, [patientId]);

    if (patientResult.rows.length === 0) {
      return { notFound: true };
    }
    const patientIdDb = patientResult.rows[0].id;

    const query = `
      SELECT 
        v.id AS "vitalId",
        v.heart_rate AS "heartRate",
        v.spo2,
        v.body_temperature AS "temperature",
        v.captured_at AS "recordedAt"
      FROM vitals v
      INNER JOIN appointments a ON v.appointment_id = a.id
      WHERE a.patient_id = $1
      ORDER BY v.captured_at DESC
      LIMIT 1;
    `;
    const result = await pool.query(query, [patientIdDb]);

    if (result.rows.length === 0) {
      return { success: true, vitals: null };
    }

    const row = result.rows[0];
    const latestVital = {
      vitalId: row.vitalId,
      heartRate: row.heartRate,
      spo2: row.spo2,
      temperature: row.temperature,
      recordedAt: row.recordedAt
    };

    return { success: true, vitals: latestVital };
  }

  async getPatientVitalsHistory(patientId, filters) {
    const patientQuery = "SELECT id FROM patients WHERE user_id = $1 OR id = $1 LIMIT 1;";
    const patientResult = await pool.query(patientQuery, [patientId]);

    if (patientResult.rows.length === 0) {
      return { notFound: true };
    }
    const patientIdDb = patientResult.rows[0].id;

    const { days, from, to } = filters;
    let query = `
      SELECT 
        v.id AS "vitalId",
        v.heart_rate AS "heartRate",
        v.spo2,
        v.body_temperature AS "temperature",
        v.captured_at AS "recordedAt"
      FROM vitals v
      INNER JOIN appointments a ON v.appointment_id = a.id
      WHERE a.patient_id = $1
    `;
    const params = [patientIdDb];

    if (days) {
      query += ` AND v.captured_at >= NOW() - ($2 * INTERVAL '1 day')`;
      params.push(parseInt(days, 10));
    } else if (from && to) {
      query += ` AND v.captured_at >= $2::timestamp AND v.captured_at < $3::timestamp + INTERVAL '1 day'`;
      params.push(from);
      params.push(to);
    }

    query += ` ORDER BY v.captured_at ASC;`;

    const result = await pool.query(query, params);

    const mappedVitals = result.rows.map(row => ({
      vitalId: row.vitalId,
      heartRate: row.heartRate,
      spo2: row.spo2,
      temperature: row.temperature,
      recordedAt: row.recordedAt
    }));

    return { success: true, vitals: mappedVitals };
  }
}

module.exports = new VitalService();
