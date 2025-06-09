'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'employee'),
        allowNull: false
      },
      monthly_salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'user',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'user',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    });

    // Add indexes
    await queryInterface.addIndex('user', ['username']);
    await queryInterface.addIndex('user', ['role']);
    await queryInterface.addIndex('user', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user');
  }
}; 