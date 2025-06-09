'use strict';

const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'employee'),
      allowNull: false,
      validate: {
        isIn: [['admin', 'employee']]
      }
    },
    monthlySalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'monthly_salary',
      validate: {
        min: 0
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active'
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.passwordHash = await bcrypt.hash(user.password, 10);
          delete user.password;
        }
      },
      beforeUpdate: async (user) => {
        if (user.password) {
          user.passwordHash = await bcrypt.hash(user.password, 10);
          delete user.password;
        }
      }
    }
  });

  User.associate = function(models) {
    // Self-referencing associations for audit fields
    User.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      constraints: false
    });
    
    User.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater',
      constraints: false
    });

    // Attendance associations
    User.hasMany(models.Attendance, {
      foreignKey: 'employeeId',
      as: 'attendanceRecords'
    });

    // Payslip associations
    User.hasMany(models.Payslip, {
      foreignKey: 'employeeId',
      as: 'payslips'
    });

    // Attendance period processing associations
    User.hasMany(models.AttendancePeriod, {
      foreignKey: 'payrollProcessedBy',
      as: 'processedPeriods'
    });
  };

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.passwordHash);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  };

  return User;
}; 