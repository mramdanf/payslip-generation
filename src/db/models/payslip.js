'use strict';

module.exports = (sequelize, DataTypes) => {
  const Payslip = sequelize.define('Payslip', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'employee_id'
    },
    attendancePeriodId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'attendance_period_id'
    },
    payslipNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'payslip_number'
    },
    basicSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'basic_salary',
      validate: {
        min: 0
      }
    },
    daysWorked: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'days_worked',
      validate: {
        min: 0
      }
    },
    totalWorkingDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_working_days',
      validate: {
        min: 1
      }
    },
    grossSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'gross_salary',
      validate: {
        min: 0
      }
    },
    deductions: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    netSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'net_salary',
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'generated', 'sent'),
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'generated', 'sent']]
      }
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'generated_at'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at'
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
    tableName: 'payslips',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'attendance_period_id'],
        name: 'unique_employee_period_payslip'
      }
    ],
    hooks: {
      beforeSave: (payslip) => {
        // Calculate gross salary based on days worked
        const dailySalary = payslip.basicSalary / payslip.totalWorkingDays;
        payslip.grossSalary = dailySalary * payslip.daysWorked;
        
        // Calculate net salary
        payslip.netSalary = payslip.grossSalary - payslip.deductions;
      },
      beforeUpdate: (payslip) => {
        // Set generated timestamp when status changes to generated
        if (payslip.changed('status') && payslip.status === 'generated') {
          payslip.generatedAt = new Date();
        }
        
        // Set sent timestamp when status changes to sent
        if (payslip.changed('status') && payslip.status === 'sent') {
          payslip.sentAt = new Date();
        }
      }
    }
  });

  Payslip.associate = function(models) {
    // Employee association
    Payslip.belongsTo(models.User, {
      foreignKey: 'employeeId',
      as: 'employee'
    });

    // Attendance period association
    Payslip.belongsTo(models.AttendancePeriod, {
      foreignKey: 'attendancePeriodId',
      as: 'attendancePeriod'
    });

    // User associations for audit fields
    Payslip.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    Payslip.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
  };

  // Static methods
  Payslip.generatePayslipNumber = function(employeeId, periodId) {
    const timestamp = Date.now().toString().slice(-6);
    const empId = employeeId.slice(-4);
    const perId = periodId.slice(-4);
    return `PAY-${empId}-${perId}-${timestamp}`;
  };

  // Instance methods
  Payslip.prototype.calculateSalary = function() {
    const dailySalary = this.basicSalary / this.totalWorkingDays;
    this.grossSalary = dailySalary * this.daysWorked;
    this.netSalary = this.grossSalary - this.deductions;
    return this;
  };

  Payslip.prototype.getAttendancePercentage = function() {
    return (this.daysWorked / this.totalWorkingDays) * 100;
  };

  return Payslip;
}; 