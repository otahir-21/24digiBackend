const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter (e.g. 100 req/15min per IP).
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, data: null, error: { message: 'Too many requests', code: 'TOO_MANY_REQUESTS' } },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter limiter for OTP endpoints (login/start, resend, verify).
 * Fewer requests per window to prevent abuse.
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, data: null, error: { message: 'Too many OTP attempts', code: 'TOO_MANY_REQUESTS' } },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, otpLimiter };
