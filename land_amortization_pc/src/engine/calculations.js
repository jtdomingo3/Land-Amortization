import { computeMonthlySchedule } from './waterfall.js';
import { daysDifference, isBeforeToday } from '../utils/dateUtils.js';
import { formatMonthCovered } from '../utils/formatters.js';
import { ACCOUNT_STATUSES, SCHEDULE_STATUSES } from '../utils/constants.js';

/**
 * Computes all derived fields for a Land Account (columns L through W).
 * Accurately tracks principal, schedule waterfall, and persistent penalties.
 * 
 * @param {Object} account - Raw account from database
 * @param {Array<Object>} payments - All payments for this account
 * @param {Date} [todayRef] - Current date reference
 * @param {Array<Object>} [penalties] - Persisted penalties records for this account
 * @returns {Object} Account with all computed fields attached
 */
export function computeAccountDerived(account, payments = [], todayRef = new Date(), penalties = []) {
  if (!account) return null;

  const totalContract = Number(account.total_contract_amount) || 0;
  const downPayment = Number(account.down_payment) || 0;
  const agreedDpDue = account.agreed_dp_due || '';

  // Filter payments for this account
  const accountPayments = payments.filter(
    p => String(p.account_id) === String(account.account_id)
  );

  const installmentPayments = accountPayments.filter(
    p => p.payment_type === 'Installment' || 
         p.payment_type === 'Monthly Amortization' || 
         p.payment_type === 'Amortization + Penalty' || 
         p.payment_type === undefined
  );
  const dpPayments = accountPayments.filter(
    p => p.payment_type === 'Down Payment'
  );
  const otherPayments = accountPayments.filter(
    p => p.payment_type === 'Other'
  );

  // Column L: Installments Paid (applied to principal contract)
  const installmentsPaid = installmentPayments.reduce((sum, p) => {
    if (p.payment_type === 'Amortization + Penalty') {
      const aPortion = Number(p.amortization_amount);
      const total = Number(p.amount_paid) || 0;
      const pPortion = Number(p.penalty_amount) || 0;
      return sum + (!isNaN(aPortion) && aPortion > 0 ? aPortion : Math.max(0, total - pPortion));
    }
    return sum + (Number(p.amount_paid) || 0);
  }, 0);

  // Total Down Payment Paid
  const dpFromPayments = dpPayments.reduce(
    (sum, p) => sum + (Number(p.amount_paid) || 0), 0
  );
  const otherPaid = otherPayments.reduce(
    (sum, p) => sum + (Number(p.amount_paid) || 0), 0
  );

  const isDpPaidFlag = account.is_dp_paid === 1 || account.is_dp_paid === true || (account.is_dp_paid === undefined && downPayment > 0 && dpPayments.length === 0);
  const totalDpPaid = dpPayments.length > 0
    ? dpFromPayments
    : (isDpPaidFlag ? downPayment : 0);

  const isDpFullyPaid = downPayment <= 0 || totalDpPaid >= downPayment;

  // Penalties Paid by Customer
  const penaltiesPaid = accountPayments.reduce((sum, p) => {
    if (p.payment_type === 'Penalty') {
      return sum + (Number(p.amount_paid) || 0);
    }
    if (p.payment_type === 'Amortization + Penalty') {
      const pPortion = Number(p.penalty_amount);
      if (!isNaN(pPortion) && pPortion > 0) return sum + pPortion;
    }
    return sum + (Number(p.penalty_amount) || 0);
  }, 0);

  // Total collected from buyer (principal + penalties)
  const totalCollected = totalDpPaid + installmentsPaid + otherPaid + penaltiesPaid;
  // Principal paid towards the land contract
  const totalPrincipalPaid = totalDpPaid + installmentsPaid + otherPaid;

  // Column N: Base Balance (Principal remaining on contract)
  const baseBalance = Math.max(0, totalContract - totalPrincipalPaid);

  // Filter persisted penalties for this account
  const accountPenalties = penalties.filter(
    pen => String(pen.account_id) === String(account.account_id)
  );

  // Column O: Down Payment Penalty (1% of Total Contract Amount)
  // Triggered when agreed DP date has lapsed and down payment was not paid on or before that due date
  let dpPenalty = 0;
  const savedDpPenalty = accountPenalties.find(
    pen => (pen.penalty_type === '1% DP Penalty' || pen.month_covered === 'Down Payment') && pen.status !== 'WAIVED'
  );

  if (savedDpPenalty) {
    dpPenalty = Number(savedDpPenalty.amount) || 0;
  } else if (!isDpFullyPaid && agreedDpDue && isBeforeToday(agreedDpDue, todayRef) && downPayment > 0) {
    // Was DP paid on time?
    const onTimeDp = dpPayments.filter(p => !isBeforeToday(agreedDpDue, p.payment_date));
    const onTimePaid = onTimeDp.reduce((s, p) => s + (Number(p.amount_paid) || 0), 0);
    if (onTimePaid < downPayment) {
      dpPenalty = Math.round(totalContract * 0.01 * 100) / 100;
    }
  }

  // Generate monthly schedule to get consecutive missed and next due date
  const schedule = computeMonthlySchedule(account, accountPayments, todayRef);

  // Current Consecutive Missed Months in schedule
  let consecutiveMissed = 0;
  for (const row of schedule) {
    if (row.consecutive_missed > consecutiveMissed) {
      consecutiveMissed = row.consecutive_missed;
    }
  }

  // Calculate current overdue unpaid amount for delayed months
  const overdueRows = schedule.filter(
    row => row.payment_status === SCHEDULE_STATUSES.OVERDUE || 
           (row.payment_status === SCHEDULE_STATUSES.PARTIAL && row.due_date && isBeforeToday(row.due_date, todayRef))
  );
  const delayedMonthsAmount = overdueRows.reduce(
    (sum, row) => sum + Math.max(0, row.expected_amortization - row.amount_applied), 0
  );

  // Column Q: 10% Late Payment Penalty
  // Check if persisted 10% penalty records exist
  const savedLatePenalties = accountPenalties.filter(
    pen => pen.penalty_type === '10% Late Penalty' && pen.status !== 'WAIVED'
  );
  const savedLatePenaltyAmount = savedLatePenalties.reduce(
    (sum, pen) => sum + (Number(pen.amount) || 0), 0
  );

  // Compute currently overdue penalty
  const currentOverdueTenPercent = consecutiveMissed >= 2
    ? (account.penalty_basis === 'balance'
        ? Math.round(baseBalance * 0.10 * 100) / 100
        : Math.round(delayedMonthsAmount * 0.10 * 100) / 100)
    : 0;

  // Chronological check for 2+ consecutive missed streaks:
  const { lateMonthsCount, penaltyAmount: chronologicalLatePenalty } = computeLatePenaltyMonths(
    schedule,
    installmentPayments,
    Number(account.monthly_amortization) || 0,
    todayRef
  );

  const chronologicalPenaltyAmount = (account.penalty_basis === 'balance' && lateMonthsCount >= 2)
    ? Math.round(baseBalance * 0.10 * 100) / 100
    : chronologicalLatePenalty;

  // The 10% penalty incurred is the maximum of saved penalty records, current overdue penalty, and chronological streak penalty
  const tenPercentPenaltyIncurred = Math.max(
    savedLatePenaltyAmount,
    currentOverdueTenPercent,
    chronologicalPenaltyAmount
  );

  // Manual / Other penalties from penalties table
  const savedOtherPenalties = accountPenalties.filter(
    pen => pen.penalty_type !== '10% Late Penalty' && pen.penalty_type !== '1% DP Penalty' && pen.status !== 'WAIVED'
  );
  const otherPenaltiesAmount = savedOtherPenalties.reduce(
    (sum, pen) => sum + (Number(pen.amount) || 0), 0
  );

  // Total Penalties Incurred across all types
  const totalPenaltiesIncurred = dpPenalty + tenPercentPenaltyIncurred + otherPenaltiesAmount;

  // Outstanding Penalties Balance (Total Incurred minus Penalties Paid)
  const outstandingPenalties = Math.max(0, Math.round((totalPenaltiesIncurred - penaltiesPaid) * 100) / 100);

  // Column R: Total Penalties Due (the remaining unpaid penalty balance)
  const totalPenalties = outstandingPenalties;

  // Column S & T: Total Amount Due & Outstanding Balance
  const totalAmountDue = baseBalance + totalPenalties;
  const outstandingBalance = totalAmountDue;

  // Column U: Next Due Date
  let nextDueDate = '';
  for (const row of schedule) {
    if (row.payment_status !== SCHEDULE_STATUSES.PAID && row.due_date) {
      nextDueDate = row.due_date;
      break;
    }
  }

  // Column V: Days Overdue
  let daysOverdue = 0;
  if (nextDueDate && outstandingBalance > 0) {
    const diff = daysDifference(todayRef, nextDueDate);
    daysOverdue = Math.max(0, diff);
  }

  // Column W: Status
  let status = ACCOUNT_STATUSES.ACTIVE;
  if (outstandingBalance <= 0) {
    status = ACCOUNT_STATUSES.PAID;
  } else if (outstandingPenalties > 0 || consecutiveMissed >= 2) {
    status = ACCOUNT_STATUSES.PENALTY;
  } else if (agreedDpDue && isBeforeToday(agreedDpDue, todayRef) && totalDpPaid <= 0 && downPayment > 0) {
    status = ACCOUNT_STATUSES.DP_OVERDUE;
  } else if (daysOverdue > 0) {
    status = ACCOUNT_STATUSES.OVERDUE;
  } else {
    status = ACCOUNT_STATUSES.ACTIVE;
  }

  return {
    ...account,
    is_dp_paid: isDpFullyPaid ? 1 : 0,
    total_dp_paid: totalDpPaid,
    installments_paid: installmentsPaid,
    total_paid: totalCollected,
    total_principal_paid: totalPrincipalPaid,
    base_balance: baseBalance,
    dp_penalty: dpPenalty,
    consecutive_missed: consecutiveMissed,
    delayed_months_amount: delayedMonthsAmount,
    ten_percent_penalty: tenPercentPenaltyIncurred,
    total_penalties_incurred: totalPenaltiesIncurred,
    penalties_paid: penaltiesPaid,
    penalties_balance: outstandingPenalties,
    total_penalties: totalPenalties,
    total_amount_due: totalAmountDue,
    outstanding_balance: outstandingBalance,
    next_due_date: nextDueDate,
    days_overdue: daysOverdue,
    status: status,
    schedule: schedule
  };
}

