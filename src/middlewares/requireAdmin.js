const { findById } = require('../services/userService');
const { endpointErrorResponse } = require('../utils/apiResponse');

async function requireAdmin(req, res, next) {
  try {
    // Ensure req.id is available (should come from verifyToken middleware)
    if (!req.id) {
      return res.status(401).json(endpointErrorResponse('Authentication required'));
    }

    // Get user information
    const user = await findById(req.id);
    if (!user) {
      return res.status(401).json(endpointErrorResponse('User not found'));
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json(endpointErrorResponse('Admin access required'));
    }

    // Attach user to request for controllers to use
    req.user = user;
    return next();
  } catch (error) {
    console.error('Admin validation error:', error);
    return res.status(500).json(endpointErrorResponse('Internal server error'));
  }
}

module.exports = requireAdmin; 