const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

const verifyTokenMiddleware = require('../middlewares/verifyToken');

// POST /payroll/run - Run payroll for a specific attendance period
router.post('/run', verifyTokenMiddleware, payrollController.runPayroll);

// GET /payroll/:id - Get payroll details
router.get('/:id', verifyTokenMiddleware, payrollController.getPayrollById);

// GET /payroll/period/:periodId - Get payroll by attendance period
router.get('/period/:periodId', verifyTokenMiddleware, payrollController.getPayrollByPeriod);

module.exports = router; 