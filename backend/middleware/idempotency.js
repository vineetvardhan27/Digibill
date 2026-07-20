import crypto from 'crypto';
import redis from '../lib/redis.js';

/**
 * Idempotency Middleware
 * 
 * Ensures that retried mutating network requests (with side effects) are 
 * only processed once. If a request is retried, the cached successful 
 * response is returned immediately.
 */
export const idempotencyMiddleware = async (req, res, next) => {
  // Only apply to methods that typically mutate state, although this
  // middleware is usually attached to specific routes manually.
  if (req.method === 'GET') {
    return next();
  }

  try {
    // 1. Read header or derive a fallback key
    let idempotencyKey = req.headers['idempotency-key'] || req.headers['x-razorpay-event-id'];
    
    if (!idempotencyKey) {
      // Fallback hash: userId + route + body
      const userId = req.user ? req.user._id.toString() : 'anonymous';
      const route = req.originalUrl;
      const bodyString = JSON.stringify(req.body || {});
      
      const hash = crypto.createHash('sha256')
        .update(`${userId}:${route}:${bodyString}`)
        .digest('hex');
        
      idempotencyKey = `auto_${hash}`;
    }

    const cacheKey = `idempotency:${idempotencyKey}`;

    // 2. Check Redis for an existing successful response
    // We use a timeout so that if Redis is unreachable (and maxRetriesPerRequest: null is set),
    // we don't hang the request forever. We just fail open.
    let cachedResponse = null;
    try {
      cachedResponse = await Promise.race([
        redis.get(cacheKey),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000))
      ]);
    } catch (err) {
      console.error(`⚠️ [Idempotency] Failed to read from Redis for key ${idempotencyKey}:`, err.message);
    }
    
    if (cachedResponse) {
      console.log(`♻️ [Idempotency] Cache hit for key: ${idempotencyKey}. Returning cached response.`);
      const { statusCode, body, headers } = JSON.parse(cachedResponse);
      
      // Restore headers if any were cached (like content-type)
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          res.setHeader(key, value);
        }
      }
      
      res.setHeader('X-Idempotent-Response', 'true');
      return res.status(statusCode).send(body);
    }

    // 3. Intercept the response to cache it if successful
    const originalJson = res.json;
    const originalSend = res.send;

    // We override `res.json` because Digibill routes heavily use it.
    // If a route uses `res.send` directly with an object, it usually delegates to json anyway,
    // but overriding both is safer for raw text/html.
    let responseBody = null;

    res.json = function (body) {
      responseBody = JSON.stringify(body);
      return originalJson.call(this, body);
    };

    res.send = function (body) {
      // If responseBody is already set by json(), don't overwrite it
      if (!responseBody) {
        // If it's an object, stringify it, otherwise keep as is
        responseBody = typeof body === 'object' ? JSON.stringify(body) : body;
      }
      return originalSend.call(this, body);
    };

    // Hook into the 'finish' event to store the response after it's sent
    res.on('finish', async () => {
      // Only cache successful responses (2xx). 
      // We don't want to cache 4xx/5xx because the client should be able to retry and fix the error.
      if (res.statusCode >= 200 && res.statusCode < 300 && responseBody) {
        const responseData = {
          statusCode: res.statusCode,
          headers: {
            'Content-Type': res.getHeader('Content-Type')
          },
          body: responseBody
        };
        
        // Save to Redis with a 24-hour TTL (with timeout to prevent hanging if Redis is down)
        try {
          await Promise.race([
            redis.setex(cacheKey, 24 * 60 * 60, JSON.stringify(responseData)),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000))
          ]);
          console.log(`💾 [Idempotency] Cached response for key: ${idempotencyKey}`);
        } catch (err) {
          console.error(`⚠️ [Idempotency] Failed to cache response for key ${idempotencyKey}:`, err.message);
        }
      }
    });

    next();
  } catch (error) {
    console.error('Idempotency middleware error:', error);
    // If Redis fails, fail open and just let the request through
    next();
  }
};
