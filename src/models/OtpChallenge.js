const mongoose = require('mongoose');
const { LOGIN_METHODS, PLATFORMS } = require('../utils/enums');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, trim: true },
    platform: { type: String, enum: PLATFORMS },
    appVersion: { type: String, trim: true },
    pushToken: { type: String, trim: true },
  },
  { _id: false }
);

const otpChallengeSchema = new mongoose.Schema(
  {
    challengeId: { type: String, required: true, unique: true },
    loginMethod: { type: String, enum: LOGIN_METHODS, required: true },
    phoneNumber: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    resendAvailableAt: { type: Date, required: true },
    verifiedAt: { type: Date, default: null },
    device: { type: deviceSchema },
    language: { type: String, trim: true, default: 'en' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OtpChallenge', otpChallengeSchema);
