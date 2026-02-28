/**
 * OTP delivery: SMS (SMSCountry) and Email (AWS SES).
 * When SMS_ENABLED/EMAIL_ENABLED are false or providers are not configured, OTP is only logged (dev).
 */
const env = require('../config/env');
const logger = require('../utils/logger');

const SMSC_BULK_URL = 'https://api.smscountry.com/SMSCwebservice_bulk.aspx';

/**
 * SMSCountry bulk API: User and Passwd are max 17 and 20 chars (alphanumeric).
 * If your API secret is longer, set SMSC_PASSWORD in env to the actual account password (20 chars).
 */
function getSmscPassword() {
  const fromEnv = env.sms.smsc.password || process.env.SMSC_PASSWORD;
  if (fromEnv) return String(fromEnv).trim();
  const secret = env.sms.smsc.apiSecret || '';
  return secret.length > 20 ? secret.slice(0, 20) : secret;
}

/**
 * Send OTP via SMS (SMSCountry bulk API).
 * Phone must be E.164-like; we strip to digits for the API.
 */
async function sendSms(phoneNumber, otp) {
  const user = (env.sms.smsc.apiKey || env.sms.smsc.authKey || '').trim();
  const passwd = getSmscPassword();
  if (!env.sms.enabled || !user || !passwd) {
    const reason = !env.sms.enabled
      ? 'SMS_ENABLED is not true'
      : !user
        ? 'SMSC_API_KEY / SMSC_AUTH_KEY not set'
        : 'SMSC_API_SECRET / SMSC_PASSWORD not set';
    logger.warn('SMS OTP skipped:', reason);
    return { sent: false, reason };
  }
  const mobile = String(phoneNumber).replace(/\D/g, '');
  if (mobile.length < 10) {
    logger.warn('SMS OTP skipped: mobile number too short', mobile);
    return { sent: false, reason: 'Invalid mobile number' };
  }
  const message = `Your 24Digi code is ${otp}. Valid for 5 min.`;
  const params = new URLSearchParams({
    User: user,
    passwd,
    mobilenumber: mobile,
    message,
    sid: (env.sms.smsc.senderId || '24DIGI').trim(),
    mtype: 'N',
    DR: 'Y',
  });
  const url = `${SMSC_BULK_URL}?${params.toString()}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    const text = (await res.text()).trim();
    if (text.startsWith('OK:')) {
      logger.info('SMS OTP sent to', mobile);
      return { sent: true };
    }
    logger.warn('SMS send failed', { status: res.status, response: text, mobile });
    return { sent: false, reason: text };
  } catch (err) {
    logger.error('SMS send error', { message: err.message, mobile });
    return { sent: false, reason: err.message };
  }
}

/**
 * Send OTP via email (AWS SES).
 * Uses explicit AWS credentials from env when set (recommended on EB).
 */
async function sendEmail(toEmail, otp) {
  if (!env.email.enabled || !env.email.ses.fromEmail) {
    const reason = !env.email.enabled
      ? 'EMAIL_ENABLED is not true'
      : 'AWS_SES_FROM_EMAIL not set';
    logger.warn('Email OTP skipped:', reason);
    return { sent: false, reason };
  }
  const to = String(toEmail).trim().toLowerCase();
  if (!to || !to.includes('@')) {
    logger.warn('Email OTP skipped: invalid email', toEmail);
    return { sent: false, reason: 'Invalid email address' };
  }
  try {
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
    const clientConfig = { region: env.email.ses.region };
    if (env.email.ses.accessKeyId && env.email.ses.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: env.email.ses.accessKeyId,
        secretAccessKey: env.email.ses.secretAccessKey,
      };
    }
    const client = new SESClient(clientConfig);
    const cmd = new SendEmailCommand({
      Source: `${env.email.ses.fromName || '24Digi'} <${env.email.ses.fromEmail}>`,
      Destination: { ToAddresses: [to] },
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
    logger.info('Email OTP sent to', to);
    return { sent: true };
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      logger.warn('@aws-sdk/client-ses not installed; OTP email skipped');
      return { sent: false, reason: 'SES SDK not installed' };
    }
    const code = err.code || err.name;
    const msg = err.message || '';
    const reason = code + ': ' + msg;
    logger.error('Email send error', {
      code,
      message: msg,
      to,
      hint: getSesErrorHint(code, msg),
    });
    return { sent: false, reason };
  }
}

function getSesErrorHint(code, message) {
  if (code === 'MessageRejected' || (message && message.includes('not verified'))) {
    return 'Verify sender (FROM) and recipient (TO) in SES Console → Verified identities. In sandbox you can only send to verified addresses.';
  }
  if (code === 'AccessDenied' || code === 'UnauthorizedException' || (message && message.toLowerCase().includes('access denied'))) {
    return 'IAM user needs ses:SendEmail permission in the same region as AWS_SES_REGION.';
  }
  if (code === 'InvalidParameterValue' || (message && message.includes('Identity'))) {
    return 'FROM email must be verified in SES in region ' + (env.email.ses.region || '') + '.';
  }
  if (code === 'CredentialsError' || code === 'InvalidClientTokenId') {
    return 'Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in env.';
  }
  return null;
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
