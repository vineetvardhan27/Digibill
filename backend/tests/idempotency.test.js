import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

let token;

beforeAll(async () => {
  const user = new User({
    name: 'Idempotency User',
    email: 'idemp@example.com',
    passwordHash: 'dummyhash',
    emailVerified: true
  });
  await user.save();

  // Login to get token
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'idemp@example.com',
      password: 'password123'
    });
  // Since we bypassed register we might not have a password set up right, let's just generate a token
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
});

describe('Phase 4: Idempotency Middleware', () => {
  it('should return identical cached response on duplicate request', async () => {
    const idempotencyKey = 'test-idemp-key-123';
    
    // First request
    const res1 = await request(app)
      .post('/api/reminders/test')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ dummy: 'data' });
    
    // Note: /api/reminders/test is just a dummy endpoint we added idempotency to
    expect(res1.status).toBe(200);
    expect(res1.headers['x-idempotent-response']).toBeUndefined();
    
    // Second request with same key
    const res2 = await request(app)
      .post('/api/reminders/test')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ dummy: 'data' });
      
    expect(res2.status).toBe(200);
    expect(res2.headers['x-idempotent-response']).toBe('true');
    expect(res2.body).toEqual(res1.body);
  });
});
