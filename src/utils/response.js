/**
 * Standard API success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {number} statusCode
 */
function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data: data ?? null,
    error: null,
  });
}

/**
 * Standard API error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 * @param {string} code
 * @param {*} details
 */
function error(res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
      code,
      ...(details != null && { details }),
    },
  });
}

module.exports = { success, error };
