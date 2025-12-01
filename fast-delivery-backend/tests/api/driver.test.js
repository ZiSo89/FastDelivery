/**
 * Driver API Tests
 * =================
 * Tests for driver app endpoints
 */

const request = require('supertest');
require('../setup');

const BASE_URL = global.testConfig.baseUrl;
let driverToken;

beforeAll(async () => {
  // Login as driver and get token
  const res = await request(BASE_URL)
    .post('/api/v1/auth/login')
    .send({
      email: global.testConfig.driverCredentials.email,
      password: global.testConfig.driverCredentials.password,
      role: 'driver'
    });
  
  driverToken = res.body.token;
});

describe('Driver API', () => {

  describe('GET /api/v1/driver/profile', () => {
    
    it('should return driver profile', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/driver/profile')
        .set('Authorization', `Bearer ${driverToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.driver).toBeDefined();
      expect(res.body.driver.name).toBeDefined();
    });

    it('should reject without auth', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/driver/profile');
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/driver/orders', () => {
    
    it('should return driver orders', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/driver/orders')
        .set('Authorization', `Bearer ${driverToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });
  });

  describe('PUT /api/v1/driver/availability', () => {
    
    it('should toggle availability', async () => {
      const res = await request(BASE_URL)
        .put('/api/v1/driver/availability')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          isOnline: true
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/driver/profile', () => {
    
    it('should update driver profile', async () => {
      const res = await request(BASE_URL)
        .put('/api/v1/driver/profile')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          phone: '6900000001'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
