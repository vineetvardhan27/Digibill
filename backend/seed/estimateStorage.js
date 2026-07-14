/**
 * Storage Estimator
 * Estimates the approximate BSON size of generated data before insertion.
 * Aborts the seeding process if estimated size exceeds the safety limit.
 */

// Average overhead per BSON document (_id + field names + type markers)
const BSON_OVERHEAD_PER_DOC = 50; // bytes

// Safety limit for MongoDB Atlas Free Tier (leave room for indexes + growth)
const MAX_STORAGE_MB = 300;

/**
 * Estimates the size of a single document by summing approximate field sizes.
 * This is a rough BSON estimation, not byte-exact.
 * @param {object} doc — A document object
 * @returns {number} Estimated size in bytes
 */
function estimateDocSize(doc) {
  let size = BSON_OVERHEAD_PER_DOC;

  for (const [key, value] of Object.entries(doc)) {
    // Key name bytes
    size += key.length + 1;

    if (value === undefined || value === null) {
      size += 1;
    } else if (typeof value === 'string') {
      size += value.length + 5; // string length + 4-byte length prefix + null terminator
    } else if (typeof value === 'number') {
      size += 8; // double
    } else if (typeof value === 'boolean') {
      size += 1;
    } else if (value instanceof Date) {
      size += 8; // int64 timestamp
    } else if (value && value._bsontype === 'ObjectId') {
      size += 12;
    } else if (value && typeof value.toHexString === 'function') {
      size += 12; // ObjectId
    } else if (Array.isArray(value)) {
      // Recursively estimate array elements
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          size += estimateDocSize(item);
        } else if (typeof item === 'string') {
          size += item.length + 5;
        } else if (typeof item === 'number') {
          size += 8;
        } else {
          size += 4;
        }
      }
      size += 10; // array overhead
    } else if (typeof value === 'object') {
      // Nested sub-document
      size += estimateDocSize(value);
    }
  }

  return size;
}

/**
 * Estimates total storage for all collections and prints a summary.
 * @param {object} collections — Map of collection name → document array
 * @returns {{ totalMB: number, shouldAbort: boolean }} Estimation result
 */
export function estimateStorage(collections) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           📊 STORAGE ESTIMATION REPORT                  ║');
  console.log('╠══════════════════════════════════════════════════════════╣');

  let grandTotal = 0;
  const results = [];

  for (const [name, docs] of Object.entries(collections)) {
    if (!docs || docs.length === 0) {
      results.push({ name, count: 0, avgSize: 0, totalKB: 0 });
      continue;
    }

    // Sample up to 50 docs for estimation (faster for large collections)
    const sampleSize = Math.min(docs.length, 50);
    const step = Math.max(1, Math.floor(docs.length / sampleSize));
    let sampleTotal = 0;

    for (let i = 0; i < docs.length; i += step) {
      sampleTotal += estimateDocSize(docs[i]);
    }

    const sampledCount = Math.ceil(docs.length / step);
    const avgSize = Math.round(sampleTotal / sampledCount);
    const totalBytes = avgSize * docs.length;
    const totalKB = Number((totalBytes / 1024).toFixed(2));

    results.push({ name, count: docs.length, avgSize, totalKB });
    grandTotal += totalBytes;
  }

  // Index estimation: ~30% of data size for compound indexes
  const indexEstimate = grandTotal * 0.3;
  const totalWithIndexes = grandTotal + indexEstimate;
  const totalMB = Number((totalWithIndexes / (1024 * 1024)).toFixed(2));

  // Print table
  console.log('║                                                          ║');
  console.log(`║  ${'Collection'.padEnd(22)} ${'Count'.padStart(7)} ${'Avg(B)'.padStart(8)} ${'Total(KB)'.padStart(11)} ║`);
  console.log('║  ──────────────────── ─────── ──────── ─────────── ║');

  for (const r of results) {
    console.log(
      `║  ${r.name.padEnd(22)} ${String(r.count).padStart(7)} ${String(r.avgSize).padStart(8)} ${String(r.totalKB).padStart(11)} ║`
    );
  }

  console.log('║                                                          ║');
  console.log(`║  Data size:       ${String(Number((grandTotal / (1024 * 1024)).toFixed(2))) + ' MB'.padStart(10)}                       ║`);
  console.log(`║  Index estimate:  ${String(Number((indexEstimate / (1024 * 1024)).toFixed(2))) + ' MB'.padStart(10)}                       ║`);
  console.log(`║  ─────────────────────────────────                        ║`);
  console.log(`║  Total estimated: ${String(totalMB) + ' MB'.padStart(10)}                       ║`);
  console.log(`║  Atlas limit:     ${MAX_STORAGE_MB} MB                                   ║`);
  console.log('║                                                          ║');

  const shouldAbort = totalMB > MAX_STORAGE_MB;

  if (shouldAbort) {
    console.log('║  ⛔ ESTIMATED SIZE EXCEEDS 300 MB! Aborting seed.        ║');
  } else {
    const pct = ((totalMB / MAX_STORAGE_MB) * 100).toFixed(1);
    console.log(`║  ✅ Safe to proceed (${pct}% of limit)                    ║`);
  }

  console.log('╚══════════════════════════════════════════════════════════╝\n');

  return { totalMB, shouldAbort };
}
