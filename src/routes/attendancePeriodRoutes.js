const express = require('express');
const router = express.Router();
const attendancePeriodController = require('../controllers/attendancePeriodController');
const verifyTokenMiddleware = require('../middlewares/verifyToken');
const requireAdmin = require('../middlewares/requireAdmin');

router.post('/', verifyTokenMiddleware, requireAdmin, attendancePeriodController.adminCreateAttendancePeriod);

module.exports = router;