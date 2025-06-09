'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await queryInterface.bulkInsert('user', [
      {
        id: adminId,
        username: 'admin',
        password_hash: hashedPassword,
        name: 'System Administrator',
        role: 'admin',
        monthly_salary: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: adminId,
        updated_by: adminId
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user', {
      username: 'admin'
    });
  }
}; 