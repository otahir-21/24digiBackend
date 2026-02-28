const { v4: uuidv4 } = require('uuid');
const OtpChallenge = require('../models/OtpChallenge');
const env = require('../config/env');
const { generateOtp, hashOtp, verifyOtp } = require('../utils/crypto');
const { maskPhone, maskEmail } = require('../utils/mask');
const notificationService = require('./notification.service');
const {
  UnauthorizedError,
  ValidationError,
  TooManyRequestsError,
} = require('../utils/errors');

const OTP_EXPIRES_MS = env.otp.expiresSec * 1000;
const RESEND_COOLDOWN_MS = env.otp.resendCooldownSec * 1000;

function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/\s/g, '').trim();
}

function normalizeEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim();
}

/**
 * Create OTP challenge and return challengeId, masked destination, expiresInSec.
 * In production you would send OTP via SMS/email here (stub for now).
 */
async function startChallenge(payload) {
  const { login_method, phone_number, email, language, device } = payload;
  const phone = login_method === 'phone' ? normalizePhone(phone_number) : null;
  const emailNorm = login_method === 'email' ? normalizeEmail(email) : null;
  if (login_method === 'phone' && !phone) {
    throw new ValidationError('phone_number is required for phone login');
  }
  if (login_method === 'email' && !emailNorm) {
    throw new ValidationError('email is required for email login');
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRES_MS);
  const resendAvailableAt = new Date(now.getTime() + RESEND_COOLDOWN_MS);
  const challengeId = uuidv4();

  const deviceDoc = device
    ? {
        deviceId: device.device_id,
        platform: device.platform,
        appVersion: device.app_version,
        pushToken: device.push_token,
      }
    : undefined;

  await OtpChallenge.create({
    challengeId,
    loginMethod: login_method,
    phoneNumber: phone,
    email: emailNorm,
    otpHash,
    expiresAt,
    resendAvailableAt,
    device: deviceDoc,
    language: language || 'en',
  });

  const destination = phone || emailNorm;
  const sent = await notificationService.sendOtp(login_method, destination, otp);
  if (!sent.sent && env.nodeEnv === 'development') {
    console.log('[DEV] OTP for', destination, ':', otp, sent.reason ? `(send failed: ${sent.reason})` : '');
  }

  const otpSentToDisplay =
    login_method === 'phone' ? maskPhone(phone) : maskEmail(emailNorm);

  return {
    challenge_id: challengeId,
    otp_sent_to: otpSentToDisplay,
    expires_in_sec: env.otp.expiresSec,
  };
}

/**
 * Verify OTP for challenge. Returns challenge doc with phoneNumber/email for auth.
 * Throws on invalid/expired/max attempts.
 */
async function verifyChallenge(challengeId, otpCode) {
  const challenge = await OtpChallenge.findOne({ challengeId }).exec();
  if (!challenge) {
    throw new UnauthorizedError('Invalid or expired challenge');
  }
  if (challenge.verifiedAt) {
    throw new UnauthorizedError('Challenge already used');
  }
  if (new Date() > challenge.expiresAt) {
    throw new UnauthorizedError('OTP expired');
  }
  if (challenge.attempts >= env.otp.maxAttempts) {
    throw new UnauthorizedError('Max OTP attempts exceeded');
  }

  const valid = verifyOtp(otpCode, challenge.otpHash);
  await OtpChallenge.updateOne(
    { challengeId },
    { $inc: { attempts: 1 }, ...(valid ? { $set: { verifiedAt: new Date() } } : {}) }
  ).exec();

  if (!valid) {
    throw new UnauthorizedError('Invalid OTP');
  }

  return challenge;
}

/**
 * Resend OTP for challenge. Only if resendAvailableAt <= now and resendCount < max.
 */
async function resendOtp(challengeId) {
  const challenge = await OtpChallenge.findOne({ challengeId }).exec();
  if (!challenge) {
    throw new UnauthorizedError('Invalid or expired challenge');
  }
  if (challenge.verifiedAt) {
    throw new UnauthorizedError('Challenge already used');
  }
  const now = new Date();
  if (now < challenge.resendAvailableAt) {
    throw new TooManyRequestsError(
      `Resend available in ${Math.ceil((challenge.resendAvailableAt - now) / 1000)}s`
    );
  }
  if (challenge.resendCount >= env.otp.maxResends) {
    throw new TooManyRequestsError('Max resends exceeded');
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRES_MS);
  const resendAvailableAt = new Date(now.getTime() + RESEND_COOLDOWN_MS);

  await OtpChallenge.updateOne(
    { challengeId },
    {
      $set: { otpHash, expiresAt, resendAvailableAt },
      $inc: { resendCount: 1 },
    }
  ).exec();

  const destination = challenge.phoneNumber || challenge.email;
  const sent = await notificationService.sendOtp(challenge.loginMethod, destination, otp);
  if (!sent.sent && env.nodeEnv === 'development') {
    console.log('[DEV] Resend OTP for', destination, ':', otp, sent.reason ? `(send failed: ${sent.reason})` : '');
  }

  return { expires_in_sec: env.otp.expiresSec };
}

module.exports = {
  startChallenge,
  verifyChallenge,
  resendOtp,
};
