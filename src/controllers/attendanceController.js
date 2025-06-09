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
    return res.status(500).json(endpointErrorResponse(error.toString()));
  }
}

module.exports = {
  createAttendance
};