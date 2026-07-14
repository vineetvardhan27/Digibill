/**
 * Indian Company & Business Data Generator
 * Provides curated lists of realistic Indian business names, cities,
 * addresses, and Kirana store product descriptions.
 */

// ─── Indian Business Name Components ─────────────────────────────────────────

const SURNAMES = [
  'Sharma', 'Gupta', 'Agarwal', 'Verma', 'Singh', 'Patel', 'Jain',
  'Bansal', 'Mittal', 'Kumar', 'Mehta', 'Shah', 'Mishra', 'Tiwari',
  'Pandey', 'Yadav', 'Reddy', 'Nair', 'Das', 'Bose', 'Roy',
  'Chatterjee', 'Mukherjee', 'Ghosh', 'Saha',
];

const SUFFIXES = [
  'Traders', 'Stores', 'Enterprise', 'Distributors', 'Wholesale',
  'Agencies', 'And Sons', 'Brothers', 'Trading Co.', 'Mart',
  'Supply Co.', 'General Store', 'Provision Store', 'Industries',
];

const PREFIXES = [
  'Shri', 'Maa', 'Sri', 'Om', 'Krishna', 'Jai', 'New', 'Royal',
  'Bharat', 'National', 'Laxmi', 'Ganesh', 'Balaji', 'Durga',
];

// ─── Indian Cities & States ──────────────────────────────────────────────────

export const CITIES = [
  { city: 'Kolkata', state: 'West Bengal', pin: '700' },
  { city: 'Delhi', state: 'Delhi', pin: '110' },
  { city: 'Mumbai', state: 'Maharashtra', pin: '400' },
  { city: 'Bengaluru', state: 'Karnataka', pin: '560' },
  { city: 'Pune', state: 'Maharashtra', pin: '411' },
  { city: 'Hyderabad', state: 'Telangana', pin: '500' },
  { city: 'Lucknow', state: 'Uttar Pradesh', pin: '226' },
  { city: 'Patna', state: 'Bihar', pin: '800' },
];

const AREAS = [
  'MG Road', 'Station Road', 'Main Bazaar', 'Gandhi Nagar',
  'Nehru Colony', 'Subhash Marg', 'Lal Chowk', 'Civil Lines',
  'Sector 5', 'Market Road', 'Industrial Area', 'Ring Road',
  'GT Road', 'Mall Road', 'Rajpur Road', 'Tilak Nagar',
];

// ─── Kirana Store Products ──────────────────────────────────────────────────

export const KIRANA_ITEMS = [
  // Grains & pulses
  { desc: 'Toor Dal 1kg', hsnCode: '07134000', unit: [80, 160], gst: 0 },
  { desc: 'Basmati Rice 5kg', hsnCode: '10063020', unit: [350, 600], gst: 5 },
  { desc: 'Wheat Flour 10kg', hsnCode: '11010000', unit: [280, 450], gst: 0 },
  { desc: 'Chana Dal 1kg', hsnCode: '07132000', unit: [70, 130], gst: 0 },
  { desc: 'Moong Dal 1kg', hsnCode: '07132000', unit: [90, 170], gst: 0 },
  { desc: 'Sugar 5kg', hsnCode: '17019910', unit: [180, 280], gst: 5 },

  // Oils
  { desc: 'Mustard Oil 1L', hsnCode: '15141100', unit: [140, 220], gst: 5 },
  { desc: 'Sunflower Oil 1L', hsnCode: '15121100', unit: [130, 200], gst: 5 },
  { desc: 'Refined Oil 5L', hsnCode: '15079010', unit: [500, 850], gst: 5 },

  // Spices
  { desc: 'Turmeric Powder 200g', hsnCode: '09103000', unit: [30, 80], gst: 5 },
  { desc: 'Red Chilli Powder 200g', hsnCode: '09042100', unit: [40, 90], gst: 5 },
  { desc: 'Coriander Powder 200g', hsnCode: '09092100', unit: [25, 60], gst: 5 },
  { desc: 'Garam Masala 100g', hsnCode: '09109900', unit: [45, 100], gst: 5 },
  { desc: 'Cumin Seeds 100g', hsnCode: '09093100', unit: [40, 80], gst: 5 },

  // FMCG
  { desc: 'Surf Excel 1kg', hsnCode: '34022090', unit: [180, 280], gst: 18 },
  { desc: 'Vim Bar 200g', hsnCode: '34011100', unit: [20, 40], gst: 18 },
  { desc: 'Colgate Toothpaste 200g', hsnCode: '33061000', unit: [80, 140], gst: 18 },
  { desc: 'Lux Soap 100g', hsnCode: '34011100', unit: [30, 55], gst: 18 },
  { desc: 'Dettol 500ml', hsnCode: '34011900', unit: [90, 160], gst: 18 },
  { desc: 'Clinic Plus Shampoo 175ml', hsnCode: '33051000', unit: [80, 140], gst: 28 },

  // Beverages
  { desc: 'Tata Tea 500g', hsnCode: '09024010', unit: [180, 300], gst: 5 },
  { desc: 'Nescafe Coffee 200g', hsnCode: '09019090', unit: [250, 450], gst: 5 },
  { desc: 'Bournvita 500g', hsnCode: '18069000', unit: [200, 350], gst: 18 },

  // Dairy & packaged
  { desc: 'Amul Butter 500g', hsnCode: '04051000', unit: [220, 280], gst: 12 },
  { desc: 'Amul Cheese 200g', hsnCode: '04061000', unit: [90, 150], gst: 12 },
  { desc: 'Britannia Bread', hsnCode: '19059040', unit: [35, 55], gst: 0 },
  { desc: 'Parle-G Biscuit 800g', hsnCode: '19053200', unit: [60, 100], gst: 18 },
  { desc: 'Maggi Noodles 12pk', hsnCode: '19023010', unit: [120, 180], gst: 12 },

  // Stationery (for variety)
  { desc: 'Classmate Notebook 200pg', hsnCode: '48201000', unit: [40, 70], gst: 12 },
  { desc: 'Reynolds Pen Pack 10', hsnCode: '96081000', unit: [50, 90], gst: 18 },
];

