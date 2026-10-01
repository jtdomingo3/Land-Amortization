import { computeMonthlySchedule } from './waterfall.js';
import { daysDifference, isBeforeToday } from '../utils/dateUtils.js';
import { formatMonthCovered } from '../utils/formatters.js';
import { ACCOUNT_STATUSES, SCHEDULE_STATUSES } from '../utils/constants.js';

/**
 * Computes all 13 derived fields for a Land Account (columns L through W).
 * Exactly matches the Excel formulas in 'Land Accounts' sheet.
 * 
 * @param {Object} account - Raw account from database
 * @param {Array<Object>} payments - All payments for this account
 * @param {Date} [todayRef] - Current date reference
 * @returns {Object} Account with all computed fields attached
 */
export function computeAccountDerived(account, payments = [], todayRef = new Date()) {
  if (!account) return null;

  const totalContract = Number(account.total_contract_amount) || 0;
  const downPayment = Number(account.down_payment) || 0;
  const agreedDpDue = account.agreed_dp_due || '';

  // Filter payments for this account
  const accountPayments = payments.filter(
    p => String(p.account_id) === String(account.account_id)
  );

  const installmentPayments = accountPayments.filter(
    p => p.payment_type === 'Installment' || p.payment_type === undefined
  );
  const dpPayments = accountPayments.filter(
    p => p.payment_type === 'Down Payment'
  );
  const otherPayments = accountPayments.filter(
    p => p.payment_type === 'Other'
  );

  // Column L: Installments Paid
  const installmentsPaid = installmentPayments.reduce(
    (sum, p) => sum + (Number(p.amount_paid) || 0), 0
  );
  const dpFromPayments = dpPayments.reduce(
    (sum, p) => sum + (Number(p.amount_paid) || 0), 0
  );
  const otherPaid = otherPayments.reduce(
    (sum, p) => sum + (Number(p.amount_paid) || 0), 0
  );

  // Total Down Payment Paid (initial account record + any payments tagged as Down Payment)
  const totalDpPaid = downPayment + dpFromPayments;

  // Column M: Total Paid (all down payments + installments + other payments)
  const totalPaid = totalDpPaid + installmentsPaid + otherPaid;

  // Column N: Base Balance
  const baseBalance = Math.max(0, totalContract - totalPaid);

  // Column O: Down Payment Penalty (1% of Total Contract Amount)
  // Triggered when agreed DP date has lapsed and down payment remains unpaid
  let dpPenalty = 0;
  if (agreedDpDue && isBeforeToday(agreedDpDue, todayRef) && totalDpPaid <= 0) {
    dpPenalty = Math.round(totalContract * 0.01 * 100) / 100;
  }

  // Generate monthly schedule to get consecutive missed and next due date
  const schedule = computeMonthlySchedule(account, accountPayments, todayRef);

  // Column P: Consecutive Missed Months
  let consecutiveMissed = 0;
  for (const row of schedule) {
    if (row.consecutive_missed > consecutiveMissed) {
      consecutiveMissed = row.consecutive_missed;
    }
  }

  // Calculate total overdue unpaid amount for delayed months
  const overdueRows = schedule.filter(
    row => row.payment_status === SCHEDULE_STATUSES.OVERDUE || 
           (row.payment_status === SCHEDULE_STATUSES.PARTIAL && row.due_date && isBeforeToday(row.due_date, todayRef))
  );
  const delayedMonthsAmount = overdueRows.reduce(
    (sum, row) => sum + Math.max(0, row.expected_amortization - row.amount_applied), 0
  );

  // Column Q: 10% Penalty when 2+ consecutive months are missed
  // Customer rule: "10% sa delayed months" (10% of overdue installments)
  // Also calculate on base balance for comparison/alternative contracts
  const tenPercentDelayedPenalty = consecutiveMissed >= 2 ? Math.round(delayedMonthsAmount * 0.10 * 100) / 100 : 0;
  const tenPercentBalancePenalty = consecutiveMissed >= 2 ? Math.round(baseBalance * 0.10 * 100) / 100 : 0;

  // Default to customer's requested rule (10% on delayed months), unless contract specifies 'balance'
  const penaltyRule = account.penalty_basis === 'balance' ? 'balance' : 'delayed_months';
  const tenPercentPenalty = penaltyRule === 'balance' ? tenPercentBalancePenalty : tenPercentDelayedPenalty;

  // Column R: Total Penalties
  const totalPenalties = dpPenalty + tenPercentPenalty;

  // Column S: Total Amount Due
  const totalAmountDue = baseBalance + totalPenalties;

  // Column T: Outstanding Balance
  // Excel: = Total Amount Due
  const outstandingBalance = totalAmountDue;

  // Column U: Next Due Date
  // Excel: MINIFS('Monthly Schedule'!$D:$D, 'Monthly Schedule'!$A:$A, A2, 'Monthly Schedule'!$H:$H, "<>PAID")
  let nextDueDate = '';
  for (const row of schedule) {
    if (row.payment_status !== SCHEDULE_STATUSES.PAID && row.due_date) {
      nextDueDate = row.due_date;
      break;
    }
  }

  // Column V: Days Overdue
  // Excel: IF(OR(A2="", U2="", T2<=0), "", MAX(0, TODAY() - U2))
  let daysOverdue = 0;
  if (nextDueDate && outstandingBalance > 0) {
    const diff = daysDifference(todayRef, nextDueDate);
    daysOverdue = Math.max(0, diff);
  }

  // Column W: Status
  // Excel Priority:
  // 1. IF(T2<=0, "PAID")
  // 2. IF(P2>=2, "PENALTY - 2+ MISSED MONTHS")
  // 3. IF(AND(I2<>"", TODAY()>I2, H2<=0), "DOWN PAYMENT OVERDUE")
  // 4. IF(V2>0, "OVERDUE")
  // 5. ELSE "ACTIVE"
  let status = ACCOUNT_STATUSES.ACTIVE;
  if (outstandingBalance <= 0) {
    status = ACCOUNT_STATUSES.PAID;
  } else if (consecutiveMissed >= 2) {
    status = ACCOUNT_STATUSES.PENALTY;
  } else if (agreedDpDue && isBeforeToday(agreedDpDue, todayRef) && totalDpPaid <= 0) {
    status = ACCOUNT_STATUSES.DP_OVERDUE;
  } else if (daysOverdue > 0) {
    status = ACCOUNT_STATUSES.OVERDUE;
  } else {
    status = ACCOUNT_STATUSES.ACTIVE;
  }

  return {
    ...account,
    total_dp_paid: totalDpPaid,
    installments_paid: installmentsPaid,
    total_paid: totalPaid,
    base_balance: baseBalance,
    dp_penalty: dpPenalty,
    consecutive_missed: consecutiveMissed,
    delayed_months_amount: delayedMonthsAmount,
    ten_percent_delayed_penalty: tenPercentDelayedPenalty,
    ten_percent_balance_penalty: tenPercentBalancePenalty,
    ten_percent_penalty: tenPercentPenalty,
    total_penalties: totalPenalties,
    total_amount_due: totalAmountDue,
    outstanding_balance: outstandingBalance,
    next_due_date: nextDueDate,
    days_overdue: daysOverdue,
    status: status,
    schedule: schedule // cached for views
  };
}

/**
 * Computes derived fields for a Payment record
 * @param {Object} payment 
 * @param {Object} account 
 * @returns {Object}
 */
export function computePaymentDerived(payment, account) {
  return {
    ...payment,
    name: account?.name || '',
    due_date: account?.first_due_date || '',
    month_covered: formatMonthCovered(payment.payment_date)
  };
}
