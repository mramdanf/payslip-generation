const db = require('../db');
const { User, AttendancePeriod, Attendance, Overtime, Reimbursement, Payslip, Payroll } = db;

class PayrollService {
  // Run payroll for an attendance period
  static async runPayroll(attendancePeriodId, processedBy) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Check if payroll already exists for this period
      const existingPayroll = await Payroll.findOne({
        where: { attendancePeriodId },
        transaction
      });
      
      if (existingPayroll) {
        throw new Error('Payroll has already been processed for this attendance period');
      }

      // Get attendance period details
      const attendancePeriod = await AttendancePeriod.findByPk(attendancePeriodId, {
        transaction
      });
      
      if (!attendancePeriod) {
        throw new Error('Attendance period not found');
      }

      // Get all employees (non-admin users)
      const employees = await User.findAll({
        where: { role: 'employee' },
        transaction
      });

      const payslips = [];
      let totalAmount = 0;

      // Generate payslip for each employee
      for (const employee of employees) {
        const payslipData = await this.generateEmployeePayslip(
          employee, 
          attendancePeriod, 
          processedBy,
          transaction
        );
        
        payslips.push(payslipData);
        totalAmount += parseFloat(payslipData.totalTakeHome || 0);
      }

      // Lock all attendance, overtime, and reimbursement records for this period
      await this.lockPeriodRecords(attendancePeriodId, transaction);

      // Create payroll record
      const payroll = await Payroll.create({
        attendancePeriodId,
        totalEmployees: employees.length,
        totalAmount,
        processedAt: new Date(),
        processedBy,
        createdBy: processedBy
      }, { transaction });

      await transaction.commit();
      
      return {
        payroll,
        payslips,
        summary: {
          totalEmployees: employees.length,
          totalAmount,
          processedAt: payroll.processedAt
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Generate payslip for a single employee
  static async generateEmployeePayslip(employee, attendancePeriod, processedBy, transaction) {
    // Calculate working days in the period
    const totalWorkingDays = this.calculateWorkingDays(
      attendancePeriod.startDate, 
      attendancePeriod.endDate
    );

    // Get employee attendance
    const attendanceRecords = await Attendance.findAll({
      where: {
        employeeId: employee.id,
        attendancePeriodId: attendancePeriod.id
      },
      transaction
    });

    const daysWorked = attendanceRecords.filter(record => 
      record.status === 'present' || record.status === 'late'
    ).length + (attendanceRecords.filter(record => 
      record.status === 'half_day'
    ).length * 0.5);

    // Calculate basic salary components  
    const basicSalary = parseFloat(employee.monthlySalary || 0);
    const dailySalary = basicSalary / totalWorkingDays;
    const grossSalary = dailySalary * daysWorked;

    // Get overtime records
    const overtimeRecords = await Overtime.findAll({
      where: {
        user_id: employee.id,
        attendance_period_id: attendancePeriod.id
      },
      transaction
    });

    const totalOvertimeHours = overtimeRecords.reduce((sum, record) => 
      sum + parseFloat(record.hours), 0
    );
    const hourlySalary = dailySalary / 8;
    const overtimePay = totalOvertimeHours * hourlySalary * 2;

    // Get reimbursement records
    const reimbursementRecords = await Reimbursement.findAll({
      where: {
        user_id: employee.id,
        attendance_period_id: attendancePeriod.id
      },
      transaction
    });

    const totalReimbursements = reimbursementRecords.reduce((sum, record) => 
      sum + parseFloat(record.amount), 0
    );

    // Calculate all values upfront
    const deductions = 0; // No deductions for now
    const netSalary = grossSalary - deductions;
    const totalTakeHome = grossSalary + overtimePay + totalReimbursements - deductions;

    // Generate payslip number
    const payslipNumber = this.generatePayslipNumber(employee.id, attendancePeriod.id);

    // Create payslip record with all calculated values
    const payslip = await Payslip.create({
      employeeId: employee.id,
      attendancePeriodId: attendancePeriod.id,
      payslipNumber,
      basicSalary,
      daysWorked,
      totalWorkingDays,
      grossSalary,
      deductions,
      netSalary,
      overtimePay,
      totalOvertimeHours,
      totalReimbursements,
      totalTakeHome,
      attendanceBreakdown: {
        totalDays: attendanceRecords.length,
        presentDays: attendanceRecords.filter(r => r.status === 'present').length,
        lateDays: attendanceRecords.filter(r => r.status === 'late').length,
        halfDays: attendanceRecords.filter(r => r.status === 'half_day').length
      },
      overtimeBreakdown: overtimeRecords.map(record => ({
        date: record.overtime_date,
        hours: record.hours
      })),
      reimbursementBreakdown: reimbursementRecords.map(record => ({
        amount: record.amount,
        description: record.description
      })),
      createdBy: processedBy
    }, { transaction });

    return payslip;
  }

  // Lock all records for the attendance period
  static async lockPeriodRecords(attendancePeriodId, transaction) {
    // Lock overtime records
    await Overtime.update(
      { is_locked: true },
      { 
        where: { attendance_period_id: attendancePeriodId },
        transaction 
      }
    );

    // Lock reimbursement records
    await Reimbursement.update(
      { is_locked: true },
      { 
        where: { attendance_period_id: attendancePeriodId },
        transaction 
      }
    );
  }

  // Calculate working days between two dates (excluding weekends)
  static calculateWorkingDays(startDate, endDate) {
    let count = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        count++;
      }
    }
    
    return count;
  }