// ─── Indian First Names ──────────────────────────────────────────────────────

export const FIRST_NAMES = [
  'Rajesh', 'Suresh', 'Ramesh', 'Amit', 'Vikram', 'Sanjay', 'Anil',
  'Manoj', 'Pradeep', 'Rakesh', 'Deepak', 'Vijay', 'Ashok', 'Nitin',
  'Sunil', 'Prakash', 'Arvind', 'Ravi', 'Ajay', 'Dinesh',
  'Pooja', 'Priya', 'Anjali', 'Sunita', 'Kavita', 'Neha', 'Meena',
  'Rekha', 'Suman', 'Aarti',
];

// ─── Shop Name Components ────────────────────────────────────────────────────

const SHOP_TYPES = [
  'Kirana Store', 'General Store', 'Provision Store', 'Super Mart',
  'Grocery', 'Mini Mart', 'Daily Needs', 'Bazaar',
];

// ─── Supplier Categories (matching SupplierAccount schema enum) ──────────────

export const SUPPLIER_CATEGORIES = [
  'Vegetables & Produce',
  'Groceries & FMCG',
  'Packaging',
  'Electronics',
  'Stationery',
  'Furniture',
  'Textiles',
  'Hardware',
  'Food & Beverages',
  'Other',
];

// ─── Generator Functions ─────────────────────────────────────────────────────

/**
 * Picks a random element from an array.
 */
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Picks N unique random elements from an array.
 */
export function pickN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}

/**
 * Generates a realistic Indian business/company name.
 * @returns {string} e.g. "Shri Sharma Traders" or "Gupta Brothers"
 */
export function generateCompanyName() {
  const usePref = Math.random() > 0.5;
  const surname = pick(SURNAMES);
  const suffix = pick(SUFFIXES);

  if (usePref) {
    const prefix = pick(PREFIXES);
    return `${prefix} ${surname} ${suffix}`;
  }
  return `${surname} ${suffix}`;
}

/**
 * Generates a realistic Indian shop name for Kirana stores.
 * @param {string} ownerSurname — Owner's last name
 * @returns {string} e.g. "Sharma Kirana Store"
 */
export function generateShopName(ownerSurname) {
  const shopType = pick(SHOP_TYPES);
  const usePrefix = Math.random() > 0.6;
  if (usePrefix) {
    return `${pick(PREFIXES)} ${ownerSurname} ${shopType}`;
  }
  return `${ownerSurname} ${shopType}`;
}

/**
 * Generates a realistic Indian address.
 * @param {object} cityObj — City object from CITIES array
 * @returns {string} e.g. "42, MG Road, Kolkata - 700012"
 */
export function generateAddress(cityObj) {
  const num = Math.floor(Math.random() * 200) + 1;
  const area = pick(AREAS);
  const pinSuffix = String(Math.floor(Math.random() * 100)).padStart(3, '0');
  return `${num}, ${area}, ${cityObj.city} - ${cityObj.pin}${pinSuffix}`;
}

/**
 * Returns a random city object from CITIES.
 */
export function getRandomCity() {
  return pick(CITIES);
}

/**
 * Generates a full Indian name (first + surname).
 */
export function generateFullName() {
  return `${pick(FIRST_NAMES)} ${pick(SURNAMES)}`;
}
