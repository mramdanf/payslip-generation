const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/attendanceController');

const verifyTokenMiddleware = require('../middlewares/verifyToken');

router.post('/', verifyTokenMiddleware, attendanceController.createAttendance);

module.exports = router;