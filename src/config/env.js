require('dotenv').config();

const accessExpiryDays = parseInt(process.env.ACCESS_TOKEN_EXPIRY_DAYS || '7', 10);
const defaultAccessExpires = Number.isNaN(accessExpiryDays) ? '15m' : `${accessExpiryDays}d`;

const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/24digi',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'default-access-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-refresh-secret-change-in-production',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || defaultAccessExpires,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  },
  otp: {
    expiresSec: parseInt(process.env.OTP_EXPIRES_SEC || '300', 10),
    resendCooldownSec: parseInt(process.env.OTP_RESEND_COOLDOWN_SEC || '30', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    maxResends: parseInt(process.env.OTP_MAX_RESENDS || '5', 10),
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
  sms: {
    enabled: process.env.SMS_ENABLED === 'true',
    provider: process.env.SMS_PROVIDER || 'SMSC',
    smsc: {
      authKey: process.env.SMSC_AUTH_KEY,
      apiKey: process.env.SMSC_API_KEY,
      apiSecret: process.env.SMSC_API_SECRET,
      senderId: process.env.SMSC_SENDER_ID || '24DIGI',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_PHONE_NUMBER,
    },
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    provider: process.env.EMAIL_PROVIDER || 'SES',
    ses: {
      region: process.env.AWS_SES_REGION || process.env.AWS_S3_REGION || 'me-central-1',
      fromEmail: process.env.AWS_SES_FROM_EMAIL || 'noreply@24digi.ae',
      fromName: process.env.AWS_SES_FROM_NAME || '24Digi',
    },
  },
};

module.exports = env;
