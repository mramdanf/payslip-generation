const overtimeService = require('../services/overtimeService');
const {
  endpointSuccessResponse,
  endpointErrorResponse
} = require('../utils/apiResponse');

async function createOvertime(req, res) {
  try {
    const userId = req.id;
    const { attendancePeriodId, overtimeDate, hours } = req.body;

    // Validate required fields
    if (!attendancePeriodId || !overtimeDate || !hours) {
      return res.status(400).json(
        endpointErrorResponse('Missing required fields: attendancePeriodId, overtimeDate, and hours are required')
      );
    }

    // Validate hours (should be between 0.01 and 3.00)
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 3) {
      return res.status(400).json(
        endpointErrorResponse('Hours must be a number between 0.01 and 3.00')
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(overtimeDate)) {
      return res.status(400).json(
        endpointErrorResponse('Invalid date format. Use YYYY-MM-DD')
      );
    }

    const overtime = await overtimeService.createOvertime({
      userId,
      attendancePeriodId,
      overtimeDate,
      hours: hoursNum,
      createdBy: userId,
      updatedBy: userId
    });

    res.status(201).json(endpointSuccessResponse({ 
      overtime: {
        ...overtime.toJSON(),
        hours: parseFloat(overtime.hours)
      },
      message: 'Overtime submitted successfully'
    }));
  } catch (error) {
    // Handle Sequelize unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json(
        endpointErrorResponse('Overtime record already exists for this date')
      );
    }
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return res.status(400).json(
        endpointErrorResponse(`Validation failed: ${validationErrors}`)
      );
    }
    
    // Handle custom business logic errors
    if (error.message.includes('attendance record') || 
        error.message.includes('already exists') ||
        error.message.includes('locked')) {
      return res.status(400).json(
        endpointErrorResponse(error.message)
      );
    }
    
    // Handle general errors
    console.error('Error creating overtime:', error);
    return res.status(500).json(endpointErrorResponse(error.toString()));
  }
}

module.exports = {
  createOvertime
}; 