const pool = require("./src/config/db");

async function migrate() {
  try {
    console.log("Checking if hidden_from_doctor column exists in appointments table...");
    
    // Check if column exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='appointments' and column_name='hidden_from_doctor';
    `;
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log("Column hidden_from_doctor does not exist. Adding column...");
      const addColumnQuery = `
        ALTER TABLE appointments 
        ADD COLUMN hidden_from_doctor BOOLEAN DEFAULT false;
      `;
      await pool.query(addColumnQuery);
      console.log("Column hidden_from_doctor added successfully!");
    } else {
      console.log("Column hidden_from_doctor already exists. Skipping.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

migrate();
