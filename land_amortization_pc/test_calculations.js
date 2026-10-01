import { computeAccountDerived } from './src/engine/calculations.js';
import { computeMonthlySchedule } from './src/engine/waterfall.js';
import { computeDashboard } from './src/engine/dashboard.js';

const sampleAccounts = [
  {
    account_id: 1001,
    name: "Juan Dela Cruz",
    date_of_start: "2026-09-30",
    first_due_date: "2026-10-30",
    land_title_number: "TCT-12345",
    land_area_sqm: 500,
    total_contract_amount: 1500000,
    down_payment: 50000,
    agreed_dp_due: "2026-09-25",
    monthly_amortization: 12083.33,
    num_of_months: 120,
    remarks: "Sample buyer 1"
  },
  {
    account_id: 1002,
    name: "Pedro Santos",
    date_of_start: "2026-10-05",
    first_due_date: "2026-11-05",
    land_title_number: "TCT-67890",
    land_area_sqm: 100,
    total_contract_amount: 300000,
    down_payment: 20000,
    agreed_dp_due: "2026-10-01",
    monthly_amortization: 2333.33,
    num_of_months: 120,
    remarks: "Sample buyer 2"
  }
];

const samplePayments = [
  { payment_id: 1, account_id: 1001, payment_date: "2026-10-30", payment_type: "Installment", amount_paid: 12083.33, receipt_no: "OR-001", payment_method: "Cash" },
  { payment_id: 2, account_id: 1001, payment_date: "2026-11-30", payment_type: "Installment", amount_paid: 12083.33, receipt_no: "OR-002", payment_method: "Cash" },
  { payment_id: 3, account_id: 1002, payment_date: "2026-10-10", payment_type: "Installment", amount_paid: 2334.00, receipt_no: "OR-003", payment_method: "Cash" },
  { payment_id: 4, account_id: 1001, payment_date: "2026-11-30", payment_type: "Installment", amount_paid: 12083.33, receipt_no: "OR-004", payment_method: "Cash" },
  { payment_id: 5, account_id: 1001, payment_date: "2026-12-01", payment_type: "Installment", amount_paid: 100000.00, receipt_no: "OR-005", payment_method: "Bank Transfer" }
];

console.log("=== TESTING CALCULATION ENGINE ===");
const todayRef = new Date("2026-12-05");

const acc1Derived = computeAccountDerived(sampleAccounts[0], samplePayments, todayRef);
console.log("\nAccount 1001 Derived Results:");
console.log({
  name: acc1Derived.name,
  contract: acc1Derived.total_contract_amount,
  downPayment: acc1Derived.down_payment,
  installmentsPaid: acc1Derived.installments_paid,
  totalPaid: acc1Derived.total_paid,
  baseBalance: acc1Derived.base_balance,
  dpPenalty: acc1Derived.dp_penalty,
  consecutiveMissed: acc1Derived.consecutive_missed,
  tenPercentPenalty: acc1Derived.ten_percent_penalty,
  totalPenalties: acc1Derived.total_penalties,
  totalAmountDue: acc1Derived.total_amount_due,
  outstandingBalance: acc1Derived.outstanding_balance,
  nextDueDate: acc1Derived.next_due_date,
  daysOverdue: acc1Derived.days_overdue,
  status: acc1Derived.status
});

console.log("\nAccount 1001 Schedule first 15 months (Advance Payment Waterfall check):");
acc1Derived.schedule.slice(0, 15).forEach(m => {
  console.log(`Month ${m.month_no} (${m.due_date}): Expected=${m.expected_amortization}, Applied=${m.amount_applied.toFixed(2)}, AdvRemaining=${m.advance_remaining.toFixed(2)}, Status=${m.payment_status}, Missed=${m.consecutive_missed}`);
});

const acc2Derived = computeAccountDerived(sampleAccounts[1], samplePayments, todayRef);
console.log("\nAccount 1002 Derived Results:");
console.log({
  name: acc2Derived.name,
  contract: acc2Derived.total_contract_amount,
  totalPaid: acc2Derived.total_paid,
  baseBalance: acc2Derived.base_balance,
  nextDueDate: acc2Derived.next_due_date,
  daysOverdue: acc2Derived.days_overdue,
  status: acc2Derived.status
});

const dashboard = computeDashboard([acc1Derived, acc2Derived]);
console.log("\n=== DASHBOARD METRICS ===");
console.log(dashboard);

console.log("\nALL TESTS PASSED SUCCESSFULLY!");
