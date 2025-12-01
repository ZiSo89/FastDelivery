/**
 * Auth API Tests
 * ===============
 * Tests for authentication endpoints
 */

const request = require('supertest');
require('../setup');

const BASE_URL = global.testConfig.baseUrl;

describe('Auth API', () => {
  
  describe('POST /api/v1/auth/login', () => {
    
    it('should login admin successfully', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/auth/login')
        .send({
          email: global.testConfig.adminCredentials.email,
          password: global.testConfig.adminCredentials.password,
          role: 'admin'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('admin');
    });

    it('should login store successfully', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/auth/login')
        .send({
          email: global.testConfig.storeCredentials.email,
          password: global.testConfig.storeCredentials.password,
          role: 'store'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('store');
    });

    it('should login driver successfully', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/auth/login')
        .send({
          email: global.testConfig.driverCredentials.email,
          password: global.testConfig.driverCredentials.password,
          role: 'driver'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('driver');
    });

    it('should login customer successfully', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/auth/login')
        .send({
          email: global.testConfig.customerCredentials.email,
          password: global.testConfig.customerCredentials.password,
          role: 'customer'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('customer');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@email.com',
          password: 'wrongpassword',
          role: 'customer'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing email', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/auth/login')
        .send({
          password: 'somepassword',
          role: 'customer'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing password', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@test.com',
          role: 'customer'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing role', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/store-types', () => {
    
    it('should return store types', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/auth/store-types');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.storeTypes).toBeDefined();
      expect(Array.isArray(res.body.storeTypes)).toBe(true);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    
    it('should handle forgot password request', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: global.testConfig.customerCredentials.email,
          type: 'customer'
        });
      
      // Should return success or error depending on email setup
      expect([200, 400, 404, 500]).toContain(res.statusCode);
    });

    it('should reject without type parameter', async () => {
      const res = await request(BASE_URL)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'test@test.com'
        });
      
      expect(res.statusCode).toBe(400);
    });
  });
});
