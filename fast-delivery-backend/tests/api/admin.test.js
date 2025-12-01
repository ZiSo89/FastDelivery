/**
 * Admin API Tests
 * ================
 * Tests for admin dashboard endpoints
 */

const request = require('supertest');
require('../setup');

const BASE_URL = global.testConfig.baseUrl;
let adminToken;

beforeAll(async () => {
  // Login as admin and get token
  const res = await request(BASE_URL)
    .post('/api/v1/auth/login')
    .send({
      email: global.testConfig.adminCredentials.email,
      password: global.testConfig.adminCredentials.password,
      role: 'admin'
    });
  
  adminToken = res.body.token;
});

describe('Admin API', () => {

  describe('GET /api/v1/admin/stats', () => {
    
    it('should return dashboard stats', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalOrders).toBeDefined();
    });

    it('should reject without auth token', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/admin/stats');
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/admin/stats/extended', () => {
    
    it('should return extended stats', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/admin/stats/extended')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/admin/stores', () => {
    
    it('should return stores list', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/admin/stores')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.stores)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/drivers', () => {
    
    it('should return drivers list', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/admin/drivers')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.drivers)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/customers', () => {
    
    it('should return customers list', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/admin/customers')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.customers)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/orders', () => {
    
    it('should return orders list', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });
  });

  describe('Settings API', () => {
    
    it('GET /api/v1/admin/settings - should return settings', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings).toBeDefined();
    });

    it('PUT /api/v1/admin/settings - should update settings', async () => {
      const res = await request(BASE_URL)
        .put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driverSalary: 850,
          defaultDeliveryFee: 2.5
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Monthly Expenses API', () => {
    
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    it('GET /api/v1/admin/expenses/:year/:month - should return expenses', async () => {
      const res = await request(BASE_URL)
        .get(`/api/v1/admin/expenses/${year}/${month}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PUT /api/v1/admin/expenses/:year/:month - should update expenses', async () => {
      const res = await request(BASE_URL)
        .put(`/api/v1/admin/expenses/${year}/${month}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 150,
          notes: 'Test expenses'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Admin Profile API', () => {
    
    it('GET /api/v1/admin/profile - should return admin profile', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.admin).toBeDefined();
    });
  });
});
