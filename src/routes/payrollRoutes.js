const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

const verifyTokenMiddleware = require('../middlewares/verifyToken');

// POST /payrolls/run - Run payroll for a specific attendance period
router.post('/run', verifyTokenMiddleware, payrollController.runPayroll);

// GET /payrolls/payslip/:periodId - Get employee payslip for a specific attendance period
router.get('/payslip/:periodId', verifyTokenMiddleware, payrollController.getEmployeePayslip);

// GET /payrolls/summary/:periodId - Get summary of all employee payslips for an attendance period (admin only)
router.get('/summary/:periodId', verifyTokenMiddleware, payrollController.getPayslipSummary);

module.exports = router; 