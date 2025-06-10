'use strict';

module.exports = (sequelize, DataTypes) => {
  const AttendancePeriod = sequelize.define('AttendancePeriod', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100]
      }
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date',
      validate: {
        isDate: true
      }
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date',
      validate: {
        isDate: true,
        isAfterStartDate(value) {
          if (value <= this.startDate) {
            throw new Error('End date must be after start date');
          }
        }
      }
    },
    isPayrollProcessed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_payroll_processed'
    },
    payrollProcessedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'payroll_processed_at'
    },
    payrollProcessedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'payroll_processed_by'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by'
    }
  }, {
    tableName: 'attendance_period',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (period) => {
        if (period.changed('isPayrollProcessed') && period.isPayrollProcessed) {
          period.payrollProcessedAt = new Date();
        }
      }
    }
  });

  AttendancePeriod.associate = function(models) {
    // User associations for audit fields
    AttendancePeriod.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    AttendancePeriod.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });

    AttendancePeriod.belongsTo(models.User, {
      foreignKey: 'payrollProcessedBy',
      as: 'processor'
    });

    // Attendance associations
    AttendancePeriod.hasMany(models.Attendance, {
      foreignKey: 'attendancePeriodId',
      as: 'attendanceRecords'
    });

    // Payslip associations
    AttendancePeriod.hasMany(models.Payslip, {
      foreignKey: 'attendancePeriodId',
      as: 'payslips'
    });

    // Overtime associations
    AttendancePeriod.hasMany(models.Overtime, {
      foreignKey: 'attendance_period_id',
      as: 'overtimeRecords'
    });

    // Reimbursement associations
    AttendancePeriod.hasMany(models.Reimbursement, {
      foreignKey: 'attendance_period_id',
      as: 'reimbursementRecords'
    });
  };

  // Instance methods
  AttendancePeriod.prototype.getTotalWorkingDays = function() {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    let workingDays = 0;
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      // Exclude weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }
    
    return workingDays;
  };

  return AttendancePeriod;
}; 