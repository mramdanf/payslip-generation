const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../helpers/testHelpers');
const bcrypt = require('bcrypt');

describe('Attendance Endpoints', () => {
  let authToken;
  let adminToken;
  let testUserId;
  let attendancePeriodId;

  beforeEach(async () => {
    // Create an admin user for attendance period creation
    const adminUserData = {
      username: 'attendanceadmin',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Attendance Admin',
      role: 'admin',
      isActive: true,
      baseSalary: 10000000,
    };
    
    await TestHelpers.createTestUser(adminUserData);

    // Create a test employee user
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

    // Login as admin to create attendance period
    const adminLoginResponse = await request(app)
      .post('/users/login')
      .send({
        username: 'attendanceadmin',
        password: 'password123'
      });

    adminToken = adminLoginResponse.body.token;

    // Login as employee to get token for attendance tests
    const loginResponse = await request(app)
      .post('/users/login')
      .send({
        username: 'attendanceuser',
        password: 'password123'
      });

    authToken = loginResponse.body.token;

    // Create an attendance period for testing (requires admin)
    const attendancePeriodData = {
      name: 'Test Attendance Period',
      startDate: '2025-06-01',
      endDate: '2025-06-30'
    };

    const periodResponse = await request(app)
      .post('/attendance-periods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(attendancePeriodData);

    attendancePeriodId = periodResponse.body.attendancePeriod.id;
  });

  describe('POST /attendances', () => {
    it('should create attendance successfully with valid data and token', async () => {
      // Arrange
      const attendanceData = {
        attendancePeriodId: attendancePeriodId,
        date: "2025-06-09",
        checkIn: "2025-06-09 09:00:00",
        checkOut: "2025-06-09 18:00:00"
      };

      // Act
      const response = await request(app)
        .post('/attendances')
        .set('Authorization', `Bearer ${authToken}`)
        .send(attendanceData);

      // Assert
      expect(response.status).toBe(200);
      TestHelpers.assertSuccessResponse(response);
      
      const attendance = response.body.attendance;
      expect(attendance.attendancePeriodId).toBe(attendancePeriodId);
      expect(attendance.date).toBe(attendanceData.date);
      expect(attendance.checkIn).toBe("09:00:00");
      expect(attendance.checkOut).toBe("18:00:00");
    });

    it('should return 401 when no authorization token is provided', async () => {
      // Arrange
      const attendanceData = {
        attendancePeriodId: attendancePeriodId,
        date: "2025-06-09",
        checkIn: "2025-06-09 09:00:00",
        checkOut: "2025-06-09 18:00:00"
      };

      // Act
      const response = await request(app)
        .post('/attendances')
        .send(attendanceData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 401 when invalid authorization token is provided', async () => {
      // Arrange
      const attendanceData = {
        attendancePeriodId: attendancePeriodId,
        date: "2025-06-09",
        checkIn: "2025-06-09 09:00:00",
        checkOut: "2025-06-09 18:00:00"
      };

      // Act
      const response = await request(app)
        .post('/attendances')
        .set('Authorization', 'Bearer invalid_token')
        .send(attendanceData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 400 for missing required fields', async () => {
      // Act
      const response = await request(app)
        .post('/attendances')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(400);
      TestHelpers.assertErrorResponse(response);
    });

    it('should return 400 for non-existent attendance period', async () => {
      // Arrange
      const attendanceData = {
        attendancePeriodId: "123e4567-e89b-12d3-a456-426614174000",
        date: "2025-06-09",
        checkIn: "2025-06-09 09:00:00",
        checkOut: "2025-06-09 18:00:00"
      };

      // Act
      const response = await request(app)
        .post('/attendances')
        .set('Authorization', `Bearer ${authToken}`)
        .send(attendanceData);

      // Assert
      expect(response.status).toBe(400);
      TestHelpers.assertErrorResponse(response);
    });

  });
}); 