const app = require('./app');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  const db = require('./db');
  
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`DB test: http://localhost:${PORT}/db-test`);
    });
    
    return server;
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer(); 