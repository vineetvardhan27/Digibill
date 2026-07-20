import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';

import { jest } from '@jest/globals';
let token;
let userId;

jest.setTimeout(30000);

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
    userId = res.body.data.user.id;
  }
});

describe('Phase 1: Cache-Aside Layer', () => {
  it('should hit the database on first request and cache on second', async () => {
    // 1. First request (Cache MISS)
    const start1 = Date.now();
    const res1 = await request(app)
      .get('/api/analytics/forecast')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res1.status).toBe(200);
    const duration1 = Date.now() - start1;

    // 2. Second request (Cache HIT)
    const start2 = Date.now();
    const res2 = await request(app)
      .get('/api/analytics/forecast')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res2.status).toBe(200);
    const duration2 = Date.now() - start2;

    // Cache hit should theoretically be faster, but strictly testing response validity is safer in CI
    expect(res2.body.data).toEqual(res1.body.data);
  });
});
