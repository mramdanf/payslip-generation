const reimbursementService = require('../services/reimbursementService');
const {
  endpointSuccessResponse,
  endpointErrorResponse
} = require('../utils/apiResponse');

async function createReimbursement(req, res) {
  try {
    const userId = req.id;
    const { attendancePeriodId, amount, description } = req.body;

    // Validate required fields
    if (!attendancePeriodId || !amount || !description) {
      return res.status(400).json(
        endpointErrorResponse('Missing required fields: attendancePeriodId, amount, and description are required')
      );
    }

    // Validate amount (should be greater than 0)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json(
        endpointErrorResponse('Amount must be a number greater than 0')
      );
    }

    // Validate description length
    if (description.trim().length < 10 || description.trim().length > 1000) {
      return res.status(400).json(
        endpointErrorResponse('Description must be between 10 and 1000 characters')
      );
    }

    const reimbursement = await reimbursementService.createReimbursement({
      userId,
      attendancePeriodId,
      amount: amountNum,
      description: description.trim(),
      createdBy: userId,
      updatedBy: userId
    });

    res.status(201).json(endpointSuccessResponse({ 
      reimbursement,
      message: 'Reimbursement submitted successfully'
    }));
  } catch (error) {
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return res.status(400).json(
        endpointErrorResponse(`Validation failed: ${validationErrors}`)
      );
    }
    
    // Handle custom business logic errors
    if (error.message.includes('not found') || 
        error.message.includes('locked')) {
      return res.status(400).json(
        endpointErrorResponse(error.message)
      );
    }
    
    // Handle general errors
    console.error('Error creating reimbursement:', error);
    return res.status(500).json(endpointErrorResponse(error.toString()));
  }
}

module.exports = {
  createReimbursement
}; 