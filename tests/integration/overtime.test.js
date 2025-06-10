const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../helpers/testHelpers');
const bcrypt = require('bcrypt');

describe('Overtime Endpoints', () => {
  let authToken;
  let adminToken;
  let testUserId;
  let attendancePeriodId;

  beforeEach(async () => {
    // Create an admin user for attendance period creation
    const adminUserData = {
      username: 'overtimeadmin',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Overtime Admin',
      role: 'admin',
      isActive: true,
      baseSalary: 10000000,
    };
    
    await TestHelpers.createTestUser(adminUserData);

    // Create a test employee user
    const userData = {
      username: 'overtimeuser',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Overtime User',
      role: 'employee',
      isActive: true,
      baseSalary: 5000000,
    };
    
    const user = await TestHelpers.createTestUser(userData);
    testUserId = user.id;

    // Login as admin to create attendance period
    const adminLoginResponse = await request(app)
      .post('/users/login')
      .send({
        username: 'overtimeadmin',
        password: 'password123'
      });

    adminToken = adminLoginResponse.body.token;

    // Login as employee to get token for overtime tests
    const loginResponse = await request(app)
      .post('/users/login')
      .send({
        username: 'overtimeuser',
        password: 'password123'
      });

    authToken = loginResponse.body.token;

    // Create an attendance period for testing (requires admin)
    const attendancePeriodData = {
      name: 'Test Overtime Period',
      startDate: '2025-06-01',
      endDate: '2025-06-30'
    };

    const periodResponse = await request(app)
      .post('/attendance-periods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(attendancePeriodData);

    attendancePeriodId = periodResponse.body.attendancePeriod.id;
  });

  describe('POST /overtimes', () => {
    it('should create overtime successfully with valid data and token', async () => {
      // Arrange - First create attendance record for the date
      const attendanceData = {
        attendancePeriodId: attendancePeriodId,
        date: "2025-06-09",
        checkIn: "2025-06-09 09:00:00",
        checkOut: "2025-06-09 18:00:00"
      };

      await request(app)
        .post('/attendances')
        .set('Authorization', `Bearer ${authToken}`)
        .send(attendanceData);

      const overtimeData = {
        attendancePeriodId: attendancePeriodId,
        overtimeDate: '2025-06-09',
        hours: 2.5
      };

      // Act
      const response = await request(app)
        .post('/overtimes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(overtimeData);

      // Assert
      expect(response.status).toBe(201);
      TestHelpers.assertSuccessResponse(response);

      const overtime = response.body.overtime;
      expect(overtime.attendance_period_id).toBe(attendancePeriodId);
      expect(overtime.hours).toBe(2.5);
    });

    it('should return 401 when no authorization token is provided', async () => {
      // Arrange
      const overtimeData = {
        attendancePeriodId: attendancePeriodId,
        overtimeDate: '2025-06-09',
        hours: 2.5
      };

      // Act
      const response = await request(app)
        .post('/overtimes')
        .send(overtimeData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 401 when invalid authorization token is provided', async () => {
      // Arrange
      const overtimeData = {
        attendancePeriodId: attendancePeriodId,
        overtimeDate: '2025-06-09',
        hours: 2.5
      };

      // Act
      const response = await request(app)
        .post('/overtimes')
        .set('Authorization', 'Bearer invalid_token')
        .send(overtimeData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 400 for missing required fields', async () => {
      // Act
      const response = await request(app)
        .post('/overtimes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(400);
      TestHelpers.assertErrorResponse(response);
    });

    it('should return 400 for invalid hours', async () => {
      // Arrange
      const overtimeData = {
        attendancePeriodId: attendancePeriodId,
        overtimeDate: '2025-06-09',
        hours: -1 // Invalid negative hours
      };

      // Act
      const response = await request(app)
        .post('/overtimes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(overtimeData);

      // Assert
      expect(response.status).toBe(400);
      TestHelpers.assertErrorResponse(response);
    });

    it('should return 400 for non-existent attendance period', async () => {
      // Arrange
      const overtimeData = {
        attendancePeriodId: "123e4567-e89b-12d3-a456-426614174000",
        overtimeDate: '2025-06-09',
        hours: 2.5
      };

      // Act
      const response = await request(app)
        .post('/overtimes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(overtimeData);

      // Assert
      expect(response.status).toBe(400);
      TestHelpers.assertErrorResponse(response);
    });
  });
}); 