/**
 * Indian Phone Number Generator
 * Generates valid 10-digit Indian mobile numbers.
 * Indian mobile numbers start with 6, 7, 8, or 9.
 */

const VALID_PREFIXES = ['6', '7', '8', '9'];

/**
 * Generates a random 10-digit Indian mobile number.
 * @returns {string} e.g. "9876543210"
 */
export function generatePhone() {
  const prefix = VALID_PREFIXES[Math.floor(Math.random() * VALID_PREFIXES.length)];
  const rest = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  return `${prefix}${rest}`;
}

/**
 * Generates an E.164 formatted Indian phone number.
 * @returns {string} e.g. "+919876543210"
 */
export function generateE164Phone() {
  return `+91${generatePhone()}`;
}
