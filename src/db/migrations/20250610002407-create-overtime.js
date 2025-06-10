'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('overtime', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
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
      overtime_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      hours: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false,
        validate: {
          min: 0.01,
          max: 3.00
        }
      },
      is_locked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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

    // Add indexes for performance
    await queryInterface.addIndex('overtime', ['user_id']);
    await queryInterface.addIndex('overtime', ['attendance_period_id']);
    await queryInterface.addIndex('overtime', ['overtime_date']);
    await queryInterface.addIndex('overtime', ['user_id', 'attendance_period_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('overtime');
  }
};