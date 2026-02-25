const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { error } = require('../utils/response');

/**
 * Verify JWT access token and attach req.user = { userId }.
 * Expects: Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Missing or invalid Authorization header', 401, 'UNAUTHORIZED');
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    req.user = { userId: decoded.userId || decoded.sub };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired', 401, 'TOKEN_EXPIRED');
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Invalid token', 401, 'INVALID_TOKEN');
    }
    next(err);
  }
}

module.exports = { authMiddleware };
