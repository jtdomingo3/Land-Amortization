import { ACCOUNT_STATUSES } from '../utils/constants.js';

/**
 * Computes all 14 KPI summary metrics matching the 'Dashboard' sheet.
 * 
 * @param {Array<Object>} accountsWithDerived - Accounts with derived fields already computed
 * @returns {Object} Dashboard metrics object
 */
export function computeDashboard(accountsWithDerived = []) {
  const totalAccounts = accountsWithDerived.length;

  let totalContractAmount = 0;
  let totalDownPayments = 0;
  let totalInstallmentsPaid = 0;
  let totalCollected = 0;
  let dpPenalties = 0;
  let tenPercentPenalties = 0;
  let totalPenalties = 0;
  let totalAmountDue = 0;
  let outstandingBalance = 0;

  let activeAccounts = 0;
  let overdueAccounts = 0;
  let twoPlusMissed = 0;
  let downPaymentsOverdue = 0;
  let paidAccounts = 0;
  let penaltyAccounts = 0;

  let penaltiesCollected = 0;
  let penaltiesBalance = 0;

  for (const acc of accountsWithDerived) {
    totalContractAmount += Number(acc.total_contract_amount) || 0;
    totalDownPayments += Number(acc.down_payment) || 0;
    totalInstallmentsPaid += Number(acc.installments_paid) || 0;
    totalCollected += Number(acc.total_paid) || 0;
    dpPenalties += Number(acc.dp_penalty) || 0;
    tenPercentPenalties += Number(acc.ten_percent_penalty) || 0;
    totalPenalties += Number(acc.total_penalties) || 0;
    penaltiesCollected += Number(acc.penalties_paid) || 0;
    penaltiesBalance += Number(acc.penalties_balance) || 0;
    totalAmountDue += Number(acc.total_amount_due) || 0;
    outstandingBalance += Number(acc.outstanding_balance) || 0;

    if (acc.status === ACCOUNT_STATUSES.ACTIVE) {
      activeAccounts++;
    } else if (acc.status === ACCOUNT_STATUSES.OVERDUE) {
      overdueAccounts++;
    } else if (acc.status === ACCOUNT_STATUSES.DP_OVERDUE) {
      downPaymentsOverdue++;
    } else if (acc.status === ACCOUNT_STATUSES.PAID) {
      paidAccounts++;
    } else if (acc.status === ACCOUNT_STATUSES.PENALTY) {
      penaltyAccounts++;
    }

    if ((Number(acc.consecutive_missed) || 0) >= 2) {
      twoPlusMissed++;
    }
  }

  const collectionRate = totalContractAmount > 0 
    ? ((totalCollected / totalContractAmount) * 100) 
    : 0;

  return {
    totalAccounts,
    totalContractAmount,
    totalDownPayments,
    totalInstallmentsPaid,
    totalCollected,
    dpPenalties,
    tenPercentPenalties,
    totalPenalties,
    penaltiesCollected,
    penaltiesBalance,
    totalAmountDue,
    outstandingBalance,
    activeAccounts,
    overdueAccounts,
    twoPlusMissed,
    downPaymentsOverdue,
    paidAccounts,
    penaltyAccounts,
    collectionRate: Math.min(100, Math.max(0, collectionRate))
  };
}
