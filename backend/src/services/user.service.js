const pool = require("../config/db");

class UserService {
  /**
   * Fetch user profile from users and role-specific profile table.
   * @param {number|string} userId - The authenticated user ID.
   * @returns {Promise<Object|null>} Combined user profile or null.
   */
  async getProfile(userId) {
    // 1. Query the users table first. Retrieve id, full_name, email, role
    const userQuery = `
      SELECT id, full_name, email, role
      FROM users
      WHERE id = $1;
    `;
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];
    let profileData = {};

    // 2. Fetch role-specific details
    if (user.role === "patient") {
      const patientQuery = `
        SELECT *
        FROM patients
        WHERE user_id = $1;
      `;
      const patientResult = await pool.query(patientQuery, [userId]);
      if (patientResult.rows.length > 0) {
        profileData = patientResult.rows[0];
      }
    } else if (user.role === "doctor") {
      const doctorQuery = `
        SELECT *
        FROM doctors
        WHERE user_id = $1;
      `;
      const doctorResult = await pool.query(doctorQuery, [userId]);
      if (doctorResult.rows.length > 0) {
        profileData = doctorResult.rows[0];
      }
    }

    // 3. Combined response
    // Exclude sub-table primary key id (if any) and user_id to prevent collision/override.
    const { id: profileId, user_id, ...profileRest } = profileData;

    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      ...profileRest
    };
  }

  /**
   * Update user profile in users and role-specific profile table within a transaction.
   * @param {number|string} userId - The authenticated user ID.
   * @param {Object} updateData - Object containing keys to update.
   * @returns {Promise<Object|null>} Fully updated user profile or null if not found.
   */
  async updateProfile(userId, updateData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Fetch user to check existence and role
      const userRes = await client.query("SELECT id, role FROM users WHERE id = $1 FOR UPDATE;", [userId]);
      if (userRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }
      
      const user = userRes.rows[0];

      // 2. Update common users table (only full_name allowed)
      if (updateData.full_name !== undefined) {
        const updateUsersSql = `
          UPDATE users
          SET full_name = $1
          WHERE id = $2
          RETURNING *;
        `;
        await client.query(updateUsersSql, [updateData.full_name, userId]);
      }

      // 3. Update role-specific table
      if (user.role === "patient") {
        const allowedPatientFields = ["age", "gender", "blood_group", "phone", "address"];
        const updates = [];
        const values = [];
        let index = 1;

        for (const field of allowedPatientFields) {
          if (updateData[field] !== undefined) {
            updates.push(`${field} = $${index}`);
            values.push(updateData[field]);
            index++;
          }
        }

        if (updates.length > 0) {
          values.push(userId);
          const updatePatientSql = `
            UPDATE patients
            SET ${updates.join(", ")}
            WHERE user_id = $${index}
            RETURNING *;
          `;
          await client.query(updatePatientSql, values);
        }
      } else if (user.role === "doctor") {
        const allowedDoctorFields = ["specialization", "experience", "consultation_fee"];
        const updates = [];
        const values = [];
        let index = 1;

        for (const field of allowedDoctorFields) {
          if (updateData[field] !== undefined) {
            updates.push(`${field} = $${index}`);
            values.push(updateData[field]);
            index++;
          }
        }

        if (updates.length > 0) {
          values.push(userId);
          const updateDoctorSql = `
            UPDATE doctors
            SET ${updates.join(", ")}
            WHERE user_id = $${index}
            RETURNING *;
          `;
          await client.query(updateDoctorSql, values);
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return this.getProfile(userId);
  }

  async updatePatientDeviceSource(patientId, deviceSource) {
    const query = `
      UPDATE patients
      SET device_source = $1
      WHERE id = $2 OR user_id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [deviceSource, patientId]);
    return result.rows[0];
  }
}

module.exports = new UserService();