/**
 * Computes derived fields for a Payment record
 * @param {Object} payment 
 * @param {Object} account 
 * @returns {Object}
 */
export function computePaymentDerived(payment, account) {
  let monthCovered = payment.month_covered;
  if (!monthCovered) {
    if (payment.payment_type === 'Down Payment') {
      monthCovered = 'Down Payment';
    } else {
      monthCovered = formatMonthCovered(payment.payment_date);
    }
  }

  return {
    ...payment,
    name: account?.name || '',
    due_date: account?.first_due_date || '',
    month_covered: monthCovered
  };
}

/**
 * Computes all months that were part of a 2+ consecutive missed streak.
 * Guarantees that late penalties incurred for missed installments do not vanish when paid later.
 */
function computeLatePenaltyMonths(schedule, installmentPayments, monthlyExpected, todayRef) {
  if (monthlyExpected <= 0 || !schedule || schedule.length === 0) {
    return { lateMonthsCount: 0, penaltyAmount: 0 };
  }

  // Chronologically sort installment payments
  const sortedPayments = [...installmentPayments].sort((a, b) => 
    new Date(a.payment_date) - new Date(b.payment_date)
  );

  // Map month number -> date when that month was fully satisfied
  const paidAtDates = {};
  let runningAmort = 0;
  let payIdx = 0;

  for (let m = 1; m <= schedule.length; m++) {
    const needed = m * monthlyExpected;
    while (runningAmort < needed - 0.01 && payIdx < sortedPayments.length) {
      const p = sortedPayments[payIdx++];
      let amt = 0;
      if (p.payment_type === 'Amortization + Penalty') {
        const aPortion = Number(p.amortization_amount);
        const total = Number(p.amount_paid) || 0;
        const pPortion = Number(p.penalty_amount) || 0;
        amt = !isNaN(aPortion) && aPortion > 0 ? aPortion : Math.max(0, total - pPortion);
      } else {
        amt = Number(p.amount_paid) || 0;
      }
      runningAmort += amt;
      if (runningAmort >= needed - 0.01) {
        paidAtDates[m] = p.payment_date;
        break;
      }
    }
    if (runningAmort < needed - 0.01) {
      paidAtDates[m] = null; // Unpaid
    }
  }

  const penalizedMonths = new Set();

  for (let m = 2; m <= schedule.length; m++) {
    const rowM = schedule[m - 1];
    if (!rowM || !rowM.due_date || !isBeforeToday(rowM.due_date, todayRef)) {
      continue;
    }

    const dueDateM = rowM.due_date;
    const prevPaidDate = paidAtDates[m - 1];
    const currPaidDate = paidAtDates[m];

    // Was month m-1 unpaid when month m reached due date?
    const prevUnpaidAtDueDateM = (!prevPaidDate || isBeforeToday(dueDateM, prevPaidDate));

    // Was month m unpaid when month m reached due date?
    const currUnpaidAtDueDateM = (!currPaidDate || !isBeforeToday(currPaidDate, dueDateM));

    if (prevUnpaidAtDueDateM && currUnpaidAtDueDateM) {
      penalizedMonths.add(m - 1);
      penalizedMonths.add(m);
    }
  }

  return {
    lateMonthsCount: penalizedMonths.size,
    penaltyAmount: Math.round(penalizedMonths.size * monthlyExpected * 0.10 * 100) / 100
  };
}
