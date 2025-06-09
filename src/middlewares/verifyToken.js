require('dotenv').config();
const jwt = require('jsonwebtoken');
const { findById } = require('../services/userService');
const { endpointErrorResponse } = require('../utils/apiResponse');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, errorMessage: 'Invalid authorization header' });
  }
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: true, errorMessage: 'Token is required' });
  }

  try {
    const decoded = await jwt.verify(
      token,
      `${process.env.JWT_SECRET}`
    );
    req.id = decoded.id;

    const user = await findById(req.id);
    if (!user) {
      return res.status(401).json(endpointErrorResponse('Invalid token'));
    }

    return next();
  } catch (error) {
    return res.status(401).json({ error: true, errorMessage: 'Invalid token' });
  }
}

module.exports = verifyToken;
