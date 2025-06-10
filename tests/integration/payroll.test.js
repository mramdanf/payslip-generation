const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../helpers/testHelpers');
const bcrypt = require('bcrypt');

describe('Payroll Endpoints', () => {
  let adminToken;
  let adminUserId;
  let attendancePeriodId;
  let employeeUser;

  beforeEach(async () => {
    // Create an admin user and get auth token
    const adminUserData = {
      username: 'payrolladmin',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Payroll Admin',
      role: 'admin',
      isActive: true,
      baseSalary: 10000000,
    };
    
    const adminUser = await TestHelpers.createTestUser(adminUserData);
    adminUserId = adminUser.id;

    // Login to get admin token
    const loginResponse = await request(app)
      .post('/users/login')
      .send({
        username: 'payrolladmin',
        password: 'password123'
      });

    adminToken = loginResponse.body.token;

    // Create an employee user for payroll processing
    const employeeUserData = {
      username: 'payrollemployee',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Payroll Employee',
      role: 'employee',
      isActive: true,
      baseSalary: 5000000,
    };
    
    employeeUser = await TestHelpers.createTestUser(employeeUserData);

    // Create an attendance period for testing
    const attendancePeriodData = {
      name: 'Test Payroll Period',
      startDate: '2025-06-01',
      endDate: '2025-06-30'
    };

    const periodResponse = await request(app)
      .post('/attendance-periods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(attendancePeriodData);

    attendancePeriodId = periodResponse.body.attendancePeriod.id;

    // Create some attendance data for the employee
    const attendanceData = {
      attendancePeriodId: attendancePeriodId,
      date: "2025-06-09",
      checkIn: "2025-06-09 09:00:00",
      checkOut: "2025-06-09 18:00:00"
    };

    // Login as employee to create attendance
    const employeeLoginResponse = await request(app)
      .post('/users/login')
      .send({
        username: 'payrollemployee',
        password: 'password123'
      });

    const employeeToken = employeeLoginResponse.body.token;

    await request(app)
      .post('/attendances')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send(attendanceData);
  });

  describe('POST /payrolls/run', () => {
    it('should run payroll successfully for admin', async () => {
      // Act
      const response = await request(app)
        .post('/payrolls/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          attendancePeriodId: attendancePeriodId
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payroll processed successfully');
      expect(response.body.data.payrollId).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.payslipsGenerated).toBeGreaterThan(0);
    });

    it('should return 400 if attendance period ID is missing', async () => {
      // Act
      const response = await request(app)
        .post('/payrolls/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Attendance period ID is required');
    });

    it('should return 401 without auth token', async () => {
      // Act
      const response = await request(app)
        .post('/payrolls/run')
        .send({
          attendancePeriodId: attendancePeriodId
        });

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid auth token', async () => {
      // Act
      const response = await request(app)
        .post('/payrolls/run')
        .set('Authorization', 'Bearer invalid_token')
        .send({
          attendancePeriodId: attendancePeriodId
        });

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent attendance period', async () => {
      // Act
      const response = await request(app)
        .post('/payrolls/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          attendancePeriodId: "123e4567-e89b-12d3-a456-426614174000"
        });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should return 409 if payroll already processed for period', async () => {
      // Arrange - First run payroll
      await request(app)
        .post('/payrolls/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          attendancePeriodId: attendancePeriodId
        });

      // Act - Try to run again
      const response = await request(app)
        .post('/payrolls/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          attendancePeriodId: attendancePeriodId
        });

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already been processed');
    });
  });
}); 