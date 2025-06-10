const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

const verifyTokenMiddleware = require('../middlewares/verifyToken');
const requireAdmin = require('../middlewares/requireAdmin');

// POST /payrolls/run - Run payroll for a specific attendance period (admin only)
router.post('/run', verifyTokenMiddleware, requireAdmin, payrollController.runPayroll);

// GET /payrolls/payslip/:periodId - Get employee payslip for a specific attendance period
router.get('/payslip/:periodId', verifyTokenMiddleware, payrollController.getEmployeePayslip);

// GET /payrolls/summary/:periodId - Get summary of all employee payslips for an attendance period (admin only)
router.get('/summary/:periodId', verifyTokenMiddleware, requireAdmin, payrollController.getPayslipSummary);

module.exports = router; 