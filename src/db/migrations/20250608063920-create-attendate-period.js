'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance_period', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      is_payroll_processed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      payroll_processed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      payroll_processed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'user',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('attendance_period', ['start_date', 'end_date']);
    await queryInterface.addIndex('attendance_period', ['is_payroll_processed']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attendance_period');
  }
}; 