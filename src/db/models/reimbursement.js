'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Reimbursement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Reimbursement belongs to User
      Reimbursement.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Reimbursement belongs to AttendancePeriod
      Reimbursement.belongsTo(models.AttendancePeriod, {
        foreignKey: 'attendance_period_id',
        as: 'attendancePeriod'
      });

      // Reimbursement belongs to User (created_by)
      Reimbursement.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });

      // Reimbursement belongs to User (updated_by)
      Reimbursement.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
      });
    }

    /**
     * Check if reimbursement can be modified (not locked)
     */
    canBeModified() {
      return !this.is_locked;
    }

    /**
     * Format amount for display
     */
    getFormattedAmount() {
      return parseFloat(this.amount).toFixed(2);
    }

    /**
     * Get reimbursement summary
     */
    getSummary() {
      return {
        id: this.id,
        amount: this.getFormattedAmount(),
        description: this.description,
        date: this.created_at,
        isLocked: this.is_locked
      };
    }
  }

  Reimbursement.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    attendance_period_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0.01],
          msg: 'Reimbursement amount must be greater than 0'
        },
        isDecimal: true,
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Description is required'
        },
        len: {
          args: [10, 1000],
          msg: 'Description must be between 10 and 1000 characters'
        }
      }
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Reimbursement',
    tableName: 'reimbursement',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeUpdate: async (reimbursement, options) => {
        if (reimbursement.is_locked && reimbursement.changed('is_locked') === false) {
          throw new Error('Cannot modify locked reimbursement record');
        }
      },
      beforeDestroy: async (reimbursement, options) => {
        if (reimbursement.is_locked) {
          throw new Error('Cannot delete locked reimbursement record');
        }
      }
    }
  });

  return Reimbursement;
};