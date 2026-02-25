const { z } = require('zod');

const loginMethods = ['phone', 'email'];
const platforms = ['ios', 'android', 'web'];

const deviceSchema = z
  .object({
    device_id: z.string().optional(),
    platform: z.enum(platforms).optional(),
    app_version: z.string().optional(),
    push_token: z.string().optional(),
  })
  .optional();

const loginStartSchema = z
  .object({
    login_method: z.enum(loginMethods),
    phone_number: z.string().optional(),
    email: z.string().email().optional(),
    country_code: z.string().max(3).optional(),
    language: z.enum(['en', 'ar']).optional(),
    device: deviceSchema,
  })
  .refine(
    (data) => {
      if (data.login_method === 'phone') return data.phone_number && data.phone_number.length > 0;
      if (data.login_method === 'email') return data.email && data.email.length > 0;
      return true;
    },
    { message: 'phone_number required for phone login, email required for email login', path: ['login_method'] }
  );

const verifyOtpSchema = z.object({
  challenge_id: z.string().uuid(),
  otp_code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  device: deviceSchema,
});

const resendOtpSchema = z.object({
  challenge_id: z.string().uuid(),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required'),
});

module.exports = {
  loginStartSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshSchema,
};
