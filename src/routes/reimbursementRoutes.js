const express = require('express');
const router = express.Router();

const reimbursementController = require('../controllers/reimbursementController');

const verifyTokenMiddleware = require('../middlewares/verifyToken');

router.post('/', verifyTokenMiddleware, reimbursementController.createReimbursement);

module.exports = router; 