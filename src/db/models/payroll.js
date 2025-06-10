'use strict';

module.exports = (sequelize, DataTypes) => {
  const Payroll = sequelize.define('Payroll', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    attendancePeriodId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'attendance_period_id'
    },
    totalEmployees: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_employees',
      validate: {
        min: 0
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'total_amount',
      validate: {
        min: 0
      }
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'processed_at'
    },
    processedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'processed_by'
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
    tableName: 'payroll',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (payroll) => {
        if (!payroll.processedAt) {
          payroll.processedAt = new Date();
        }
      }
    }
  });

  Payroll.associate = function(models) {
    // Attendance period association
    Payroll.belongsTo(models.AttendancePeriod, {
      foreignKey: 'attendancePeriodId',
      as: 'attendancePeriod'
    });

    // User associations for audit fields
    Payroll.belongsTo(models.User, {
      foreignKey: 'processedBy',
      as: 'processor'
    });

    Payroll.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    Payroll.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });

    // Note: Payslips are linked through attendance period, not directly to payroll
  };

  // Instance methods
  Payroll.prototype.getPayrollSummary = async function() {
    const payslips = await sequelize.models.Payslip.findAll({
      where: { attendancePeriodId: this.attendancePeriodId },
      include: [{
        model: sequelize.models.User,
        as: 'employee',
        attributes: ['id', 'name', 'username']
      }]
    });

    return {
      payrollId: this.id,
      attendancePeriodId: this.attendancePeriodId,
      processedAt: this.processedAt,
      totalEmployees: this.totalEmployees,
      totalAmount: this.totalAmount,
      payslips: payslips.map(payslip => ({
        employeeId: payslip.employeeId,
        employeeName: payslip.employee?.name,
        takeHomePay: payslip.totalTakeHome
      }))
    };
  };

  return Payroll;
};