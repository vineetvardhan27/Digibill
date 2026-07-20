import crypto from 'crypto';
import request from 'supertest';
import app from '../server.js';

describe('Phase 4: Idempotency Middleware', () => {
  it('should return identical cached response on duplicate request', async () => {
    const idempotencyKey = 'test-idemp-key-123';
    const payload = JSON.stringify({ event: 'ping' });
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret')
      .update(payload)
      .digest('hex');

    const req = () =>
      request(app)
        .post('/api/payments/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Razorpay-Signature', signature)
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

    const res1 = await req();
    expect(res1.status).toBe(200);
    expect(res1.headers['x-idempotent-response']).toBeUndefined();

    const res2 = await req();
    expect(res2.status).toBe(200);
    expect(res2.headers['x-idempotent-response']).toBe('true');
    expect(res2.body).toEqual(res1.body);
  });
});
