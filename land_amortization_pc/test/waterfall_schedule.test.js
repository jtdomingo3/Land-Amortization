import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeMonthlySchedule } from '../src/engine/waterfall.js';

describe('Waterfall Schedule Suite (computeMonthlySchedule)', () => {
  const sampleAccount = {
    account_id: 4001,
    name: 'Waterfall Test Account',
    first_due_date: '2026-01-15',
    num_of_months: 12,
    monthly_amortization: 10000
  };

  it('should generate exact number of rows corresponding to num_of_months', () => {
    const sched = computeMonthlySchedule(sampleAccount, [], new Date('2026-01-01'));
    assert.strictEqual(sched.length, 12);
    assert.strictEqual(sched[0].month_no, 1);
    assert.strictEqual(sched[11].month_no, 12);
  });

  it('should mark month PAID when exact targeted monthly amortization is provided', () => {
    const payments = [
      {
        payment_id: 1,
        account_id: 4001,
        payment_date: '2026-01-15',
        payment_type: 'Monthly Amortization',
        amount_paid: 10000,
        for_month_no: 1
      }
    ];

    const sched = computeMonthlySchedule(sampleAccount, payments, new Date('2026-01-20'));
    assert.strictEqual(sched[0].payment_status, 'PAID');
    assert.strictEqual(sched[0].amount_applied, 10000);
  });

  it('should waterfall a lump-sum advance payment across multiple upcoming months', () => {
    // 35,000 lump sum on a 10,000/month amortization account:
    // Should fully pay Month 1, 2, 3 (30k) and partially pay Month 4 (5k)
    const payments = [
      {
        payment_id: 1,
        account_id: 4001,
        payment_date: '2026-01-10',
        payment_type: 'Monthly Amortization',
        amount_paid: 35000
      }
    ];

    const sched = computeMonthlySchedule(sampleAccount, payments, new Date('2026-01-20'));
    assert.strictEqual(sched[0].amount_applied, 10000);
    assert.strictEqual(sched[0].payment_status, 'PAID');

    assert.strictEqual(sched[1].amount_applied, 10000);
    assert.strictEqual(sched[1].payment_status, 'PAID');

    assert.strictEqual(sched[2].amount_applied, 10000);
    assert.strictEqual(sched[2].payment_status, 'PAID');

    assert.strictEqual(sched[3].amount_applied, 5000);
    assert.strictEqual(sched[3].payment_status, 'PARTIAL');

    assert.strictEqual(sched[4].amount_applied, 0);
  });

  it('should mark month as PARTIAL when payment is less than monthly amortization', () => {
    const payments = [
      {
        payment_id: 1,
        account_id: 4001,
        payment_date: '2026-01-15',
        payment_type: 'Monthly Amortization',
        amount_paid: 6000,
        for_month_no: 1
      }
    ];

    const sched = computeMonthlySchedule(sampleAccount, payments, new Date('2026-01-20'));
    assert.strictEqual(sched[0].amount_applied, 6000);
    assert.strictEqual(sched[0].payment_status, 'PARTIAL');
  });

  it('should flag OVERDUE and count running consecutive missed months when due date has passed without payment', () => {
    // As of 2026-03-20, Month 1 (Jan 15) and Month 2 (Feb 15) and Month 3 (Mar 15) are in the past
    const sched = computeMonthlySchedule(sampleAccount, [], new Date('2026-03-20'));
    assert.strictEqual(sched[0].payment_status, 'OVERDUE');
    assert.strictEqual(sched[0].consecutive_missed, 1);

    assert.strictEqual(sched[1].payment_status, 'OVERDUE');
    assert.strictEqual(sched[1].consecutive_missed, 2);

    assert.strictEqual(sched[2].payment_status, 'OVERDUE');
    assert.strictEqual(sched[2].consecutive_missed, 3);
  });
});
