const { Reimbursement, User, AttendancePeriod } = require('../db');

async function createReimbursement(reimbursementData) {
  // Check if attendance period exists and is not locked
  const attendancePeriod = await AttendancePeriod.findByPk(reimbursementData.attendancePeriodId);
  
  if (!attendancePeriod) {
    throw new Error('Attendance period not found');
  }
  
  if (attendancePeriod.isPayrollProcessed) {
    throw new Error('Cannot submit reimbursement for locked attendance period');
  }

  return Reimbursement.create({
    user_id: reimbursementData.userId,
    attendance_period_id: reimbursementData.attendancePeriodId,
    amount: reimbursementData.amount,
    description: reimbursementData.description,
    created_by: reimbursementData.createdBy,
    updated_by: reimbursementData.updatedBy
  });
}

module.exports = {
  createReimbursement
}; 