const {
  models: { AttendancePeriod }
} = require('../db/models');

function createAttendancePeriod(attendancePeriod) {
  return AttendancePeriod.create(attendancePeriod);
}

function findAttendancePeriodById(id) {
  return AttendancePeriod.findByPk(id);
}

module.exports = {
  createAttendancePeriod,
  findAttendancePeriodById
};