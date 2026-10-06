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
         (p.payment_type === 'Installment' || 
          p.payment_type === 'Monthly Amortization' || 
          p.payment_type === 'Amortization + Penalty' || 
          p.payment_type === undefined)
  );

  const numOfMonths = Number(account.num_of_months) || 120;
  const monthlyExpected = Number(account.monthly_amortization) || 0;
  const firstDueDate = account.first_due_date;

  // Separate targeted payments from general pool payments
  const targetedByMonth = {};
  let generalPool = 0;

  for (const p of installmentPayments) {
    let amortPaid = 0;
    if (p.payment_type === 'Amortization + Penalty') {
      const aPortion = Number(p.amortization_amount);
      const total = Number(p.amount_paid) || 0;
      const pPortion = Number(p.penalty_amount) || 0;
      amortPaid = !isNaN(aPortion) && aPortion > 0 ? aPortion : Math.max(0, total - pPortion);
    } else {
      amortPaid = Number(p.amount_paid) || 0;
    }

    const mNo = Number(p.for_month_no);
    if (mNo && mNo >= 1 && mNo <= numOfMonths) {
      targetedByMonth[mNo] = (targetedByMonth[mNo] || 0) + amortPaid;
    } else {
      generalPool += amortPaid;
    }
  }

  const schedule = [];
  let remainingGeneralPool = generalPool;
  let runningConsecutiveMissed = 0;

  for (let monthNo = 1; monthNo <= numOfMonths; monthNo++) {
    const dueDate = firstDueDate ? addMonthsEdate(firstDueDate, monthNo - 1) : '';
    const expectedAmortization = monthlyExpected;

    // Apply targeted payment if any, plus waterfall advance from general pool
    const targetedForMonth = targetedByMonth[monthNo] || 0;
    const neededFromGeneral = Math.max(0, expectedAmortization - targetedForMonth);
    const fromGeneral = Math.max(0, Math.min(neededFromGeneral, remainingGeneralPool));
    remainingGeneralPool -= fromGeneral;

    // Total applied for this month (capped at expected amortization)
    const amountApplied = Math.min(expectedAmortization, targetedForMonth + fromGeneral);

    // Any excess targeted amount spills over to general pool
    if (targetedForMonth > expectedAmortization) {
      remainingGeneralPool += (targetedForMonth - expectedAmortization);
    }

    const advanceRemaining = Math.max(0, remainingGeneralPool);

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
  }

  return schedule;
}
