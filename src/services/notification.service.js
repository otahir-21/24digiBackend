/**
 * OTP delivery: SMS (SMSCountry) and Email (AWS SES).
 * When SMS_ENABLED/EMAIL_ENABLED are false or providers are not configured, OTP is only logged (dev).
 */
const env = require('../config/env');
const logger = require('../utils/logger');

const SMSC_BULK_URL = 'https://api.smscountry.com/SMSCwebservice_bulk.aspx';

/**
 * Send OTP via SMS (SMSCountry bulk API).
 * Phone must be E.164-like; we strip to digits for the API.
 */
async function sendSms(phoneNumber, otp) {
  const user = env.sms.smsc.apiKey || env.sms.smsc.authKey;
  if (!env.sms.enabled || !user || !env.sms.smsc.apiSecret) {
    const reason = !env.sms.enabled
      ? 'SMS_ENABLED is not true'
      : !user
        ? 'SMSC_API_KEY / SMSC_AUTH_KEY not set'
        : 'SMSC_API_SECRET not set';
    logger.warn('SMS OTP skipped:', reason);
    return { sent: false, reason };
  }
  const mobile = String(phoneNumber).replace(/\D/g, '');
  const message = `Your 24Digi verification code is: ${otp}. Valid for 5 minutes.`;
  const params = new URLSearchParams({
    User: user,
    passwd: env.sms.smsc.apiSecret,
    mobilenumber: mobile,
    message,
    sid: env.sms.smsc.senderId || '24DIGI',
    mtype: 'N',
    DR: 'Y',
  });
  try {
    const res = await fetch(`${SMSC_BULK_URL}?${params.toString()}`);
    const text = await res.text();
    if (text.startsWith('OK:')) {
      logger.info('SMS OTP sent to', mobile);
      return { sent: true };
    }
    logger.warn('SMS send failed', text);
    return { sent: false, reason: text };
  } catch (err) {
    logger.error('SMS send error', err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Send OTP via email (AWS SES).
 * Uses @aws-sdk/client-ses if available; otherwise logs and returns not sent.
 */
async function sendEmail(toEmail, otp) {
  if (!env.email.enabled || !env.email.ses.fromEmail) {
    const reason = !env.email.enabled
      ? 'EMAIL_ENABLED is not true'
      : 'AWS_SES_FROM_EMAIL not set';
    logger.warn('Email OTP skipped:', reason);
    return { sent: false, reason };
  }
  try {
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
    const client = new SESClient({ region: env.email.ses.region });
    const cmd = new SendEmailCommand({
      Source: `${env.email.ses.fromName || '24Digi'} <${env.email.ses.fromEmail}>`,
      Destination: { ToAddresses: [toEmail] },
      Message: {
        Subject: { Data: 'Your 24Digi verification code' },
        Body: {
          Text: {
            Data: `Your 24Digi verification code is: ${otp}. It is valid for 5 minutes.`,
          },
        },
      },
    });
    await client.send(cmd);
    logger.info('Email OTP sent to', toEmail);
    return { sent: true };
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      logger.warn('@aws-sdk/client-ses not installed; OTP email skipped');
      return { sent: false, reason: 'SES SDK not installed' };
    }
    logger.error('Email send error', err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Send OTP to the given destination (phone or email).
 * - loginMethod 'phone' -> sendSms(phoneNumber, otp)
 * - loginMethod 'email' -> sendEmail(email, otp)
 * If actual send is disabled or fails, we still return (caller logs to console in dev).
 */
async function sendOtp(loginMethod, destination, otp) {
  if (loginMethod === 'phone') {
    return sendSms(destination, otp);
  }
  if (loginMethod === 'email') {
    return sendEmail(destination, otp);
  }
  return { sent: false, reason: 'Unknown login method' };
}

module.exports = {
  sendOtp,
  sendSms,
  sendEmail,
};
