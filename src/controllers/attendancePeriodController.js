async function adminCreateAttendancePeriod(req, res) {
  try {
    const userId = req._id;
    const { name, startDate, endDate } = req.body;
  } catch (error) {
    return res.status(500).json(endpointErrorResponse(error.toString()));
  }
}