const pool = require("../config/db");

class DoctorService {
  /**
   * List all doctors, joined with user details, optionally filtered and sorted alphabetically.
   * Supports optional search (keyword match on name/spec) and specialization exact match.
   * 
   * @param {Object} [filters] - Query filter parameters.
   * @param {string} [filters.search] - Optional keyword search string.
   * @param {string} [filters.specialization] - Optional specialization filter.
   * @param {number} [filters.page=1] - Page number.
   * @param {number} [filters.limit=10] - Record limit per page.
   * @returns {Promise<Object>} Object containing pagination metadata and matching doctors rows.
   */
  async getAllDoctors(filters = {}) {
    const { search, specialization } = filters;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const offset = (page - 1) * limit;

    // 1. Build Base Where Clause
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim() !== "") {
      conditions.push(`(u.full_name ILIKE $${paramIndex} OR d.specialization ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (specialization && specialization.trim() !== "") {
      conditions.push(`d.specialization ILIKE $${paramIndex}`);
      params.push(specialization.trim());
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";

    // 2. Count Query to get total records matching the filters
    const countQuery = `
      SELECT COUNT(*)
      FROM users u
      INNER JOIN doctors d ON u.id = d.user_id
      ${whereClause};
    `;
    const countResult = await pool.query(countQuery, params);
    const totalRecords = Number(countResult.rows[0].count);

    // 3. Paginated Data Query
    const dataParams = [...params];
    const limitParamIndex = paramIndex;
    const offsetParamIndex = paramIndex + 1;
    dataParams.push(limit, offset);

    const dataQuery = `
      SELECT 
        u.id, 
        u.full_name, 
        d.specialization, 
        d.experience, 
        d.consultation_fee
      FROM users u
      INNER JOIN doctors d ON u.id = d.user_id
      ${whereClause}
      ORDER BY u.full_name ASC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex};
    `;

    const dataResult = await pool.query(dataQuery, dataParams);
    
    const totalPages = Math.ceil(totalRecords / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      doctors: dataResult.rows,
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages,
        hasNext,
        hasPrevious
      }
    };
  }

  /**
   * Fetch a single doctor by their User ID, mapping keys to camelCase.
   * @param {number|string} doctorId - User ID of the doctor.
   * @returns {Promise<Object|null>} Doctor profile details or null if not found.
   */
  async getDoctorById(doctorId) {
    const query = `
      SELECT 
        u.id, 
        u.full_name AS "fullName", 
        u.email, 
        d.specialization, 
        d.experience, 
        d.consultation_fee AS "consultationFee"
      FROM users u
      INNER JOIN doctors d ON u.id = d.user_id
      WHERE u.id = $1;
    `;
    const result = await pool.query(query, [doctorId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }
}

module.exports = new DoctorService();
