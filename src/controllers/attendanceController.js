const attendanceService = require('../services/attendanceService');
const {
  endpointSuccessResponse,
  endpointErrorResponse
} = require('../utils/apiResponse');

async function createAttendance(req, res) {
  try {
    const userId = req.id;
    const { attendancePeriodId, date, checkIn, checkOut } = req.body;
    const attendance = await attendanceService.createAttendance({
      employeeId: userId,
      attendancePeriodId,
      date,
      checkIn,
      checkOut,
      createdBy: userId,
      updatedBy: userId
    });
    res.status(200).json(endpointSuccessResponse({ attendance }));
  } catch (error) {
    // Handle Sequelize unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      const constraint = error.original.constraint;
      if (constraint === 'unique_employee_period_date') {
        return res.status(409).json(
          endpointErrorResponse('Attendance record already exists for this employee on this date within the specified period.')
        );
      }
      // Handle other unique constraint violations
      return res.status(409).json(
        endpointErrorResponse('A record with the same information already exists.')
      );
    }
    
    // Handle other Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return res.status(400).json(
        endpointErrorResponse(`Validation failed: ${validationErrors}`)
      );
    }
    
    // Handle general errors
    return res.status(500).json(endpointErrorResponse(error.toString()));
  }
}

module.exports = {
  createAttendance
};