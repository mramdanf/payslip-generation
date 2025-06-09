'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payslip', {
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
      payslip_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      basic_salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      days_worked: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      total_working_days: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      gross_salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      deductions: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      net_salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'generated', 'sent'),
        allowNull: false,
        defaultValue: 'draft'
      },
      generated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sent_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('payslip', ['employee_id']);
    await queryInterface.addIndex('payslip', ['attendance_period_id']);
    await queryInterface.addIndex('payslip', ['payslip_number']);
    await queryInterface.addIndex('payslip', ['status']);
    await queryInterface.addIndex('payslip', ['employee_id', 'attendance_period_id'], {
      unique: true,
      name: 'unique_employee_period_payslip'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payslip');
  }
}; 