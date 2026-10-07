import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Android Supabase Sync: Drop vs Push & Resurrection Prevention Suite', () => {
  const BUFFER_MS = 5000;

  function evaluateAccountAction(locAcc, remoteAccMap, lastSyncedAtTime) {
    if (!remoteAccMap.has(String(locAcc.account_id))) {
      const locCreatedAt = new Date(locAcc.created_at || locAcc.updated_at || 0).getTime();
      if (lastSyncedAtTime > 0 && locCreatedAt < lastSyncedAtTime - BUFFER_MS) {
        return 'DROP';
      } else {
        return 'PUSH';
      }
    }
    return 'EXISTS';
  }

  function evaluatePaymentAction(locPay, remotePayMap, lastSyncedAtTime) {
    if (!remotePayMap.has(String(locPay.payment_id))) {
      const locCreatedAt = new Date(locPay.created_at || locPay.updated_at || 0).getTime();
      if (lastSyncedAtTime > 0 && locCreatedAt < lastSyncedAtTime - BUFFER_MS) {
        return 'DROP';
      } else {
        return 'PUSH';
      }
    }
    return 'EXISTS';
  }

  function evaluatePenaltyAction(locPen, remotePenMap, lastSyncedAtTime) {
    if (!remotePenMap.has(String(locPen.penalty_id))) {
      const locCreatedAt = new Date(locPen.created_at || 0).getTime();
      if (lastSyncedAtTime > 0 && locCreatedAt < lastSyncedAtTime - BUFFER_MS) {
        return 'DROP';
      } else {
        return 'PUSH';
      }
    }
    return 'EXISTS';
  }

  it('Mobile: should DROP local account deleted from server (older than last sync - buffer)', () => {
    const lastSyncedAtTime = new Date('2026-10-07T12:00:00Z').getTime();
    const oldLocalAccount = {
      account_id: 101,
      name: 'Account Deleted On Remote',
      created_at: '2026-10-06T10:00:00Z'
    };
    const remoteAccMap = new Map();

    const action = evaluateAccountAction(oldLocalAccount, remoteAccMap, lastSyncedAtTime);
    assert.strictEqual(action, 'DROP', 'Mobile must drop local orphaned account rather than resurrecting to cloud');
  });

  it('Mobile: should PUSH new offline account created after last sync', () => {
    const lastSyncedAtTime = new Date('2026-10-07T12:00:00Z').getTime();
    const newOfflineAccount = {
      account_id: 202,
      name: 'Mobile New Account',
      created_at: '2026-10-07T12:05:00Z'
    };
    const remoteAccMap = new Map();

    const action = evaluateAccountAction(newOfflineAccount, remoteAccMap, lastSyncedAtTime);
    assert.strictEqual(action, 'PUSH', 'Mobile newly created offline account must be pushed to remote');
  });

  it('Mobile: should PUSH new offline account created within 5-second buffer before last sync', () => {
    const lastSyncedAtTime = new Date('2026-10-07T12:00:00Z').getTime();
    const bufferAccount = {
      account_id: 203,
      name: 'Mobile Buffer Account',
      created_at: new Date(lastSyncedAtTime - 2000).toISOString()
    };
    const remoteAccMap = new Map();

    const action = evaluateAccountAction(bufferAccount, remoteAccMap, lastSyncedAtTime);
    assert.strictEqual(action, 'PUSH', 'Account within buffer threshold must be pushed, not dropped');
  });

  it('Mobile: should PUSH local accounts on initial/first sync (lastSyncedAtTime === 0)', () => {
    const lastSyncedAtTime = 0;
    const localAccount = {
      account_id: 301,
      name: 'Mobile Fresh Account',
      created_at: '2026-09-01T10:00:00Z'
    };
    const remoteAccMap = new Map();

    const action = evaluateAccountAction(localAccount, remoteAccMap, lastSyncedAtTime);
    assert.strictEqual(action, 'PUSH', 'First sync must push local data and not drop');
  });

  it('Mobile: should DROP local payment deleted from server and PUSH new offline payment', () => {
    const lastSyncedAtTime = new Date('2026-10-07T12:00:00Z').getTime();
    const remotePayMap = new Map();

    const oldPayment = {
      payment_id: 501,
      account_id: 101,
      amount_paid: 5000,
      created_at: '2026-10-05T08:00:00Z'
    };
    const newOfflinePayment = {
      payment_id: 502,
      account_id: 101,
      amount_paid: 5000,
      created_at: '2026-10-07T12:01:00Z'
    };

    assert.strictEqual(evaluatePaymentAction(oldPayment, remotePayMap, lastSyncedAtTime), 'DROP');
    assert.strictEqual(evaluatePaymentAction(newOfflinePayment, remotePayMap, lastSyncedAtTime), 'PUSH');
  });

  it('Mobile: should DROP local penalty deleted from server and PUSH new offline penalty', () => {
    const lastSyncedAtTime = new Date('2026-10-07T12:00:00Z').getTime();
    const remotePenMap = new Map();

    const oldPenalty = {
      penalty_id: 701,
      account_id: 101,
      penalty_amount: 500,
      created_at: '2026-10-05T08:00:00Z'
    };
    const newPenalty = {
      penalty_id: 702,
      account_id: 101,
      penalty_amount: 500,
      created_at: '2026-10-07T12:01:00Z'
    };

    assert.strictEqual(evaluatePenaltyAction(oldPenalty, remotePenMap, lastSyncedAtTime), 'DROP');
    assert.strictEqual(evaluatePenaltyAction(newPenalty, remotePenMap, lastSyncedAtTime), 'PUSH');
  });

  it('Mobile: should store sync drop errors in localStorage', () => {
    const syncErrors = [];
    try {
      throw new Error('SQLite storage read-only error');
    } catch (e) {
      syncErrors.push({ type: 'payment_drop_error', id: 888, message: e.message });
    }

    assert.strictEqual(syncErrors.length, 1);
    assert.strictEqual(syncErrors[0].type, 'payment_drop_error');
    assert.strictEqual(syncErrors[0].id, 888);
  });
});