  // Generate unique payslip number
  static generatePayslipNumber(employeeId, periodId) {
    const timestamp = Date.now().toString().slice(-6);
    const empId = employeeId.slice(-4);
    const perId = periodId.slice(-4);
    return `PAY-${empId}-${perId}-${timestamp}`;
  }

  // Get employee payslip for a specific attendance period
  static async getEmployeePayslip(employeeId, attendancePeriodId) {
    try {
      // First check if payroll has been processed for this period
      const payroll = await Payroll.findOne({
        where: { attendancePeriodId }
      });

      if (!payroll) {
        throw new Error('Payroll has not been processed for this attendance period yet');
      }

      // Get the payslip with all necessary associations
      const payslip = await Payslip.findOne({
        where: {
          employeeId,
          attendancePeriodId
        },
        include: [
          {
            model: User,
            as: 'employee',
            attributes: ['id', 'name', 'monthlySalary']
          },
          {
            model: AttendancePeriod,
            as: 'attendancePeriod',
            attributes: ['id', 'name', 'startDate', 'endDate']
          }
        ]
      });

      if (!payslip) {
        throw new Error('Payslip not found for this employee and attendance period');
      }

      // Format the response according to the requirements
      return {
        payslipInfo: {
          payslipNumber: payslip.payslipNumber,
          employeeName: payslip.employee.name,
          periodName: payslip.attendancePeriod.name,
          periodStartDate: payslip.attendancePeriod.startDate,
          periodEndDate: payslip.attendancePeriod.endDate,
          generatedAt: payslip.generatedAt || payslip.createdAt
        },
        salaryBreakdown: {
          basicSalary: parseFloat(payslip.basicSalary),
          totalWorkingDays: payslip.totalWorkingDays,
          daysWorked: payslip.daysWorked,
          grossSalary: parseFloat(payslip.grossSalary),
          deductions: parseFloat(payslip.deductions),
          netSalary: parseFloat(payslip.netSalary)
        },
        attendanceBreakdown: {
          summary: payslip.attendanceBreakdown,
          impact: {
            dailySalary: parseFloat(payslip.basicSalary) / payslip.totalWorkingDays,
            effectiveWorkingDays: payslip.daysWorked,
            salaryFromAttendance: parseFloat(payslip.grossSalary)
          }
        },
        overtimeBreakdown: {
          summary: {
            totalHours: parseFloat(payslip.totalOvertimeHours),
            hourlySalary: (parseFloat(payslip.basicSalary) / payslip.totalWorkingDays) / 8,
            overtimeMultiplier: 2,
            totalOvertimePay: parseFloat(payslip.overtimePay)
          },
          details: payslip.overtimeBreakdown || []
        },
        reimbursementBreakdown: {
          summary: {
            totalAmount: parseFloat(payslip.totalReimbursements),
            totalCount: (payslip.reimbursementBreakdown || []).length
          },
          details: payslip.reimbursementBreakdown || []
        },
        totalTakeHome: parseFloat(payslip.totalTakeHome),
        calculation: {
          grossSalary: parseFloat(payslip.grossSalary),
          overtimePay: parseFloat(payslip.overtimePay),
          reimbursements: parseFloat(payslip.totalReimbursements),
          deductions: parseFloat(payslip.deductions),
          totalTakeHome: parseFloat(payslip.totalTakeHome)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get summary of all employee payslips for an attendance period (admin only)
  static async getPayslipSummary(attendancePeriodId, requestedBy) {
    try {

      // Check if payroll has been processed for this period
      const payroll = await Payroll.findOne({
        where: { attendancePeriodId },
        include: [
          {
            model: AttendancePeriod,
            as: 'attendancePeriod',
            attributes: ['id', 'name', 'startDate', 'endDate']
          }
        ]
      });

      if (!payroll) {
        throw new Error('Payroll has not been processed for this attendance period yet');
      }

      // Get all payslips for this period
      const payslips = await Payslip.findAll({
        where: { attendancePeriodId },
        include: [
          {
            model: User,
            as: 'employee',
            attributes: ['id', 'name']
          }
        ],
        order: [['employee', 'name', 'ASC']]
      });

      // Calculate summary
      const totalTakeHomePay = payslips.reduce((sum, payslip) => 
        sum + parseFloat(payslip.totalTakeHome), 0
      );

      const employeeSummary = payslips.map(payslip => ({
        employeeId: payslip.employee.id,
        employeeName: payslip.employee.name,
        employeeEmail: payslip.employee.email,
        takeHomePay: parseFloat(payslip.totalTakeHome),
        grossSalary: parseFloat(payslip.grossSalary),
        overtimePay: parseFloat(payslip.overtimePay),
        reimbursements: parseFloat(payslip.totalReimbursements),
        deductions: parseFloat(payslip.deductions)
      }));

      return {
        periodInfo: {
          periodId: payroll.attendancePeriod.id,
          periodName: payroll.attendancePeriod.name,
          startDate: payroll.attendancePeriod.startDate,
          endDate: payroll.attendancePeriod.endDate,
          processedAt: payroll.processedAt,
          processedBy: payroll.processedBy
        },
        summary: {
          totalEmployees: payslips.length,
          totalTakeHomePay,
          averageTakeHomePay: totalTakeHomePay / payslips.length,
          totalGrossSalary: payslips.reduce((sum, p) => sum + parseFloat(p.grossSalary), 0),
          totalOvertimePay: payslips.reduce((sum, p) => sum + parseFloat(p.overtimePay), 0),
          totalReimbursements: payslips.reduce((sum, p) => sum + parseFloat(p.totalReimbursements), 0),
          totalDeductions: payslips.reduce((sum, p) => sum + parseFloat(p.deductions), 0)
        },
        employees: employeeSummary
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PayrollService; 