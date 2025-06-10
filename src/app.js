require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const userRouter = require('./routes/userRoutes');
const attendancePeriodRouter = require('./routes/attendancePeriodRoutes');
const attendanceRouter = require('./routes/attendanceRoutes');
const overtimeRouter = require('./routes/overtimeRoutes');
const reimbursementRouter = require('./routes/reimbursementRoutes');

const app = express();
const PORT = process.env.PORT || 3000;


// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/users', userRouter);
app.use('/attendance-periods', attendancePeriodRouter);
app.use('/attendances', attendanceRouter);
app.use('/overtimes', overtimeRouter);
app.use('/reimbursements', reimbursementRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Payslip Generation API'
  });
});

// Database connection test endpoint
app.get('/db-test', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.json({ 
      status: 'Database connection successful',
      database: db.sequelize.config.database,
      host: db.sequelize.config.host
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Database connection failed',
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`DB test: http://localhost:${PORT}/db-test`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
