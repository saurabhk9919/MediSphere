const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

class AuthService {
  async signup(userData) {
    if (!userData) {
      throw new Error("Request body is missing or empty");
    }

    const requiredFields = ["fullName", "email", "password", "role"];
    for (const field of requiredFields) {
      const value = userData[field];
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        throw new Error(`${field} is required`);
      }
    }

    // Role validation
    const allowedRoles = ["patient", "doctor"];
    const normalizedRole = userData.role.toLowerCase();
    if (!allowedRoles.includes(normalizedRole)) {
      throw new Error("Invalid role. Role must be 'patient' or 'doctor'");
    }

    // Check if email already exists
    const checkEmailSql = "SELECT id FROM users WHERE email = $1;";
    const existingUser = await pool.query(checkEmailSql, [userData.email]);
    if (existingUser.rows.length > 0) {
      throw new Error("Email already registered");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert user
      const insertUserSql = `
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
      `;
      const userResult = await client.query(insertUserSql, [
        userData.fullName,
        userData.email,
        hashedPassword,
        userData.role
      ]);
      const userId = userResult.rows[0].id;

      // Insert role-specific profile
      if (normalizedRole === "patient") {
        const insertPatientSql = `
          INSERT INTO patients (user_id)
          VALUES ($1);
        `;
        await client.query(insertPatientSql, [userId]);
      } else if (normalizedRole === "doctor") {
        const insertDoctorSql = `
          INSERT INTO doctors (user_id, specialization, license_no)
          VALUES ($1, $2, $3);
        `;
        const specialization = userData.specialization || "General Medicine";
        const licenseNo = userData.licenseNo || userData.license_no || "TEMP_LICENSE";
        await client.query(insertDoctorSql, [userId, specialization, licenseNo]);
      }

      await client.query("COMMIT");

      return {
        success: true,
        message: "User registered successfully",
        data: {
          userId,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role
        }
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error("Database transaction failed: " + err.message);
    } finally {
      client.release();
    }
  }

  /**
   * Basic login business logic scaffolding
   * @param {Object} credentials 
   * @returns {Promise<Object>}
   */
  async login(credentials) {
    if (!credentials) {
      throw new Error("Request body is missing or empty");
    }

    const requiredFields = ["email", "password"];
    for (const field of requiredFields) {
      const value = credentials[field];
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        throw new Error(`${field} is required`);
      }
    }

    // Lookup user in database
    const selectUserSql = `
      SELECT id, full_name, email, password_hash, role
      FROM users
      WHERE email = $1;
    `;
    const userResult = await pool.query(selectUserSql, [credentials.email]);
    if (userResult.rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || process.env.JWT_Secret,
      {
        expiresIn: "7d"
      }
    );

    return {
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      }
    };
  }
}

module.exports = new AuthService();
