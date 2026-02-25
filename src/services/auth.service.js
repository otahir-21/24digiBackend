const User = require('../models/User');
const otpService = require('./otp.service');
const tokenService = require('./token.service');

async function loginStart(body) {
  return otpService.startChallenge(body);
}

async function verifyOtpAndLogin(body) {
  const { challenge_id, otp_code, device } = body;
  const challenge = await otpService.verifyChallenge(challenge_id, otp_code);

  let user = await User.findOne({
    ...(challenge.loginMethod === 'phone'
      ? { phoneNumber: challenge.phoneNumber }
      : { email: challenge.email }),
  }).exec();

  if (!user) {
    user = await User.create({
      loginMethod: challenge.loginMethod,
      phoneNumber: challenge.phoneNumber || undefined,
      email: challenge.email || undefined,
    });
  }

  const deviceId = device?.device_id || null;
  const tokens = await tokenService.issueTokenPair(user._id, deviceId);

  return {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    user: {
      user_id: user._id.toString(),
      is_profile_complete: user.isProfileComplete === true,
    },
  };
}

async function resendOtp(body) {
  return otpService.resendOtp(body.challenge_id);
}

async function refreshTokens(body) {
  const { refresh_token } = body;
  const tokens = await tokenService.refreshAccessToken(refresh_token);
  return {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  };
}

async function logout(body) {
  const { refresh_token } = body;
  await tokenService.revokeRefreshToken(refresh_token);
  return { success: true };
}

module.exports = {
  loginStart,
  verifyOtpAndLogin,
  resendOtp,
  refreshTokens,
  logout,
};
