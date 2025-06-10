'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Overtime extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Overtime belongs to User
      Overtime.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Overtime belongs to AttendancePeriod
      Overtime.belongsTo(models.AttendancePeriod, {
        foreignKey: 'attendance_period_id',
        as: 'attendancePeriod'
      });

      // Overtime belongs to User (created_by)
      Overtime.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });

      // Overtime belongs to User (updated_by)
      Overtime.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
      });
    }

    /**
     * Calculate overtime pay based on user's prorated daily salary
     */
    calculateOvertimePay(userMonthlySalary, workingDaysInMonth) {
      const dailySalary = userMonthlySalary / workingDaysInMonth;
      const hourlySalary = dailySalary / 8; // 8 hours per day
      return parseFloat(this.hours) * hourlySalary * 2; // Overtime is paid at 2x rate
    }

    /**
     * Check if overtime can be modified (not locked)
     */
    canBeModified() {
      return !this.is_locked;
    }
  }

  Overtime.init({
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
    overtime_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: true,
        isDate: true
      }
    },
    hours: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0.01],
          msg: 'Overtime hours must be greater than 0'
        },
        max: {
          args: [3.00],
          msg: 'Overtime cannot be more than 3 hours per day'
        },
        isDecimal: true
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
    modelName: 'Overtime',
    tableName: 'overtime',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeUpdate: async (overtime) => {
        if (overtime.is_locked && overtime.changed('is_locked') === false) {
          throw new Error('Cannot modify locked overtime record');
        }
      },
      beforeDestroy: async (overtime) => {
        if (overtime.is_locked) {
          throw new Error('Cannot delete locked overtime record');
        }
      }
    },
    validate: {
      // Ensure overtime is only submitted for valid dates within attendance period
      overtimeDateWithinPeriod() {
        if (this.overtime_date && this.AttendancePeriod) {
          const overtimeDate = new Date(this.overtime_date);
          const startDate = new Date(this.AttendancePeriod.start_date);
          const endDate = new Date(this.AttendancePeriod.end_date);
          
          if (overtimeDate < startDate || overtimeDate > endDate) {
            throw new Error('Overtime date must be within the attendance period');
          }
        }
      }
    }
  });

  return Overtime;
};