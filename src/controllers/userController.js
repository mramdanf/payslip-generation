const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const { bcryptCompare } = require('../utils/encriptions');
const {
  endpointSuccessResponse,
  endpointErrorResponse
} = require('../utils/apiResponse');

async function login(req, res) {
  try {
    const userPayload = req.body;
    const user = await userService.findByUsername(userPayload.username);

    if (!user) {
      res.status(401).json(endpointErrorResponse('Invalid credential'));
      return;
    }

    const validPassword = await bcryptCompare(
      userPayload.password,
      user.password
    );

    if (!validPassword) {
      res.status(401).json(endpointErrorResponse('Invalid credential'));
      return;
    }

    const token = jwt.sign(
      { _id: user._id },
      `${process.env.JWT_SECRET}`,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json(endpointSuccessResponse({ token }));
  } catch (error) {
    return res.status(500).json(endpointErrorResponse(error.toString()));
  }
}

module.exports = {
  login
};