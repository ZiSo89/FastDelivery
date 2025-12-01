/**
 * Health Check Tests
 * ===================
 * Tests for server health and availability
 */

const request = require('supertest');
require('../setup');

const BASE_URL = global.testConfig.baseUrl;

describe('Health Check API', () => {

  describe('GET /api/v1/health', () => {
    
    it('should return healthy status', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Fast Delivery API is running');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('Invalid Routes', () => {
    
    it('should return 404 for unknown routes', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/unknown-route');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
