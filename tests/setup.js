require('dotenv').config({ path: '.env.test' });

const db = require('../src/db');

// Global setup for all tests
beforeAll(async () => {
  try {
    // Authenticate database connection
    await db.sequelize.authenticate();
    console.log('Test database connection established successfully.');
    
    // Sync database schema (force: true drops and recreates tables)
    await db.sequelize.sync({ force: true });
    console.log('Test database synchronized.');
  } catch (error) {
    console.error('Unable to connect to test database:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await db.sequelize.close();
    console.log('Test database connection closed.');
  } catch (error) {
    console.error('Error closing test database connection:', error);
  }
});

// Clean data before each test to ensure isolation
beforeEach(async () => {
  try {
    // PostgreSQL approach to truncate all tables
    const queryInterface = db.sequelize.getQueryInterface();
    
    // Get all table names
    const tables = await queryInterface.showAllTables();
    
    if (tables.length > 0) {
      // Disable foreign key checks temporarily (PostgreSQL)
      await db.sequelize.query('SET session_replication_role = replica;', { raw: true });
      
      // Truncate all tables and restart identity sequences
      for (const tableName of tables) {
        // Skip SequelizeMeta table if exists
        if (tableName !== 'SequelizeMeta') {
          await db.sequelize.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`, { raw: true });
        }
      }
      
      // Re-enable foreign key checks
      await db.sequelize.query('SET session_replication_role = DEFAULT;', { raw: true });
    }
  } catch (error) {
    console.error('Error cleaning test data:', error);
    throw error;
  }
}); 