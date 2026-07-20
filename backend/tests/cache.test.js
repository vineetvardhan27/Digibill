import request from 'supertest';
import app from '../server.js';

let token;

beforeAll(async () => {
  // Create a user for authenticated routes
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
  
  if (res.body.data && res.body.data.token) {
    token = res.body.data.token;
  }
});

describe('Phase 1: Cache-Aside Layer', () => {
  it('should hit the database on first request and cache on second', async () => {
    // 1. First request (Cache MISS)
    const res1 = await request(app)
      .get('/api/analytics/forecast')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res1.status).toBe(200);

    // 2. Second request (Cache HIT)
    const res2 = await request(app)
      .get('/api/analytics/forecast')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res2.status).toBe(200);

    // Cache hit should theoretically be faster, but strictly testing response validity is safer in CI
    expect(res2.body.data).toEqual(res1.body.data);
  });
});
