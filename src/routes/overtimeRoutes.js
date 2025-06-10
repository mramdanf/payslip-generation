const express = require('express');
const router = express.Router();

const overtimeController = require('../controllers/overtimeController');

const verifyTokenMiddleware = require('../middlewares/verifyToken');

router.post('/', verifyTokenMiddleware, overtimeController.createOvertime);

module.exports = router; 