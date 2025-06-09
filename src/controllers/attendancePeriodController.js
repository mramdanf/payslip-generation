const attendancePeriodService = require('../services/attendancePeriodService');
const {
  endpointSuccessResponse,
  endpointErrorResponse
} = require('../utils/apiResponse');

async function adminCreateAttendancePeriod(req, res) {
  try {
    const userId = req.id;
    const { name, startDate, endDate } = req.body;
    const attendancePeriod = await attendancePeriodService.createAttendancePeriod({
      name,
      startDate,
      endDate,
      createdBy: userId,
      updatedBy: userId
    });
    res.status(200).json(endpointSuccessResponse({ attendancePeriod }));
  } catch (error) {
    return res.status(500).json(endpointErrorResponse(error.toString()));
  }
}

module.exports = {
  adminCreateAttendancePeriod
};