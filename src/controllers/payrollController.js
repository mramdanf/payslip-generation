const PayrollService = require('../services/payrollService');
const db = require('../db');
const { Payroll, AttendancePeriod } = db;

// Run payroll for a specific attendance period
const runPayroll = async (req, res) => {
  try {
    const { attendancePeriodId } = req.body;
    const processedBy = req.id;

    if (!attendancePeriodId) {
      return res.status(400).json({
        error: 'Attendance period ID is required'
      });
    }

    if (!processedBy) {
      return res.status(400).json({
        error: 'processedBy (admin user ID) is required'
      });
    }

    const result = await PayrollService.runPayroll(attendancePeriodId, processedBy);

    res.status(201).json({
      success: true,
      message: 'Payroll processed successfully',
      data: {
        payrollId: result.payroll.id,
        summary: result.summary,
        payslipsGenerated: result.payslips.length
      }
    });
  } catch (error) {
    console.error('Error running payroll:', error);
    
    if (error.message.includes('already been processed')) {
      return res.status(409).json({
        error: error.message
      });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to process payroll'
    });
  }
};

// Get employee payslip for a specific attendance period
const getEmployeePayslip = async (req, res) => {
  try {
    const { periodId } = req.params;
    const employeeId = req.id; // From JWT token

    if (!periodId) {
      return res.status(400).json({
        error: 'Attendance period ID is required'
      });
    }

    const payslip = await PayrollService.getEmployeePayslip(employeeId, periodId);

    if (!payslip) {
      return res.status(404).json({
        error: 'Payslip not found for this attendance period'
      });
    }

    res.json({
      success: true,
      data: payslip
    });
  } catch (error) {
    console.error('Error fetching employee payslip:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message
      });
    }

    if (error.message.includes('not been processed')) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch payslip'
    });
  }
};

// Get summary of all employee payslips for an attendance period (admin only)
const getPayslipSummary = async (req, res) => {
  try {
    const { periodId } = req.params;
    const requestedBy = req.id; // From JWT token

    if (!periodId) {
      return res.status(400).json({
        error: 'Attendance period ID is required'
      });
    }

    const summary = await PayrollService.getPayslipSummary(periodId, requestedBy);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching payslip summary:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: error.message
      });
    }

    if (error.message.includes('not been processed')) {
      return res.status(400).json({
        error: error.message
      });
    }



    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch payslip summary'
    });
  }
};

module.exports = {
  runPayroll,
  getEmployeePayslip,
  getPayslipSummary
}; 