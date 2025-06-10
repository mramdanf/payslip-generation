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

// Get payroll details by ID
const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findByPk(id, {
      include: [
        {
          model: AttendancePeriod,
          as: 'attendancePeriod'
        }
      ]
    });

    if (!payroll) {
      return res.status(404).json({
        error: 'Payroll not found'
      });
    }

    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch payroll'
    });
  }
};

// Get payroll by attendance period ID
const getPayrollByPeriod = async (req, res) => {
  try {
    const { periodId } = req.params;

    const payroll = await Payroll.findOne({
      where: { attendancePeriodId: periodId },
      include: [
        {
          model: AttendancePeriod,
          as: 'attendancePeriod'
        }
      ]
    });

    if (!payroll) {
      return res.status(404).json({
        error: 'Payroll not found for this attendance period'
      });
    }

    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    console.error('Error fetching payroll by period:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch payroll'
    });
  }
};

module.exports = {
  runPayroll,
  getPayrollById,
  getPayrollByPeriod
}; 