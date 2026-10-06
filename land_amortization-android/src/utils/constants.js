export const PAYMENT_TYPES = [
  'Monthly Amortization',
  'Penalty',
  'Amortization + Penalty',
  'Down Payment',
  'Other'
];

export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Check',
  'GCash',
  'Maya',
  'Other'
];

export const PENALTY_STATUSES = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  WAIVED: 'WAIVED'
};

export const ACCOUNT_STATUSES = {
  PAID: 'PAID',
  PENALTY: 'PENALTY - 2+ MISSED MONTHS',
  DP_OVERDUE: 'DOWN PAYMENT OVERDUE',
  OVERDUE: 'OVERDUE',
  ACTIVE: 'ACTIVE'
};

export const SCHEDULE_STATUSES = {
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  OVERDUE: 'OVERDUE',
  DUE: 'DUE'
};

export const INSTRUCTIONS = [
  "1. LAND ACCOUNTS: Enter one buyer/account per row and use a unique Account ID.",
  "2. Enter the start date, first due date, title number, land area, total contract amount, down payment, monthly amortization, and number of months.",
  "3. Enter the Agreed Down Payment Due date. If the down payment remains zero after that date, the tracker calculates a 1% penalty of the total contract amount.",
  "4. PAYMENTS: Record amortization payments in the Payments sheet. Select Payment Type = Monthly Amortization.",
  "5. ADVANCE PAYMENTS: Monthly amortization payments are allocated to the earliest unpaid scheduled months first. Example: ₱30,000 paid against a ₱10,000 monthly amortization can mark three scheduled months as PAID.",
  "6. MONTHLY SCHEDULE automatically shows amount applied, remaining advance, payment status, and consecutive missed months.",
  "7. When 2 or more consecutive monthly amortizations are overdue and unpaid, a 10% penalty is calculated on the delayed amortizations.",
  "8. Total Amount Due = Base Balance + Total Penalties.",
  "9. Avoid entering the same payment twice. Enter the down payment in Land Accounts and amortization payments in Payments.",
  "10. Penalty calculations are tracking rules based on your requested terms. Ensure the signed agreement contains the terms and have enforceability checked as appropriate under Philippine law."
];

export const PENALTY_RULES = [
  "1. Down payment penalty: 1% of total contract amount if the down payment is still unpaid after the agreed due date.",
  "2. 2+ consecutive missed months: 10% penalty on the delayed monthly amortizations.",
  "3. Advance payments are applied to the earliest unpaid months first.",
  "4. Total Amount Due = Base Balance + applicable penalties."
];
