import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSampleData } from '../src/db/database.js';
import {
  CREATE_TABLE_ACCOUNTS,
  CREATE_TABLE_PAYMENTS,
  CREATE_TABLE_PENALTIES
} from '../src/db/queries.js';

describe('Data Schema and Integrity Suite', () => {
  it('should verify SQLite schema definitions contain all required columns', () => {
    // Accounts table must contain is_dp_paid column
    assert.strictEqual(CREATE_TABLE_ACCOUNTS.includes('is_dp_paid'), true);
    assert.strictEqual(CREATE_TABLE_ACCOUNTS.includes('account_id'), true);
    assert.strictEqual(CREATE_TABLE_ACCOUNTS.includes('monthly_amortization'), true);
    assert.strictEqual(CREATE_TABLE_ACCOUNTS.includes('num_of_months'), true);

    // Payments table must contain amortization_amount and penalty_amount
    assert.strictEqual(CREATE_TABLE_PAYMENTS.includes('amortization_amount'), true);
    assert.strictEqual(CREATE_TABLE_PAYMENTS.includes('penalty_amount'), true);
    assert.strictEqual(CREATE_TABLE_PAYMENTS.includes('for_month_no'), true);

    // Penalties table must exist
    assert.strictEqual(CREATE_TABLE_PENALTIES.includes('penalties'), true);
  });

  it('should verify all sample demo accounts have valid schema properties', () => {
    const { accounts, payments } = getSampleData();
    assert.strictEqual(Array.isArray(accounts), true);
    assert.strictEqual(accounts.length >= 3, true);

    for (const acc of accounts) {
      assert.strictEqual(typeof acc.account_id !== 'undefined', true);
      assert.strictEqual(typeof acc.name, 'string');
      assert.strictEqual(typeof acc.total_contract_amount, 'number');
      assert.strictEqual(typeof acc.down_payment, 'number');
      assert.strictEqual(typeof acc.monthly_amortization, 'number');
      assert.strictEqual(typeof acc.num_of_months, 'number');
      assert.strictEqual(typeof acc.is_dp_paid !== 'undefined', true);
      assert.match(acc.date_of_start, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(acc.first_due_date, /^\d{4}-\d{2}-\d{2}$/);
    }

    assert.strictEqual(Array.isArray(payments), true);
    for (const p of payments) {
      assert.strictEqual(typeof p.account_id !== 'undefined', true);
      assert.strictEqual(typeof p.amount_paid, 'number');
      assert.match(p.payment_date, /^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
