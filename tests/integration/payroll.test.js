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
      monthlySalary: 5000000,
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

    it('should return 403 for non-admin users', async () => {
      // Get employee token
      const employeeLoginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'payrollemployee',
          password: 'password123'
        });

      const employeeToken = employeeLoginResponse.body.token;

      // Act
      const response = await request(app)
        .post('/payrolls/run')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          attendancePeriodId: attendancePeriodId
        });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.errorMessage).toContain('Admin access required');
    });
  });

  describe('GET /payrolls/payslip/:periodId', () => {
    let employeeToken;
    let payrollProcessed = false;

    beforeEach(async () => {
      // Get employee token for payslip access
      const employeeLoginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'payrollemployee',
          password: 'password123'
        });

      employeeToken = employeeLoginResponse.body.token;

      // Run payroll first if not already processed
      if (!payrollProcessed) {
        await request(app)
          .post('/payrolls/run')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            attendancePeriodId: attendancePeriodId
          });
        payrollProcessed = true;
      }
    });

    it('should get employee payslip successfully with valid token', async () => {
      // Act
      const response = await request(app)
        .get(`/payrolls/payslip/${attendancePeriodId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      // Assert
      expect(response.status).toBe(200);
      
      const data = response.body.data;
      expect(data.payslipInfo).toBeDefined();

      // Check payslip info
      expect(data.payslipInfo).toBeDefined();
      expect(data.payslipInfo.payslipNumber).toBeDefined();
      expect(data.payslipInfo.employeeName).toBe('Payroll Employee');
      expect(data.payslipInfo.periodName).toBe('Test Payroll Period');
      expect(data.payslipInfo.periodStartDate).toBe('2025-06-01');
      expect(data.payslipInfo.periodEndDate).toBe('2025-06-30');

      // Check salary breakdown
      expect(data.salaryBreakdown).toBeDefined();
      expect(data.salaryBreakdown.basicSalary).toBe(5000000);
      expect(data.salaryBreakdown.totalWorkingDays).toBeDefined();
      expect(data.salaryBreakdown.daysWorked).toBeDefined();
      expect(data.salaryBreakdown.grossSalary).toBeDefined();
      expect(data.salaryBreakdown.deductions).toBe(0);
      expect(data.salaryBreakdown.netSalary).toBeDefined();

      // Check attendance breakdown
      expect(data.attendanceBreakdown).toBeDefined();
      expect(data.attendanceBreakdown.summary).toBeDefined();
      expect(data.attendanceBreakdown.impact).toBeDefined();

      // Check overtime breakdown
      expect(data.overtimeBreakdown).toBeDefined();
      expect(data.overtimeBreakdown.summary).toBeDefined();
      expect(data.overtimeBreakdown.details).toEqual([]);

      // Check reimbursement breakdown
      expect(data.reimbursementBreakdown).toBeDefined();
      expect(data.reimbursementBreakdown.summary).toBeDefined();
      expect(data.reimbursementBreakdown.details).toEqual([]);

      // Check total take home
      expect(data.totalTakeHome).toBeDefined();
      expect(typeof data.totalTakeHome).toBe('number');

      // Check calculation breakdown
      expect(data.calculation).toBeDefined();
      expect(data.calculation.grossSalary).toBeDefined();
      expect(data.calculation.overtimePay).toBe(0);
      expect(data.calculation.reimbursements).toBe(0);
      expect(data.calculation.deductions).toBe(0);
      expect(data.calculation.totalTakeHome).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      // Act
      const response = await request(app)
        .get(`/payrolls/payslip/${attendancePeriodId}`);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid auth token', async () => {
      // Act
      const response = await request(app)
        .get(`/payrolls/payslip/${attendancePeriodId}`)
        .set('Authorization', 'Bearer invalid_token');

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent attendance period', async () => {
      // Act
      const response = await request(app)
        .get('/payrolls/payslip/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${employeeToken}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not been processed');
    });

    it('should return 400 for attendance period without processed payroll', async () => {
      // Create a new attendance period without running payroll
      const newPeriodData = {
        name: 'Unprocessed Period',
        startDate: '2025-07-01',
        endDate: '2025-07-31'
      };

      const newPeriodResponse = await request(app)
        .post('/attendance-periods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newPeriodData);

      const newPeriodId = newPeriodResponse.body.attendancePeriod.id;

      // Act
      const response = await request(app)
        .get(`/payrolls/payslip/${newPeriodId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not been processed');
    });

    it('should return 400 when employee has no payslip for the period', async () => {
      // Create another employee without attendance/payslip
      const anotherEmployeeData = {
        username: 'anotheremployee',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Another Employee',
        role: 'employee',
        isActive: true,
        baseSalary: 5000000,
      };
      
      await TestHelpers.createTestUser(anotherEmployeeData);

      // Login as the new employee
      const anotherEmployeeLoginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'anotheremployee',
          password: 'password123'
        });

      const anotherEmployeeToken = anotherEmployeeLoginResponse.body.token;

      // Act - Try to get payslip for employee who has no attendance/payslip
      const response = await request(app)
        .get(`/payrolls/payslip/${attendancePeriodId}`)
        .set('Authorization', `Bearer ${anotherEmployeeToken}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not been processed');
    });
  });

  describe('GET /payrolls/summary/:periodId', () => {
    let payrollProcessed = false;

    beforeEach(async () => {
      // Run payroll first if not already processed
      if (!payrollProcessed) {
        await request(app)
          .post('/payrolls/run')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            attendancePeriodId: attendancePeriodId
          });
        payrollProcessed = true;
      }
    });

    it('should get payroll summary successfully for admin', async () => {
      // Act
      const response = await request(app)
        .get(`/payrolls/summary/${attendancePeriodId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const data = response.body.data;
      
      // Check period info
      expect(data.periodInfo).toBeDefined();
      expect(data.periodInfo.periodId).toBe(attendancePeriodId);
      expect(data.periodInfo.periodName).toBe('Test Payroll Period');
      expect(data.periodInfo.startDate).toBe('2025-06-01');
      expect(data.periodInfo.endDate).toBe('2025-06-30');
      expect(data.periodInfo.processedAt).toBeDefined();
      expect(data.periodInfo.processedBy).toBe(adminUserId);

      // Check summary
      expect(data.summary).toBeDefined();
      expect(data.summary.totalEmployees).toBe(1); // We have 1 employee in test
      expect(data.summary.totalTakeHomePay).toBeDefined();
      expect(typeof data.summary.totalTakeHomePay).toBe('number');
      expect(data.summary.averageTakeHomePay).toBeDefined();
      expect(data.summary.totalGrossSalary).toBeDefined();
      expect(data.summary.totalOvertimePay).toBe(0);
      expect(data.summary.totalReimbursements).toBe(0);
      expect(data.summary.totalDeductions).toBe(0);

      // Check employees array
      expect(data.employees).toBeDefined();
      expect(Array.isArray(data.employees)).toBe(true);
      expect(data.employees.length).toBe(1);
      
      const employee = data.employees[0];
      expect(employee.employeeId).toBe(employeeUser.id);
      expect(employee.employeeName).toBe('Payroll Employee');
      expect(employee.takeHomePay).toBeDefined();
      expect(typeof employee.takeHomePay).toBe('number');
      expect(employee.grossSalary).toBeDefined();
      expect(employee.overtimePay).toBe(0);
      expect(employee.reimbursements).toBe(0);
      expect(employee.deductions).toBe(0);
    });

    it('should return 401 without auth token', async () => {
      // Act
      const response = await request(app)
        .get(`/payrolls/summary/${attendancePeriodId}`);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid auth token', async () => {
      // Act
      const response = await request(app)
        .get(`/payrolls/summary/${attendancePeriodId}`)
        .set('Authorization', 'Bearer invalid_token');

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      // Get employee token
      const employeeLoginResponse = await request(app)
        .post('/users/login')
        .send({
          username: 'payrollemployee',
          password: 'password123'
        });

      const employeeToken = employeeLoginResponse.body.token;

      // Act
      const response = await request(app)
        .get(`/payrolls/summary/${attendancePeriodId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.errorMessage).toContain('Admin access required');
    });


  });
}); 