const { error } = require('../utils/response');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Async handler wrapper to catch promise rejections and pass to error middleware.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handling middleware.
 * Standardizes error response: { success: false, data: null, error: { message, code, details? } }
 */
function errorMiddleware(err, _req, res, _next) {
  if (err instanceof AppError) {
    return error(res, err.message, err.statusCode, err.code, err.details);
  }
  if (err.name === 'ValidationError') {
    // Mongoose validation
    const message = err.message || 'Validation failed';
    const details = err.errors
      ? Object.entries(err.errors).map(([k, v]) => ({ path: k, message: v.message }))
      : null;
    return error(res, message, 400, 'VALIDATION_ERROR', details);
  }
  logger.error('Unhandled error:', err);
  return error(res, 'Internal server error', 500, 'INTERNAL_ERROR');
}

module.exports = { asyncHandler, errorMiddleware };
