import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeDashboard } from '../src/engine/dashboard.js';

describe('Dashboard Engine Suite (Android)', () => {
  it('should return zero metrics for empty accounts list', () => {
    const dash = computeDashboard([]);
    assert.strictEqual(dash.totalAccounts, 0);
    assert.strictEqual(dash.totalContractAmount, 0);
    assert.strictEqual(dash.totalCollected, 0);
    assert.strictEqual(dash.collectionRate, 0);
  });

  it('should accurately aggregate contracts, payments, penalties, and status breakdowns', () => {
    const mockAccounts = [
      {
        account_id: 1,
        total_contract_amount: 1000000,
        down_payment: 100000,
        installments_paid: 50000,
        total_paid: 150000,
        dp_penalty: 0,
        ten_percent_penalty: 0,
        total_penalties: 0,
        penalties_paid: 0,
        penalties_balance: 0,
        total_amount_due: 0,
        outstanding_balance: 850000,
        status: 'ACTIVE',
        consecutive_missed: 0
      },
      {
        account_id: 2,
        total_contract_amount: 500000,
        down_payment: 50000,
        installments_paid: 0,
        total_paid: 50000,
        dp_penalty: 0,
        ten_percent_penalty: 2000,
        total_penalties: 2000,
        penalties_paid: 0,
        penalties_balance: 2000,
        total_amount_due: 22000,
        outstanding_balance: 452000,
        status: 'OVERDUE',
        consecutive_missed: 2
      },
      {
        account_id: 3,
        total_contract_amount: 200000,
        down_payment: 20000,
        installments_paid: 180000,
        total_paid: 200000,
        dp_penalty: 0,
        ten_percent_penalty: 0,
        total_penalties: 0,
        penalties_paid: 0,
        penalties_balance: 0,
        total_amount_due: 0,
        outstanding_balance: 0,
        status: 'PAID',
        consecutive_missed: 0
      }
    ];

    const dash = computeDashboard(mockAccounts);
    assert.strictEqual(dash.totalAccounts, 3);
    assert.strictEqual(dash.totalContractAmount, 1700000);
    assert.strictEqual(dash.totalCollected, 400000);
    assert.strictEqual(dash.penaltiesBalance, 2000);

    assert.strictEqual(dash.activeAccounts, 1);
    assert.strictEqual(dash.overdueAccounts, 1);
    assert.strictEqual(dash.paidAccounts, 1);
    assert.strictEqual(dash.twoPlusMissed, 1);

    assert.strictEqual(dash.collectionRate > 23 && dash.collectionRate < 24, true);
  });
});
