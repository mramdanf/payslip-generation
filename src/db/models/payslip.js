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
    overtimePay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'overtime_pay',
      validate: {
        min: 0
      }
    },
    totalOvertimeHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_overtime_hours',
      validate: {
        min: 0
      }
    },
    totalReimbursements: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_reimbursements',
      validate: {
        min: 0
      }
    },
    totalTakeHome: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_take_home',
      validate: {
        min: 0
      }
    },
    attendanceBreakdown: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'attendance_breakdown'
    },
    overtimeBreakdown: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'overtime_breakdown'
    },
    reimbursementBreakdown: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'reimbursement_breakdown'
    },
    status: {
      type: DataTypes.ENUM('draft', 'generated', 'sent'),
      allowNull: false,
      defaultValue: 'generated',
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
    tableName: 'payslip',
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
        // Only recalculate if values are missing (for backward compatibility)
        if (!payslip.grossSalary && payslip.basicSalary && payslip.totalWorkingDays) {
          const dailySalary = parseFloat(payslip.basicSalary) / parseInt(payslip.totalWorkingDays);
          payslip.grossSalary = dailySalary * parseFloat(payslip.daysWorked || 0);
        }
        
        if (!payslip.netSalary && payslip.grossSalary !== undefined) {
          payslip.netSalary = parseFloat(payslip.grossSalary) - parseFloat(payslip.deductions || 0);
        }
        
        if (!payslip.totalTakeHome && payslip.grossSalary !== undefined) {
          payslip.totalTakeHome = parseFloat(payslip.grossSalary) + 
            parseFloat(payslip.overtimePay || 0) + 
            parseFloat(payslip.totalReimbursements || 0) - 
            parseFloat(payslip.deductions || 0);
        }
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