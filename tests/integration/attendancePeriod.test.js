const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../helpers/testHelpers');
const bcrypt = require('bcrypt');

describe('Attendance Period Endpoints', () => {
  describe('POST /attendance-periods', () => {
    let adminToken;
    let employeeToken;
    let adminUserId;
    let employeeUserId;

    beforeEach(async () => {
      // Create an admin user and get auth token
      const adminUserData = {
        username: 'periodadmin',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Period Admin',
        role: 'admin',
        isActive: true,
        baseSalary: 10000000,
      };
      
      const adminUser = await TestHelpers.createTestUser(adminUserData);
      adminUserId = adminUser.id;

      // Create an employee user and get auth token
      const employeeUserData = {
        username: 'periodemployee',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Period Employee',
        role: 'employee',
        isActive: true,
        baseSalary: 5000000,
      };
      
      const employeeUser = await TestHelpers.createTestUser(employeeUserData);
      employeeUserId = employeeUser.id;

      // Login to get admin token
      const adminLoginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'periodadmin',
          password: 'password123'
        });

      adminToken = adminLoginResponse.body.token;

      // Login to get employee token
      const employeeLoginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'periodemployee',
          password: 'password123'
        });

      employeeToken = employeeLoginResponse.body.token;
    });

    it('should create attendance period successfully with valid data and admin token', async () => {
      // Arrange
      const attendancePeriodData = {
        name: 'Attendance June 2025',
        startDate: '2025-05-20',
        endDate: '2025-06-20'
      };

      // Act
      const response = await request(app)
        .post('/attendance-periods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(attendancePeriodData);

      // Assert
      expect(response.status).toBe(200);
      TestHelpers.assertSuccessResponse(response);

      const body = response.body;
      expect(body.attendancePeriod).toBeDefined();
      expect(body.attendancePeriod.name).toBe(attendancePeriodData.name);
      expect(body.attendancePeriod.startDate).toBe(attendancePeriodData.startDate);
      expect(body.attendancePeriod.endDate).toBe(attendancePeriodData.endDate);
      expect(body.attendancePeriod.createdBy).toBe(adminUserId);
      expect(body.attendancePeriod.updatedBy).toBe(adminUserId);
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

    it('should return 403 for non-admin users', async () => {
      // Arrange
      const attendancePeriodData = {
        name: 'Attendance June 2025',
        startDate: '2025-05-20',
        endDate: '2025-06-20'
      };

      // Act
      const response = await request(app)
        .post('/attendance-periods')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(attendancePeriodData);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.errorMessage).toContain('Admin access required');
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
        .set('Authorization', `Bearer ${adminToken}`)
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
        .set('Authorization', `Bearer ${adminToken}`)
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