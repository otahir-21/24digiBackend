/**
 * Firebase Admin SDK – used to verify Firebase ID tokens (e.g. from Phone Auth).
 * Initialize with service account from env; verify-firebase endpoint uses this.
 */
const admin = require('firebase-admin');
const env = require('./env');
const logger = require('../utils/logger');

let initialized = false;

function getCredential() {
  if (env.firebase.serviceAccountPath) {
    return admin.credential.applicationDefault();
  }
  const jsonEnv = env.firebase.serviceAccountJson || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    try {
      const obj = typeof jsonEnv === 'string' ? JSON.parse(jsonEnv) : jsonEnv;
      return admin.credential.cert(obj);
    } catch (e) {
      logger.error('Firebase: invalid FIREBASE_SERVICE_ACCOUNT_JSON', e.message);
      return null;
    }
  }
  return null;
}

function initFirebase() {
  if (initialized) return true;
  const credential = getCredential();
  if (!credential) {
    logger.warn('Firebase: no credentials (GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON). Phone verify-firebase will be disabled.');
    return false;
  }
  try {
    admin.initializeApp({ credential });
    initialized = true;
    logger.info('Firebase Admin initialized');
    return true;
  } catch (e) {
    logger.error('Firebase init error', e.message);
    return false;
  }
}

async function verifyIdToken(idToken) {
  if (!initFirebase()) {
    throw new Error('Firebase not configured');
  }
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded;
}

module.exports = {
  initFirebase,
  verifyIdToken,
  get admin() {
    return initialized ? admin : null;
  },
};
