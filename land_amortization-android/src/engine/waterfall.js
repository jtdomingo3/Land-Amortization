import { addMonthsEdate, isBeforeToday } from '../utils/dateUtils.js';
import { SCHEDULE_STATUSES } from '../utils/constants.js';

/**
 * Computes the Monthly Schedule for a single Land Account using the Advance Payment Waterfall algorithm.
 * Exactly matches the Excel formulas in 'Monthly Schedule' sheet (columns A-J).
 * 
 * @param {Object} account - Land account object
 * @param {Array} payments - Array of all payment objects for this account
 * @param {Date} [todayRef] - Current date reference
 * @returns {Array<Object>} Array of monthly schedule rows (1 to numOfMonths)
 */
export function computeMonthlySchedule(account, payments = [], todayRef = new Date()) {
  if (!account || !account.account_id) return [];

  // Filter installment payments for this account
  const installmentPayments = payments.filter(
    p => String(p.account_id) === String(account.account_id) && 
         (p.payment_type === 'Installment' || p.payment_type === undefined)
  );

  const totalInstallmentsPaid = installmentPayments.reduce(
    (sum, p) => sum + (Number(p.amount_paid) || 0), 0
  );

  const numOfMonths = Number(account.num_of_months) || 120;
  const monthlyExpected = Number(account.monthly_amortization) || 0;
  const firstDueDate = account.first_due_date;

  const schedule = [];
  let cumulativeExpectedPrior = 0;
  let runningConsecutiveMissed = 0;

  for (let monthNo = 1; monthNo <= numOfMonths; monthNo++) {
    const dueDate = firstDueDate ? addMonthsEdate(firstDueDate, monthNo - 1) : '';
    const expectedAmortization = monthlyExpected;

    // Excel: F = MAX(0, MIN(expected, totalInstallments - priorCumulativeExpected))
    const availableForThisMonth = totalInstallmentsPaid - cumulativeExpectedPrior;
    const amountApplied = Math.max(0, Math.min(expectedAmortization, availableForThisMonth));

    // Excel: G = MAX(0, totalInstallments - (priorCumulativeExpected + expected))
    const cumulativeExpectedCurrent = cumulativeExpectedPrior + expectedAmortization;
    const advanceRemaining = Math.max(0, totalInstallmentsPaid - cumulativeExpectedCurrent);

    // Payment Status:
    // Excel: IF(F >= E, "PAID", IF(AND(F > 0, F < E), "PARTIAL", IF(D < TODAY(), "OVERDUE", "DUE")))
    let paymentStatus = SCHEDULE_STATUSES.DUE;
    if (expectedAmortization > 0 && amountApplied >= expectedAmortization) {
      paymentStatus = SCHEDULE_STATUSES.PAID;
    } else if (amountApplied > 0 && amountApplied < expectedAmortization) {
      paymentStatus = SCHEDULE_STATUSES.PARTIAL;
    } else if (dueDate && isBeforeToday(dueDate, todayRef)) {
      paymentStatus = SCHEDULE_STATUSES.OVERDUE;
    } else {
      paymentStatus = SCHEDULE_STATUSES.DUE;
    }

    // Remarks:
    // Excel: IF(G > 0, "Advance payment covers future installment(s)", "")
    let remarks = '';
    if (advanceRemaining > 0) {
      remarks = 'Advance payment covers future installment(s)';
    }

    // Consecutive Missed Months:
    // Excel: IF(H="PAID", 0, IF(H="OVERDUE", prev + 1, 0))
    if (paymentStatus === SCHEDULE_STATUSES.PAID) {
      runningConsecutiveMissed = 0;
    } else if (paymentStatus === SCHEDULE_STATUSES.OVERDUE) {
      runningConsecutiveMissed += 1;
    } else {
      runningConsecutiveMissed = 0;
    }

    schedule.push({
      account_id: account.account_id,
      name: account.name || '',
      month_no: monthNo,
      due_date: dueDate,
      expected_amortization: expectedAmortization,
      amount_applied: amountApplied,
      advance_remaining: advanceRemaining,
      payment_status: paymentStatus,
      remarks: remarks,
      consecutive_missed: runningConsecutiveMissed
    });

    cumulativeExpectedPrior = cumulativeExpectedCurrent;
  }

  return schedule;
}
