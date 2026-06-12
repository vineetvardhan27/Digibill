/**
 * OCR Controller — Groq Vision API
 * Converts uploaded bill images to structured data using Groq's
 * vision-capable LLM (meta-llama/llama-4-scout-17b-16e-instruct).
 *
 * The image never touches disk — it arrives as a buffer from multer's
 * memory storage, gets base64-encoded, sent to Groq, and discarded.
 */

import Groq from 'groq-sdk';

// Lazy-initialized Groq client (avoids crash if GROQ_API_KEY isn't set at startup)
let groq = null;

function getGroqClient() {
  if (!groq) {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      throw new Error('GROQ_API_KEY is not configured. Please add your Groq API key to backend/.env');
    }
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

// Vision model — confirmed available on GroqCloud
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// ─── Prompt ──────────────────────────────────────────────────────────────────

const OCR_SYSTEM_PROMPT = `You are an expert OCR system specialized in reading supplier bills, invoices, and receipts. Your job is to extract structured data from bill images with maximum accuracy.

IMPORTANT RULES:
1. Return ONLY a raw JSON object — no markdown fences, no explanation, no preamble, no trailing text.
2. Extract data into this exact JSON schema:

{
  "supplierName": "string or null",
  "supplierPhone": "string or null",
  "supplierAddress": "string or null",
  "supplierGST": "string or null",
  "billDate": "YYYY-MM-DD or null",
  "dueDate": "YYYY-MM-DD or null",
  "totalAmount": number or null,
  "description": "string or null",
  "items": [
    {
      "name": "string",
      "quantity": number,
      "price": number,
      "unit": "string"
    }
  ],
  "confidence": "high" | "medium" | "low"
}

EXTRACTION RULES:
- For any field you cannot find or are unsure about, use null
- For items, return an empty array [] if the bill is not itemized
- Convert ANY date format to YYYY-MM-DD (e.g. "12/03/2025" → "2025-03-12", "Mar 12, 2025" → "2025-03-12")
- For totalAmount, return a plain number WITHOUT currency symbols (e.g. "₹1,500.00" → 1500, "$250" → 250)
- For supplierGST, look for GSTIN patterns: 15-character alphanumeric codes (e.g. "22AAAAA0000A1Z5")
- For description, provide a brief summary of what the bill is for
- For item units, use: "unit", "kg", "g", "L", "mL", "pcs", "box", "pack", "dozen", etc.

CONFIDENCE SCORING:
- "high": Most key fields extracted (supplier name + total amount + date + at least some items)
- "medium": Partial extraction (some key fields found but others missing)
- "low": Very little data found (poor image quality, handwritten, or mostly unreadable)

Remember: Return ONLY the JSON object, nothing else.`;

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Strip markdown code fences that the model might accidentally wrap around JSON.
 * Handles ```json ... ``` and ``` ... ``` patterns.
 */
function stripMarkdownFences(text) {
  let cleaned = text.trim();

  // Remove ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    // Remove opening fence (with optional language tag)
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
    // Remove closing fence
    cleaned = cleaned.replace(/\n?\s*```\s*$/, '');
  }

  return cleaned.trim();
}

/**
 * Map MIME type to the format string Groq expects in the data URI.
 */
function getMimeForDataUri(mimetype) {
  const map = {
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/png': 'image/png',
    'image/webp': 'image/webp',
    'image/heic': 'image/heic',
  };
  return map[mimetype] || 'image/jpeg';
}

// ─── Controller ──────────────────────────────────────────────────────────────

/**
 * POST /api/ocr/scan
 * Accept a bill image, send to Groq Vision API, return structured data.
 */
export async function scanBill(req, res) {
  const startTime = Date.now();

  try {
    // ─── 1. Validate File ────────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a bill image (JPG, PNG, WEBP, or HEIC).',
      });
    }

    const { buffer, mimetype, originalname, size } = req.file;

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📄 OCR SCAN (Groq Vision): ${originalname}`);
    console.log(`   Type: ${mimetype} | Size: ${(size / 1024).toFixed(1)} KB`);
    console.log(`${'═'.repeat(60)}`);

    // ─── 2. Convert to Base64 ────────────────────────────────────────
    const base64Image = buffer.toString('base64');
    const dataUri = `data:${getMimeForDataUri(mimetype)};base64,${base64Image}`;

    // ─── 3. Call Groq Vision API ─────────────────────────────────────
    console.log('🤖 Sending to Groq Vision API...');

    const chatCompletion = await getGroqClient().chat.completions.create({
      model: VISION_MODEL,
      temperature: 0.1,
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: OCR_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all structured data from this bill/invoice image. Return only the JSON object.',
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUri,
              },
            },
          ],
        },
      ],
    });

    const rawResponse = chatCompletion.choices?.[0]?.message?.content || '';
    const processingTime = Date.now() - startTime;

    console.log(`✅ Groq response received in ${(processingTime / 1000).toFixed(1)}s`);

    // ─── 4. Parse JSON Response ──────────────────────────────────────
    const cleanedResponse = stripMarkdownFences(rawResponse);

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse Groq response as JSON:', cleanedResponse.substring(0, 200));
      return res.status(422).json({
        success: false,
        message: 'AI could not extract structured data from this image. Please try a clearer photo or fill the form manually.',
      });
    }

    // ─── 5. Validate and normalize extracted data ────────────────────
    const result = {
      supplierName: parsedData.supplierName || null,
      supplierPhone: parsedData.supplierPhone || null,
      supplierAddress: parsedData.supplierAddress || null,
      supplierGST: parsedData.supplierGST || null,
      billDate: parsedData.billDate || null,
      dueDate: parsedData.dueDate || null,
      totalAmount: typeof parsedData.totalAmount === 'number' ? parsedData.totalAmount : null,
      description: parsedData.description || null,
      items: Array.isArray(parsedData.items) ? parsedData.items.map(item => ({
        name: item.name || '',
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        price: typeof item.price === 'number' ? item.price : 0,
        unit: item.unit || 'unit',
      })) : [],
      confidence: ['high', 'medium', 'low'].includes(parsedData.confidence)
        ? parsedData.confidence
        : 'low',
    };

    // ─── 6. Log summary ─────────────────────────────────────────────
    const fieldCount = Object.entries(result)
      .filter(([key, val]) => key !== 'items' && key !== 'confidence' && val !== null)
      .length;

    console.log(`📊 Extracted ${fieldCount}/8 fields, ${result.items.length} items, confidence: ${result.confidence}`);
    console.log(`   Supplier: ${result.supplierName || 'N/A'} | Total: ${result.totalAmount || 'N/A'}`);
    console.log(`${'═'.repeat(60)}\n`);

    // ─── 7. Return response ─────────────────────────────────────────
    res.status(200).json({
      success: true,
      message: 'Bill scanned successfully',
      data: result,
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`\n❌ OCR SCAN FAILED (${processingTime}ms): ${error.message}`);

    // ─── Handle Groq-specific errors ─────────────────────────────────
    if (error.status === 429 || error.error?.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        success: false,
        message: 'AI service rate limit exceeded. Please wait a moment and try again.',
      });
    }

    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'The image could not be processed. Please try a different image format (JPG or PNG recommended).',
      });
    }

    if (error.status === 401) {
      console.error('❌ GROQ_API_KEY is invalid or missing!');
      return res.status(500).json({
        success: false,
        message: 'OCR service configuration error. Please contact support.',
      });
    }

    // ─── Generic fallback ────────────────────────────────────────────
    res.status(500).json({
      success: false,
      message: 'Failed to scan the bill. Please try again or fill the form manually.',
    });
  }
}
