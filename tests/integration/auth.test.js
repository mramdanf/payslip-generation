const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../helpers/testHelpers');
const bcrypt = require('bcrypt');

describe('Authentication Endpoints', () => {
  describe('POST /users/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const userData = {
        username: 'testuser123',
        passwordHash: await bcrypt.hash('password123', 10),
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      };
      
      await TestHelpers.createTestUser(userData);

      // Act
      const response = await request(app)
        .post('/users/login')
        .send({
          username: 'testuser123',
          password: 'password123'
        });

      // Assert
      expect(response.status).toBe(200);
      TestHelpers.assertSuccessResponse(response);

      const body = response.body;
      expect(body.token).toBeDefined();
      expect(typeof body.token).toBe('string');
      expect(body.token.length).toBeGreaterThan(0);
    });

    it('should return 401 for non-existent user', async () => {
      // Act
      const response = await request(app)
        .post('/users/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword'
        });

      // Assert
      expect(response.status).toBe(401);
      TestHelpers.assertErrorResponse(response, 'Invalid credential');
    });

    it('should return 401 for wrong password', async () => {
      // Arrange
      const userData = {
        username: 'testuser456',
        passwordHash: await bcrypt.hash('correctpassword', 10),
        firstName: 'Test',
        lastName: 'User',
        email: 'test2@example.com'
      };
      
      await TestHelpers.createTestUser(userData);

      // Act
      const response = await request(app)
        .post('/users/login')
        .send({
          username: 'testuser456',
          password: 'wrongpassword'
        });

      // Assert
      expect(response.status).toBe(401);
      TestHelpers.assertErrorResponse(response, 'Invalid credential');
    });
  });

  describe('Health Check Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'Payslip Generation API');
    });

    it('should return database connection status', async () => {
      const response = await request(app).get('/db-test');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'Database connection successful');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('host');
    });
  });
}); 