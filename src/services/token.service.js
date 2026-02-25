const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const RefreshToken = require('../models/RefreshToken');
const { hashRefreshToken } = require('../utils/crypto');
const { UnauthorizedError } = require('../utils/errors');

function getAccessExpiresMs() {
  const s = env.jwt.accessExpires;
  if (s.endsWith('m')) return parseInt(s, 10) * 60 * 1000;
  if (s.endsWith('d')) return parseInt(s, 10) * 24 * 60 * 60 * 1000;
  if (s.endsWith('h')) return parseInt(s, 10) * 60 * 60 * 1000;
  return 15 * 60 * 1000;
}

function getRefreshExpiresMs() {
  const s = env.jwt.refreshExpires;
  if (s.endsWith('d')) return parseInt(s, 10) * 24 * 60 * 60 * 1000;
  if (s.endsWith('h')) return parseInt(s, 10) * 60 * 60 * 1000;
  if (s.endsWith('m')) return parseInt(s, 10) * 60 * 1000;
  return 30 * 24 * 60 * 60 * 1000;
}

function signAccessToken(userId) {
  return jwt.sign(
    { userId, sub: userId },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires }
  );
}

function signRefreshToken() {
  const token = uuidv4() + '.' + uuidv4();
  const expiresAt = new Date(Date.now() + getRefreshExpiresMs());
  return { token, expiresAt };
}

async function createRefreshTokenRecord(userId, token, deviceId) {
  const { expiresAt } = signRefreshToken();
  const tokenHash = hashRefreshToken(token);
  await RefreshToken.create({
    userId,
    tokenHash,
    deviceId: deviceId || null,
    expiresAt,
  });
  return expiresAt;
}

async function issueTokenPair(userId, deviceId = null) {
  const accessToken = signAccessToken(userId.toString());
  const { token: rawRefresh, expiresAt } = signRefreshToken();
  const tokenHash = hashRefreshToken(rawRefresh);
  await RefreshToken.create({
    userId,
    tokenHash,
    deviceId: deviceId || null,
    expiresAt,
  });
  return {
    accessToken,
    refreshToken: rawRefresh,
    accessExpiresMs: getAccessExpiresMs(),
    refreshExpiresAt: expiresAt,
  };
}

async function refreshAccessToken(refreshTokenRaw) {
  const tokenHash = hashRefreshToken(refreshTokenRaw);
  const record = await RefreshToken.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).exec();
  if (!record) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
  const userId = record.userId;
  await revokeRefreshToken(refreshTokenRaw);
  return issueTokenPair(userId, record.deviceId);
}

async function revokeRefreshToken(refreshTokenRaw) {
  const tokenHash = hashRefreshToken(refreshTokenRaw);
  await RefreshToken.updateOne(
    { tokenHash },
    { $set: { revokedAt: new Date() } }
  ).exec();
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  createRefreshTokenRecord,
  issueTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
  getAccessExpiresMs,
  getRefreshExpiresMs,
};
