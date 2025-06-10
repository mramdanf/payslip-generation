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

// GET /payroll/payslip/:periodId - Get employee payslip for a specific attendance period
router.get('/payslip/:periodId', verifyTokenMiddleware, payrollController.getEmployeePayslip);

// GET /payroll/summary/:periodId - Get summary of all employee payslips for an attendance period (admin only)
router.get('/summary/:periodId', verifyTokenMiddleware, payrollController.getPayslipSummary);

module.exports = router; 