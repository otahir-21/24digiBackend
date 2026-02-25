/**
 * Mask phone number for display (e.g. +971******123).
 * @param {string} phone - E.g. +971501234567
 * @returns {string}
 */
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  const last = cleaned.slice(-3);
  const prefix = phone.startsWith('+') ? phone.match(/^\+\d*/)?.[0] || '' : '';
  const masked = '*'.repeat(Math.min(6, cleaned.length - 3));
  return `${prefix}${masked}${last}`;
}

/**
 * Mask email for display (e.g. a***@domain.com).
 * @param {string} email
 * @returns {string}
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***@${domain}`;
}

module.exports = { maskPhone, maskEmail };
