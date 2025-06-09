const {
  models: { AttendancePeriod }
} = require('../db/models');

function createAttendancePeriod(attendancePeriod) {
  return AttendancePeriod.create(attendancePeriod);
}

module.exports = {
  createAttendancePeriod
};