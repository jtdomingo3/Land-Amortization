import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeAccountDerived } from '../src/engine/calculations.js';

describe('Engine Calculations Suite (Android)', () => {
  const baseAccount = {
    account_id: 3001,
    name: 'Test Buyer',
    date_of_start: '2026-01-01',
    first_due_date: '2026-02-01',
    land_title_number: 'TCT-99999',
    land_area_sqm: 200,
    total_contract_amount: 1000000,
    down_payment: 100000,
    agreed_dp_due: '2026-01-15',
    is_dp_paid: 1,
    monthly_amortization: 10000,
    num_of_months: 90,
    remarks: 'Test Buyer Account'
  };

  it('should compute base balance as Total Contract Amount minus Down Payment and Installments Paid', () => {
    const today = new Date('2026-02-15');
    const payments = [
      {
        payment_id: 1,
        account_id: 3001,
        payment_date: '2026-02-01',
        payment_type: 'Monthly Amortization',
        amount_paid: 10000,
        for_month_no: 1
      }
    ];

    const result = computeAccountDerived(baseAccount, payments, today);
    assert.strictEqual(result.total_contract_amount, 1000000);
    assert.strictEqual(result.installments_paid, 10000);
    assert.strictEqual(result.down_payment, 100000);
    assert.strictEqual(result.base_balance, 890000);
    assert.strictEqual(result.total_paid, 110000);
  });

  it('should mark account ACTIVE when all due payments are made on time', () => {
    const today = new Date('2026-02-15');
    const payments = [
      {
        payment_id: 1,
        account_id: 3001,
        payment_date: '2026-02-01',
        payment_type: 'Monthly Amortization',
        amount_paid: 10000,
        for_month_no: 1
      }
    ];

    const result = computeAccountDerived(baseAccount, payments, today);
    assert.strictEqual(result.consecutive_missed, 0);
    assert.strictEqual(result.ten_percent_penalty, 0);
    assert.strictEqual(result.status, 'ACTIVE');
  });

  it('should calculate 10% penalty per missed month when past due date without payment', () => {
    const today = new Date('2026-03-20');
    const result = computeAccountDerived(baseAccount, [], today);

    assert.strictEqual(result.consecutive_missed, 2);
    assert.strictEqual(result.ten_percent_penalty, 2000);
    assert.strictEqual(result.penalties_balance, 2000);
    assert.match(result.status, /OVERDUE|PENALTY/);
  });

  it('should apply 1% DP penalty if agreed_dp_due has passed and DP is unpaid', () => {
    const unpaidDpAccount = {
      ...baseAccount,
      is_dp_paid: 0,
      agreed_dp_due: '2026-01-15'
    };
    const today = new Date('2026-02-01');
    const result = computeAccountDerived(unpaidDpAccount, [], today);

    assert.strictEqual(result.dp_penalty, 10000);
    assert.strictEqual(result.total_penalties >= 10000, true);
  });

  it('should retain penalties balance after regular amortization payment until penalty is specifically paid', () => {
    const today = new Date('2026-03-20');
    const payments = [
      {
        payment_id: 1,
        account_id: 3001,
        payment_date: '2026-03-20',
        payment_type: 'Monthly Amortization',
        amount_paid: 10000,
        for_month_no: 1
      }
    ];

    const result = computeAccountDerived(baseAccount, payments, today);
    assert.strictEqual(result.total_penalties > 0, true);
    assert.strictEqual(result.penalties_balance > 0, true);
  });

  it('should reduce penalties balance when Penalty payment is recorded', () => {
    const today = new Date('2026-03-20');
    const payments = [
      {
        payment_id: 1,
        account_id: 3001,
        payment_date: '2026-03-20',
        payment_type: 'Monthly Amortization',
        amount_paid: 10000,
        for_month_no: 1
      },
      {
        payment_id: 2,
        account_id: 3001,
        payment_date: '2026-03-21',
        payment_type: 'Penalty',
        amount_paid: 1000
      }
    ];

    const result = computeAccountDerived(baseAccount, payments, today);
    assert.strictEqual(result.penalties_paid, 1000);
  });

  it('should mark account FULLY PAID when total paid equals or exceeds total contract amount', () => {
    const fullyPaidAccount = {
      ...baseAccount,
      num_of_months: 2,
      total_contract_amount: 100000,
      down_payment: 20000,
      monthly_amortization: 40000
    };
    const payments = [
      {
        payment_id: 1,
        account_id: 3001,
        payment_date: '2026-02-01',
        payment_type: 'Monthly Amortization',
        amount_paid: 40000,
        for_month_no: 1
      },
      {
        payment_id: 2,
        account_id: 3001,
        payment_date: '2026-03-01',
        payment_type: 'Monthly Amortization',
        amount_paid: 40000,
        for_month_no: 2
      }
    ];
    const today = new Date('2026-03-15');
    const result = computeAccountDerived(fullyPaidAccount, payments, today);

    assert.strictEqual(result.base_balance, 0);
    assert.strictEqual(result.status, 'PAID');
  });
});
