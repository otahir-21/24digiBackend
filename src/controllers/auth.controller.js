const authService = require('../services/auth.service');
const { success } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');

async function loginStart(req, res) {
  const data = await authService.loginStart(req.body);
  return success(res, data, 200);
}

async function verifyOtp(req, res) {
  const data = await authService.verifyOtpAndLogin(req.body);
  return success(res, data, 200);
}

async function verifyFirebase(req, res) {
  const data = await authService.verifyFirebaseAndLogin(req.body);
  return success(res, data, 200);
}

async function resendOtp(req, res) {
  const data = await authService.resendOtp(req.body);
  return success(res, data, 200);
}

async function refresh(req, res) {
  const data = await authService.refreshTokens(req.body);
  return success(res, data, 200);
}

async function logout(req, res) {
  const data = await authService.logout(req.body);
  return success(res, data, 200);
}

module.exports = {
  loginStart: asyncHandler(loginStart),
  verifyOtp: asyncHandler(verifyOtp),
  verifyFirebase: asyncHandler(verifyFirebase),
  resendOtp: asyncHandler(resendOtp),
  refresh: asyncHandler(refresh),
  logout: asyncHandler(logout),
};
