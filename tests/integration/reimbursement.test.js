const request = require('supertest');
const app = require('../../src/app');
const TestHelpers = require('../helpers/testHelpers');
const bcrypt = require('bcrypt');

describe('Reimbursement Endpoints', () => {
  let authToken;
  let adminToken;
  let testUserId;
  let attendancePeriodId;

  beforeEach(async () => {
    // Create an admin user for attendance period creation
    const adminUserData = {
      username: 'reimbursementadmin',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Reimbursement Admin',
      role: 'admin',
      isActive: true,
      baseSalary: 10000000,
    };
    
    await TestHelpers.createTestUser(adminUserData);

    // Create a test employee user 
    const userData = {
      username: 'reimbursementuser',
      passwordHash: await bcrypt.hash('password123', 10),
      name: 'Reimbursement User',
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
        username: 'reimbursementadmin',
        password: 'password123'
      });

    adminToken = adminLoginResponse.body.token;

    // Login as employee to get token for reimbursement tests
    const loginResponse = await request(app)
      .post('/users/login')
      .send({
        username: 'reimbursementuser',
        password: 'password123'
      });

    authToken = loginResponse.body.token;

    // Create an attendance period for testing (requires admin)
    const attendancePeriodData = {
      name: 'Test Reimbursement Period',
      startDate: '2025-06-01',
      endDate: '2025-06-30'
    };

    const periodResponse = await request(app)
      .post('/attendance-periods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(attendancePeriodData);

    attendancePeriodId = periodResponse.body.attendancePeriod.id;
  });

  describe('POST /reimbursements', () => {
    it('should create reimbursement successfully', async () => {
      const reimbursementData = {
        attendancePeriodId: attendancePeriodId,
        amount: 100000,
        description: 'Travel expenses for client meeting'
      };

      // Act
      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reimbursementData);

      // Assert
      expect(response.status).toBe(201);
      TestHelpers.assertSuccessResponse(response);
      
      const reimbursement = response.body.data || response.body.reimbursement;
      expect(reimbursement).toBeDefined();
      expect(reimbursement.attendance_period_id).toBe(attendancePeriodId);
      expect(parseFloat(reimbursement.amount)).toBe(100000);
      expect(reimbursement.description).toBe('Travel expenses for client meeting');
      expect(reimbursement.user_id).toBe(testUserId);
      expect(reimbursement.is_locked).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      const reimbursementData = {
        attendancePeriodId: attendancePeriodId,
        amount: 100000,
        description: 'Travel expenses for client meeting'
      };

      // Act
      const response = await request(app)
        .post('/reimbursements')
        .send(reimbursementData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 401 when invalid authorization token is provided', async () => {
      const reimbursementData = {
        attendancePeriodId: attendancePeriodId,
        amount: 100000,
        description: 'Travel expenses for client meeting'
      };

      // Act
      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', 'Bearer invalid_token')
        .send(reimbursementData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 400 for missing required fields', async () => {
      // Act
      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(400);
      TestHelpers.assertErrorResponse(response);
    });

    it('should return 400 for invalid amount', async () => {
      const reimbursementData = {
        attendancePeriodId: attendancePeriodId,
        amount: -500000, // Negative amount should be invalid
        description: 'Invalid reimbursement with negative amount'
      };

      // Act
      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reimbursementData);

      // Assert
      expect(response.status).toBe(400);
      TestHelpers.assertErrorResponse(response);
    });

    it('should return 400 for zero amount', async () => {
      const reimbursementData = {
        attendancePeriodId: attendancePeriodId,
        amount: 0, // Zero amount should be invalid (min 0.01)
        description: 'Invalid reimbursement with zero amount'
      };

      // Act
      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reimbursementData);

      // Assert
      expect(response.status).toBe(400);
      TestHelpers.assertErrorResponse(response);
    });

    it('should return 400 for description too short', async () => {
      const reimbursementData = {
        attendancePeriodId: attendancePeriodId,
        amount: 100000,
        description: 'Short' // Less than 10 characters
      };

      // Act
      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reimbursementData);

      // Assert
      expect(response.status).toBe(400);
      TestHelpers.assertErrorResponse(response);
    });

    it('should return 400 for non-existent attendance period', async () => {
      const reimbursementData = {
        attendancePeriodId: "123e4567-e89b-12d3-a456-426614174000",
        amount: 100000,
        description: 'Non-existent period reimbursement'
      };

      // Act
      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reimbursementData);

      // Assert
      expect(response.status).toBe(400);
      TestHelpers.assertErrorResponse(response);
    });

    it('should create reimbursement with different amounts', async () => {
      const amounts = [50000, 250000, 1000000];
      
      for (const amount of amounts) {
        const reimbursementData = {
          attendancePeriodId: attendancePeriodId,
          amount,
          description: `Reimbursement for amount ${amount}`
        };

        // Act
        const response = await request(app)
          .post('/reimbursements')
          .set('Authorization', `Bearer ${authToken}`)
          .send(reimbursementData);

        // Assert
        expect(response.status).toBe(201);
        const reimbursement = response.body.data || response.body.reimbursement;
        expect(parseFloat(reimbursement.amount)).toBe(amount);
      }
    });
  });
}); 