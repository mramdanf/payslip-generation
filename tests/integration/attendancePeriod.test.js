const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../helpers/testHelpers');
const bcrypt = require('bcrypt');

describe('Attendance Period Endpoints', () => {
  describe('POST /attendance-periods', () => {
    let authToken;
    let testUserId;

    beforeEach(async () => {
      // Create a test user and get auth token
      const userData = {
        username: 'attendanceuser',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Attendance User',
        role: 'employee',
        isActive: true,
        baseSalary: 5000000,
      };
      
      const user = await TestHelpers.createTestUser(userData);
      testUserId = user.id;

      // Login to get token
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'attendanceuser',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('should create attendance period successfully with valid data and token', async () => {
      // Arrange
      const attendancePeriodData = {
        name: 'Attendance June 2025',
        startDate: '2025-05-20',
        endDate: '2025-06-20'
      };

      // Act
      const response = await request(app)
        .post('/attendance-periods')
        .set('Authorization', `Bearer ${authToken}`)
        .send(attendancePeriodData);

      // Assert
      expect(response.status).toBe(200);
      TestHelpers.assertSuccessResponse(response);

      const body = response.body;
      expect(body.attendancePeriod).toBeDefined();
      expect(body.attendancePeriod.name).toBe(attendancePeriodData.name);
      expect(body.attendancePeriod.startDate).toBe(attendancePeriodData.startDate);
      expect(body.attendancePeriod.endDate).toBe(attendancePeriodData.endDate);
      expect(body.attendancePeriod.createdBy).toBe(testUserId);
      expect(body.attendancePeriod.updatedBy).toBe(testUserId);
      expect(body.attendancePeriod.id).toBeDefined();
    });

    it('should return 401 when no authorization token is provided', async () => {
      // Arrange
      const attendancePeriodData = {
        name: 'Attendance June 2025',
        startDate: '2025-05-20',
        endDate: '2025-06-20'
      };

      // Act
      const response = await request(app)
        .post('/attendance-periods')
        .send(attendancePeriodData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 401 when invalid authorization token is provided', async () => {
      // Arrange
      const attendancePeriodData = {
        name: 'Attendance June 2025',
        startDate: '2025-05-20',
        endDate: '2025-06-20'
      };

      // Act
      const response = await request(app)
        .post('/attendance-periods')
        .set('Authorization', 'Bearer invalid_token')
        .send(attendancePeriodData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 500 when required fields are missing', async () => {
      // Arrange
      const incompleteData = {
        name: 'Attendance June 2025'
        // Missing startDate and endDate
      };

      // Act
      const response = await request(app)
        .post('/attendance-periods')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData);

      // Assert
      expect(response.status).toBe(500);
      TestHelpers.assertErrorResponse(response);
    });

    it('should create attendance period with different date ranges', async () => {
      // Arrange
      const attendancePeriodData = {
        name: 'Quarterly Report Q1 2025',
        startDate: '2025-01-01',
        endDate: '2025-03-31'
      };

      // Act
      const response = await request(app)
        .post('/attendance-periods')
        .set('Authorization', `Bearer ${authToken}`)
        .send(attendancePeriodData);

      // Assert
      expect(response.status).toBe(200);
      TestHelpers.assertSuccessResponse(response);

      const body = response.body;
      expect(body.attendancePeriod.name).toBe(attendancePeriodData.name);
      expect(body.attendancePeriod.startDate).toBe(attendancePeriodData.startDate);
      expect(body.attendancePeriod.endDate).toBe(attendancePeriodData.endDate);
    });
  });
}); 