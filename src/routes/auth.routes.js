const express = require('express');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const {
  loginStartSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshSchema,
  verifyFirebaseSchema,
} = require('../validators/auth.validators');
const { otpLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/login/start', otpLimiter, validate(loginStartSchema), authController.loginStart);
router.post('/login/verify-otp', otpLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/login/verify-firebase', validate(verifyFirebaseSchema), authController.verifyFirebase);
router.post('/login/resend-otp', otpLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/token/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);

module.exports = router;
