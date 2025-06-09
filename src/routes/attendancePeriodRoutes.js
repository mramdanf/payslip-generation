const express = require('express');
const router = express.Router();
const attendancePeriodController = require('../controllers/attendancePeriodController');

router.post('/', attendancePeriodController.adminCreateAttendancePeriod);

module.exports = router;