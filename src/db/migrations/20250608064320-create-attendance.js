'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      employee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      attendance_period_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'attendance_period',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      check_in: {
        type: Sequelize.TIME,
        allowNull: true
      },
      check_out: {
        type: Sequelize.TIME,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('present', 'absent', 'late', 'half_day'),
        allowNull: false,
        defaultValue: 'present'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('attendance', ['employee_id']);
    await queryInterface.addIndex('attendance', ['attendance_period_id']);
    await queryInterface.addIndex('attendance', ['date']);
    await queryInterface.addIndex('attendance', ['status']);
    await queryInterface.addIndex('attendance', ['employee_id', 'attendance_period_id', 'date'], {
      unique: true,
      name: 'unique_employee_period_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attendance');
  }
}; 