'use strict';

module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    checkIn: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'check_in'
    },
    checkOut: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'check_out'
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'half_day'),
      allowNull: false,
      defaultValue: 'present',
      validate: {
        isIn: [['present', 'absent', 'late', 'half_day']]
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'attendance',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'attendance_period_id', 'date'],
        name: 'unique_employee_period_date'
      }
    ],
    hooks: {
      beforeSave: (attendance) => {
        // Auto-determine status based on check-in/check-out times
        if (attendance.status === 'present' && attendance.checkIn) {
          const checkInTime = new Date(`1970-01-01T${attendance.checkIn}`);
          const lateThreshold = new Date('1970-01-01T09:15:00'); // 9:15 AM
          
          if (checkInTime > lateThreshold) {
            attendance.status = 'late';
          }
        }
        
        // Set half_day status if only partial hours worked
        if (attendance.checkIn && attendance.checkOut) {
          const checkIn = new Date(`1970-01-01T${attendance.checkIn}`);
          const checkOut = new Date(`1970-01-01T${attendance.checkOut}`);
          const hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60);
          
          if (hoursWorked < 4 && attendance.status === 'present') {
            attendance.status = 'half_day';
          }
        }
      }
    }
  });

  Attendance.associate = function(models) {
    // Employee association
    Attendance.belongsTo(models.User, {
      foreignKey: 'employeeId',
      as: 'employee'
    });

    // Attendance period association
    Attendance.belongsTo(models.AttendancePeriod, {
      foreignKey: 'attendancePeriodId',
      as: 'attendancePeriod'
    });

    // User associations for audit fields
    Attendance.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    Attendance.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
  };

  return Attendance;
}; 