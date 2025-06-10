'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payslip', 'overtime_pay', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('payslip', 'total_overtime_hours', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('payslip', 'total_reimbursements', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('payslip', 'total_take_home', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('payslip', 'attendance_breakdown', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.addColumn('payslip', 'overtime_breakdown', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.addColumn('payslip', 'reimbursement_breakdown', {
      type: Sequelize.JSONB,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('payslip', 'overtime_pay');
    await queryInterface.removeColumn('payslip', 'total_overtime_hours');
    await queryInterface.removeColumn('payslip', 'total_reimbursements');
    await queryInterface.removeColumn('payslip', 'total_take_home');
    await queryInterface.removeColumn('payslip', 'attendance_breakdown');
    await queryInterface.removeColumn('payslip', 'overtime_breakdown');
    await queryInterface.removeColumn('payslip', 'reimbursement_breakdown');
  }
}; 