const {
  models: { Overtime, User, AttendancePeriod, Attendance }
} = require('../db/models');

async function createOvertime(overtimeData) {
  // Check if user has attendance for the overtime date
  const attendanceRecord = await Attendance.findOne({
    where: {
      employee_id: overtimeData.userId,
      attendance_period_id: overtimeData.attendancePeriodId,
      date: overtimeData.overtimeDate
    }
  });

  if (!attendanceRecord) {
    throw new Error('You must have attendance record for this date before submitting overtime');
  }

  // Check if user already has overtime for this date
  const existingOvertime = await Overtime.findOne({
    where: {
      user_id: overtimeData.userId,
      attendance_period_id: overtimeData.attendancePeriodId,
      overtime_date: overtimeData.overtimeDate
    }
  });

  if (existingOvertime) {
    throw new Error('Overtime record already exists for this date');
  }

  return Overtime.create({
    user_id: overtimeData.userId,
    attendance_period_id: overtimeData.attendancePeriodId,
    overtime_date: overtimeData.overtimeDate,
    hours: overtimeData.hours,
    created_by: overtimeData.createdBy,
    updated_by: overtimeData.updatedBy
  });
}

module.exports = {
  createOvertime
}; 