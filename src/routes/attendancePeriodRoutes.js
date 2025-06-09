const express = require('express');
const router = express.Router();
const attendancePeriodController = require('../controllers/attendancePeriodController');
const verifyTokenMiddleware = require('../middlewares/verifyToken');

router.post('/', verifyTokenMiddleware, attendancePeriodController.adminCreateAttendancePeriod);

module.exports = router;