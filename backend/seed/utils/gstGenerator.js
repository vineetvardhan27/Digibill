/**
 * GSTIN Generator
 * Generates valid-format 15-character Indian GST Identification Numbers.
 * Format: 22AAAAA0000A1Z5
 *   - Pos 1-2:  State code (01–37)
 *   - Pos 3-12: PAN (5 letters + 4 digits + 1 letter)
 *   - Pos 13:   Entity number (1–9)
 *   - Pos 14:   'Z' (default)
 *   - Pos 15:   Check digit (alphanumeric)
 */

// Indian state codes mapped to state names
const STATE_CODES = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
};

// Map city to state code for consistent data
const CITY_STATE_CODE_MAP = {
  'Kolkata': '19',
  'Delhi': '07',
  'Mumbai': '27',
  'Bengaluru': '29',
  'Pune': '27',
  'Hyderabad': '36',
  'Lucknow': '09',
  'Patna': '10',
  'Chennai': '33',
  'Ahmedabad': '24',
  'Jaipur': '08',
};

/**
 * Generates a random uppercase letter A–Z
 */
const randomLetter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));

/**
 * Generates a random digit 0–9
 */
const randomDigit = () => Math.floor(Math.random() * 10);

/**
 * Generates a valid-format GSTIN for a given city.
 * @param {string} [city] — Optional city name to derive the state code
 * @returns {string} 15-character GSTIN
 */
export function generateGSTIN(city) {
  // Determine state code from city or pick a random one
  let stateCode;
  if (city && CITY_STATE_CODE_MAP[city]) {
    stateCode = CITY_STATE_CODE_MAP[city];
  } else {
    const codes = Object.keys(STATE_CODES);
    stateCode = codes[Math.floor(Math.random() * codes.length)];
  }

  // PAN: 5 uppercase letters + 4 digits + 1 uppercase letter
  const pan =
    Array.from({ length: 5 }, randomLetter).join('') +
    Array.from({ length: 4 }, randomDigit).join('') +
    randomLetter();

  // Entity number (1–9)
  const entity = Math.floor(Math.random() * 9) + 1;

  // Fixed 'Z' + alphanumeric check digit
  const checkChar = randomLetter();

  return `${stateCode}${pan}${entity}Z${checkChar}`;
}

export { CITY_STATE_CODE_MAP, STATE_CODES };
