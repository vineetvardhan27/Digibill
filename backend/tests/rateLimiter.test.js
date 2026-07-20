import request from 'supertest';
import app from '../server.js';
import redisClient from '../config/redis.js';

describe('Phase 2: Rate Limiter Middleware', () => {
  it('should return 429 Too Many Requests after exceeding window limit', async () => {
    const endpoint = '/api/auth/login';
    const limit = 5; // globalLimiter might be higher, but authLimiter is strict (5 per 15 min)
    
    // Clear the specific rate limit key for auth if needed, or just blast the endpoint
    // We send dummy requests up to the limit
    for (let i = 0; i < limit; i++) {
      const res = await request(app)
        .post(endpoint)
        .send({ email: 'ratelimit@example.com', password: 'wrong' });
      // Depending on auth config it might return 401 or 400, but shouldn't be 429 yet
      expect(res.status).not.toBe(429);
    }
    
    // The next request should hit the rate limiter
    const rateLimitedRes = await request(app)
      .post(endpoint)
      .send({ email: 'ratelimit@example.com', password: 'wrong' });
      
    expect(rateLimitedRes.status).toBe(429);
    expect(rateLimitedRes.headers).toHaveProperty('retry-after');
    expect(rateLimitedRes.body.message).toMatch(/Too many requests/i);
  });
});
