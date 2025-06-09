const {
  models: { Attendance }
} = require('../db/models');

function createAttendance(attendance) {
  return Attendance.create(attendance);
}

module.exports = {
  createAttendance
};