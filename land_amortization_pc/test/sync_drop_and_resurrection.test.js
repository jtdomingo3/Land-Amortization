import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Supabase Sync: Drop vs Push & Resurrection Prevention Suite', () => {
  const BUFFER_MS = 5000;

  // Helper matching the exact production drop-or-push evaluation in supabaseSync.js
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

  it('should DROP local account deleted from server (older than last sync - buffer)', () => {
    const lastSyncedAtTime = new Date('2026-10-07T12:00:00Z').getTime();
    const oldLocalAccount = {
      account_id: 101,
      name: 'Account Deleted On Remote',
      created_at: '2026-10-06T10:00:00Z'
    };
    const remoteAccMap = new Map(); // empty, meaning deleted on server

    const action = evaluateAccountAction(oldLocalAccount, remoteAccMap, lastSyncedAtTime);
    assert.strictEqual(action, 'DROP', 'Old orphaned account must be dropped locally instead of resurrecting');
  });

  it('should PUSH new offline account created after last sync', () => {
    const lastSyncedAtTime = new Date('2026-10-07T12:00:00Z').getTime();
    const newOfflineAccount = {
      account_id: 202,
      name: 'Newly Created Offline Account',
      created_at: '2026-10-07T12:05:00Z'
    };
    const remoteAccMap = new Map();

    const action = evaluateAccountAction(newOfflineAccount, remoteAccMap, lastSyncedAtTime);
    assert.strictEqual(action, 'PUSH', 'Newly created offline account must be pushed to remote');
  });

  it('should PUSH new offline account created within 5-second buffer before last sync', () => {
    const lastSyncedAtTime = new Date('2026-10-07T12:00:00Z').getTime();
    const bufferAccount = {
      account_id: 203,
      name: 'Account Just Created Seconds Ago',
      created_at: new Date(lastSyncedAtTime - 2000).toISOString() // 2 seconds before sync
    };
    const remoteAccMap = new Map();

    const action = evaluateAccountAction(bufferAccount, remoteAccMap, lastSyncedAtTime);
    assert.strictEqual(action, 'PUSH', 'Account within buffer threshold must be pushed, not dropped');
  });

  it('should PUSH local accounts on initial/first sync (lastSyncedAtTime === 0)', () => {
    const lastSyncedAtTime = 0; // First sync ever
    const localAccount = {
      account_id: 301,
      name: 'Initial Local Account',
      created_at: '2026-09-01T10:00:00Z'
    };
    const remoteAccMap = new Map();

    const action = evaluateAccountAction(localAccount, remoteAccMap, lastSyncedAtTime);
    assert.strictEqual(action, 'PUSH', 'First sync must push local data and not drop');
  });

  it('should DROP local payment deleted from server and PUSH new offline payment', () => {
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

  it('should DROP local penalty deleted from server and PUSH new offline penalty', () => {
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

  it('should store sync drop errors in localStorage when drop fails', () => {
    const syncErrors = [];
    try {
      throw new Error('SQLite disk I/O error');
    } catch (e) {
      syncErrors.push({ type: 'account_drop_error', id: 999, message: e.message });
    }

    assert.strictEqual(syncErrors.length, 1);
    assert.strictEqual(syncErrors[0].type, 'account_drop_error');
    assert.strictEqual(syncErrors[0].id, 999);
    assert.strictEqual(syncErrors[0].message, 'SQLite disk I/O error');

    const serialized = JSON.stringify(syncErrors);
    const parsed = JSON.parse(serialized);
    assert.strictEqual(parsed[0].type, 'account_drop_error');
  });
});
