import { computeAccountDerived } from './src/engine/calculations.js';

const account = {
  account_id: 2001,
  name: "Late Customer",
  date_of_start: "2026-01-15",
  first_due_date: "2026-02-15",
  total_contract_amount: 500000,
  down_payment: 50000,
  is_dp_paid: 1,
  monthly_amortization: 10000,
  num_of_months: 45
};

// As of 2026-03-20, exactly 2 months are missed: Month 1 (Feb 15) and Month 2 (Mar 15).
const todayAsOfMar20 = new Date("2026-03-20");

const before = computeAccountDerived(account, [], todayAsOfMar20);
console.log("=== SCENARIO 1: 2 MONTHS MISSED (Feb 15, Mar 15) ===");
console.log("Consecutive Missed:", before.consecutive_missed);
console.log("10% Penalty:", before.ten_percent_penalty);
console.log("Penalties Balance:", before.penalties_balance);
console.log("Status:", before.status);
console.log("Total Amount Due:", before.total_amount_due);

// On 2026-03-25, customer pays ONE regular monthly amortization (10,000) for Month 1:
const afterPayAmort = computeAccountDerived(account, [
  {
    payment_id: 1,
    account_id: 2001,
    payment_date: "2026-03-25",
    payment_type: "Monthly Amortization",
    amount_paid: 10000,
    month_covered: "February 2026",
    for_month_no: 1
  }
], todayAsOfMar20);

console.log("\n=== SCENARIO 2: AFTER PAYING 1 REGULAR MONTHLY AMORTIZATION ===");
console.log("Consecutive Missed in post-payment schedule:", afterPayAmort.consecutive_missed);
console.log("10% Penalty Incurred:", afterPayAmort.ten_percent_penalty);
console.log("Penalties Paid:", afterPayAmort.penalties_paid);
console.log("Penalties Balance (MUST NOT BE ZERO!):", afterPayAmort.penalties_balance);
console.log("Base Balance:", afterPayAmort.base_balance);
console.log("Status:", afterPayAmort.status);
console.log("Total Amount Due:", afterPayAmort.total_amount_due);

// Now customer pays the penalty (2,000) on 2026-03-26:
const afterPayPenalty = computeAccountDerived(account, [
  {
    payment_id: 1,
    account_id: 2001,
    payment_date: "2026-03-25",
    payment_type: "Monthly Amortization",
    amount_paid: 10000,
    month_covered: "February 2026",
    for_month_no: 1
  },
  {
    payment_id: 2,
    account_id: 2001,
    payment_date: "2026-03-26",
    payment_type: "Penalty",
    amount_paid: 2000,
    month_covered: "Late Penalty"
  }
], todayAsOfMar20);

console.log("\n=== SCENARIO 3: AFTER PAYING THE 2,000 PENALTY ===");
console.log("Penalties Paid:", afterPayPenalty.penalties_paid);
console.log("Penalties Balance (Now 0):", afterPayPenalty.penalties_balance);
console.log("Base Balance (remains 440,000):", afterPayPenalty.base_balance);
console.log("Status:", afterPayPenalty.status);
console.log("Total Amount Due:", afterPayPenalty.total_amount_due);

// Alternatively, customer pays Amortization + Penalty together (12,000):
const afterCombined = computeAccountDerived(account, [
  {
    payment_id: 3,
    account_id: 2001,
    payment_date: "2026-03-25",
    payment_type: "Amortization + Penalty",
    amount_paid: 12000,
    amortization_amount: 10000,
    penalty_amount: 2000,
    month_covered: "February 2026",
    for_month_no: 1
  }
], todayAsOfMar20);

console.log("\n=== SCENARIO 4: PAYING AMORTIZATION + PENALTY (12,000 TOTAL) ===");
console.log("Installments Paid:", afterCombined.installments_paid);
console.log("Penalties Paid:", afterCombined.penalties_paid);
console.log("Penalties Balance:", afterCombined.penalties_balance);
console.log("Base Balance:", afterCombined.base_balance);
console.log("Total Amount Due:", afterCombined.total_amount_due);
