const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const db = require('../../src/db');

class TestHelpers {
  /**
   * Create a test user with default or custom data
   */
  static async createTestUser(userData = {}) {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const defaultUser = {
      username: faker.internet.username().toLowerCase(),
      passwordHash,
      name: faker.person.fullName(),
      role: 'employee',
      isActive: true,
      baseSalary: 5000000, // 5 million IDR
      ...userData
    };
    
    return await db.User.create(defaultUser);
  }

  static async getUserByUsername(username) {
    return await db.User.findOne({ where: { username } });
  }

  /**
   * Create an admin user
   */
  static async createAdminUser(userData = {}) {
    return await this.createTestUser({
      username: 'admin_' + faker.string.alphanumeric(6),
      role: 'admin',
      baseSalary: 10000000, // 10 million IDR
      ...userData
    });
  }

  /**
   * Generate JWT auth token for a user
   */
  static generateAuthToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  }

  /**
   * Create an attendance period
   */
  static async createAttendancePeriod(data = {}) {
    const startDate = data.startDate || new Date('2024-01-01');
    const endDate = data.endDate || new Date('2024-01-31');
    
    return await db.AttendancePeriod.create({
      name: `Period ${faker.date.month()}-${startDate.getFullYear()}`,
      startDate,
      endDate,
      status: 'active',
      ...data
    });
  }

  /**
   * Create attendance record for a user
   */
  static async createAttendance(userId, periodId, data = {}) {
    return await db.Attendance.create({
      userId,
      attendancePeriodId: periodId,
      workingDays: 22,
      actualWorkingDays: 20,
      presentDays: 20,
      absentDays: 2,
      lateDays: 1,
      ...data
    });
  }

  /**
   * Create overtime record
   */
  static async createOvertime(userId, periodId, data = {}) {
    return await db.Overtime.create({
      userId,
      attendancePeriodId: periodId,
      date: new Date('2024-01-15'),
      hours: 2.5,
      description: 'Project deadline work',
      status: 'approved',
      ...data
    });
  }

  /**
   * Create reimbursement record
   */
  static async createReimbursement(userId, periodId, data = {}) {
    return await db.Reimbursement.create({
      userId,
      attendancePeriodId: periodId,
      amount: 500000, // 500k IDR
      category: 'transport',
      description: 'Business trip transportation',
      status: 'approved',
      ...data
    });
  }

  /**
   * Create a complete test scenario with user, period, and records
   */
  static async createCompleteTestScenario() {
    const user = await this.createTestUser();
    const admin = await this.createAdminUser();
    const period = await this.createAttendancePeriod();
    
    const attendance = await this.createAttendance(user.id, period.id);
    const overtime = await this.createOvertime(user.id, period.id);
    const reimbursement = await this.createReimbursement(user.id, period.id);
    
    return {
      user,
      admin,
      period,
      attendance,
      overtime,
      reimbursement,
      userToken: this.generateAuthToken(user.id),
      adminToken: this.generateAuthToken(admin.id)
    };
  }

  /**
   * Clean all test data (alternative to beforeEach truncation)
   */
  static async cleanDatabase() {
    const models = Object.keys(db.sequelize.models);
    
    for (const modelName of models) {
      await db[modelName].destroy({
        where: {},
        force: true
      });
    }
  }

  /**
   * Wait for a specified amount of time (useful for async operations)
   */
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Assert response structure for API endpoints
   */
  static assertSuccessResponse(response, expectedData = null) {
    if (expectedData) {
      expect(response.body).toHaveProperty('data');
      Object.keys(expectedData).forEach(key => {
        expect(response.body.data).toHaveProperty(key, expectedData[key]);
      });
    }
  }

  /**
   * Assert error response structure
   */
  static assertErrorResponse(response, expectedError = null) {
    expect(response.body).toHaveProperty('errorMessage');
    if (expectedError) {
      expect(response.body.errorMessage).toBe(expectedError);
    }
  }
}

module.exports = TestHelpers; 