/**
 * Store API Tests
 * ================
 * Tests for store dashboard endpoints
 */

const request = require('supertest');
require('../setup');

const BASE_URL = global.testConfig.baseUrl;
let storeToken;

beforeAll(async () => {
  // Login as store and get token
  const res = await request(BASE_URL)
    .post('/api/v1/auth/login')
    .send({
      email: global.testConfig.storeCredentials.email,
      password: global.testConfig.storeCredentials.password,
      role: 'store'
    });
  
  storeToken = res.body.token;
});

describe('Store API', () => {

  describe('GET /api/v1/store/profile', () => {
    
    it('should return store profile', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/store/profile')
        .set('Authorization', `Bearer ${storeToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.store).toBeDefined();
      expect(res.body.store.businessName).toBeDefined();
    });

    it('should reject without auth', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/store/profile');
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/store/orders', () => {
    
    it('should return store orders', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/store/orders')
        .set('Authorization', `Bearer ${storeToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });
  });

  describe('PUT /api/v1/store/profile', () => {
    
    it('should update store profile', async () => {
      const res = await request(BASE_URL)
        .put('/api/v1/store/profile')
        .set('Authorization', `Bearer ${storeToken}`)
        .send({
          phone: '2551012345'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
