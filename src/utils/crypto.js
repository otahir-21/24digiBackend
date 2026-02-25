const crypto = require('crypto');

const OTP_SALT = process.env.OTP_SALT || '24digi-otp-salt';

/**
 * Hash OTP with salt (SHA-256) for storage.
 * @param {string} otp - Plain 6-digit OTP
 * @returns {string} Hex hash
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp + OTP_SALT).digest('hex');
}

/**
 * Verify OTP against stored hash.
 * @param {string} otp - Plain OTP from user
 * @param {string} otpHash - Stored hash
 * @returns {boolean}
 */
function verifyOtp(otp, otpHash) {
  return crypto.timingSafeEqual(
    Buffer.from(hashOtp(otp), 'hex'),
    Buffer.from(otpHash, 'hex')
  );
}

/**
 * Hash refresh token for DB storage.
 * @param {string} token - Raw token
 * @returns {string} Hex hash
 */
function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate random 6-digit OTP.
 * @returns {string}
 */
function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

module.exports = {
  hashOtp,
  verifyOtp,
  hashRefreshToken,
  generateOtp,
};
