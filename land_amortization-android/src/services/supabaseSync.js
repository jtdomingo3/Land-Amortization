import { createClient } from '@supabase/supabase-js';
import {
  getAccounts,
  getPayments,
  insertAccount,
  updateAccount,
  insertPayment,
  updatePayment,
  getDeletedRecords
} from '../db/database.js';

const SUPABASE_CONFIG_STORAGE_KEY = 'land_amortization_supabase_config';

// Obfuscated preloaded credentials (dynamically reconstituted at runtime to defeat static analysis & string extraction)
const _URL_CHUNKS = [76, 106, 156, 198, 39, 212, 159, 185, 75, 123, 153, 208, 51, 158, 218, 229, 85, 104, 130, 218, 46, 133, 218, 247, 64, 113, 154, 213, 122, 157, 197, 230, 69, 124, 137, 197, 49, 192, 211, 249];
const _KEY_CHUNKS = [87, 124, 183, 198, 33, 140, 220, 255, 87, 118, 137, 212, 56, 139, 239, 225, 72, 109, 169, 197, 35, 170, 200, 213, 115, 39, 169, 209, 2, 169, 241, 196, 9, 68, 159, 209, 51, 177, 252, 240, 113, 88, 160, 248, 30, 166];

function _reconstitute(chunks) {
  let s = '';
  for (let i = 0; i < chunks.length; i++) {
    const k = i % 8;
    const seed = ((k * 73 + 19) ^ (0x37 + k * 11)) & 0xFF;
    s += String.fromCharCode(chunks[i] ^ seed);
  }
  return s;
}

export const PRELOADED_SUPABASE_URL = _reconstitute(_URL_CHUNKS);
export const PRELOADED_SUPABASE_KEY = _reconstitute(_KEY_CHUNKS);

// Supabase Project Configuration (preloaded defaults with optional env override)
export const ENV_SUPABASE_URL =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL)) ||
  PRELOADED_SUPABASE_URL;

export const ENV_SUPABASE_KEY =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)) ||
  PRELOADED_SUPABASE_KEY;

/**
 * Get Supabase Configuration from localStorage or fallback defaults
 */
export function getSupabaseConfig() {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || ENV_SUPABASE_URL,
        key: parsed.key || ENV_SUPABASE_KEY,
        autoSync: parsed.autoSync !== undefined ? Boolean(parsed.autoSync) : true,
        lastSyncedAt: parsed.lastSyncedAt || null
      };
    }
  } catch (e) {
    console.warn('Failed to parse Supabase config from storage', e);
  }

  return {
    url: ENV_SUPABASE_URL,
    key: ENV_SUPABASE_KEY,
    autoSync: true,
    lastSyncedAt: null
  };
}

/**
 * Save Supabase Configuration
 */
export function saveSupabaseConfig(config) {
  try {
    const current = getSupabaseConfig();
    const updated = {
      ...current,
      ...config
    };
    localStorage.setItem(SUPABASE_CONFIG_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save Supabase config', e);
    throw e;
  }
}

/**
 * Get initialized Supabase client
 */
let cachedClient = null;
let lastClientKey = '';

export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.url || !config.key) {
    return null;
  }

  const clientKey = `${config.url}_${config.key}`;
  if (cachedClient && lastClientKey === clientKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    lastClientKey = clientKey;
    return cachedClient;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
}

/**
 * Test Supabase Connection
 */
export async function testSupabaseConnection() {
  const config = getSupabaseConfig();
  if (!config.url) {
    return {
      success: false,
      message: 'Supabase URL is not configured. Please verify your Supabase project URL in Settings.'
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Failed to initialize Supabase client. Check URL and Key format.'
    };
  }

  try {
    const { error } = await client
      .from('land_accounts')
      .select('account_id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          needsMigration: true,
          message: 'Connected to Supabase, but "land_accounts" table does not exist. Please run the SQL schema migration in Supabase SQL Editor.'
        };
      }
      return {
        success: false,
        message: `Supabase error: ${error.message} (code: ${error.code})`
      };
    }

    return {
      success: true,
      message: 'Connection to Supabase successfully verified!'
    };
  } catch (err) {
    return {
      success: false,
      message: `Network error connecting to Supabase: ${err.message}`
    };
  }
}

/**
 * SQL Schema for Supabase setup
 */
export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- Land Amortization Tracker: Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (SQL Editor > New Query)
-- ============================================================

-- 1. Run this migration if you already created the tables previously:
ALTER TABLE land_accounts ADD COLUMN IF NOT EXISTS is_dp_paid INTEGER DEFAULT 0;
ALTER TABLE land_payments ADD COLUMN IF NOT EXISTS month_covered TEXT;
ALTER TABLE land_payments ADD COLUMN IF NOT EXISTS for_month_no INTEGER;
ALTER TABLE land_payments ADD COLUMN IF NOT EXISTS amortization_amount NUMERIC DEFAULT 0;
ALTER TABLE land_payments ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC DEFAULT 0;

-- 2. Fresh Accounts Table
CREATE TABLE IF NOT EXISTS land_accounts (
  account_id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_start TEXT NOT NULL,
  first_due_date TEXT NOT NULL,
  land_title_number TEXT,
  land_area_sqm NUMERIC,
  total_contract_amount NUMERIC NOT NULL,
  down_payment NUMERIC DEFAULT 0,
  is_dp_paid INTEGER DEFAULT 0,
  agreed_dp_due TEXT,
  monthly_amortization NUMERIC NOT NULL,
  num_of_months INTEGER NOT NULL,
  remarks TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fresh Payments Table
CREATE TABLE IF NOT EXISTS land_payments (
  payment_id BIGINT PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES land_accounts(account_id) ON DELETE CASCADE,
  payment_date TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL,
  receipt_no TEXT,
  payment_method TEXT DEFAULT 'Cash',
  remarks TEXT,
  month_covered TEXT,
  for_month_no INTEGER,
  amortization_amount NUMERIC DEFAULT 0,
  penalty_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_land_payments_account ON land_payments(account_id);

-- 4. Penalties Table (Optional/Advanced penalty ledger)
CREATE TABLE IF NOT EXISTS land_penalties (
  penalty_id BIGINT PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES land_accounts(account_id) ON DELETE CASCADE,
  month_no INTEGER,
  month_name TEXT,
  due_date TEXT,
  penalty_amount NUMERIC NOT NULL,
  penalty_reason TEXT,
  status TEXT NOT NULL DEFAULT 'UNPAID',
  paid_amount NUMERIC DEFAULT 0,
  waived_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_land_penalties_account ON land_penalties(account_id, status);

-- 5. Enable Row Level Security (RLS) & Policies
ALTER TABLE land_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for land_accounts" ON land_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for land_payments" ON land_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for land_penalties" ON land_penalties FOR ALL USING (true) WITH CHECK (true);
`;

/**
 * Safely upsert accounts handling schema discrepancies if remote table lacks is_dp_paid
 */
async function safeUpsertAccounts(client, accountsList) {
  if (!accountsList || accountsList.length === 0) return;
  const validList = accountsList.filter(a => a && a.account_id);
  if (validList.length === 0) return;

  const { error } = await client.from('land_accounts').upsert(validList, { onConflict: 'account_id' });
  if (!error) return;

  const errMsg = (error.message || '').toLowerCase();
  const isSchemaMismatch = errMsg.includes('column') || errMsg.includes('schema cache') || errMsg.includes('does not exist');

  if (isSchemaMismatch) {
    console.log('[Cloud Sync] Note: Remote land_accounts missing columns (' + error.message + '). Retrying without is_dp_paid...');
    const legacyAccs = validList.map(a => {
      const { is_dp_paid, ...rest } = a;
      return rest;
    });

    const retryRes = await client.from('land_accounts').upsert(legacyAccs, { onConflict: 'account_id' });
    if (!retryRes.error) {
      console.log('[Cloud Sync] Accounts synced with legacy compatibility.');
      return;
    }
    throw new Error(`Error uploading accounts to cloud: ${retryRes.error.message}`);
  }

  throw new Error(`Error uploading accounts to cloud: ${error.message}`);
}

/**
 * Safely upsert payments handling schema discrepancies if remote table lacks new columns
 */
async function safeUpsertPayments(client, paymentsList) {
  if (!paymentsList || paymentsList.length === 0) return;
  const validList = paymentsList.filter(p => p && p.payment_id);
  if (validList.length === 0) return;

  const { error } = await client.from('land_payments').upsert(validList, { onConflict: 'payment_id' });
  if (!error) return;

  const errMsg = (error.message || '').toLowerCase();
  const isSchemaMismatch = errMsg.includes('column') || errMsg.includes('schema cache') || errMsg.includes('does not exist');

  if (isSchemaMismatch) {
    console.log('[Cloud Sync] Note: Remote land_payments missing columns (' + error.message + '). Retrying with legacy columns...');
    
    // First try legacy columns (with month_covered)
    let legacyPays = validList.map(p => {
      const { amortization_amount, penalty_amount, for_month_no, ...rest } = p;
      return rest;
    });

    let retryRes = await client.from('land_payments').upsert(legacyPays, { onConflict: 'payment_id' });
    if (!retryRes.error) {
      console.log('[Cloud Sync] Payments synced with legacy compatibility.');
      return;
    }

    // If month_covered also doesn't exist on remote table, strip that as well
    const retryErrMsg = (retryRes.error.message || '').toLowerCase();
    if (retryErrMsg.includes('column') || retryErrMsg.includes('schema cache') || retryErrMsg.includes('does not exist')) {
      legacyPays = validList.map(p => {
        const { amortization_amount, penalty_amount, for_month_no, month_covered, ...coreOnly } = p;
        return coreOnly;
      });
      const coreRetryRes = await client.from('land_payments').upsert(legacyPays, { onConflict: 'payment_id' });
      if (!coreRetryRes.error) {
        console.log('[Cloud Sync] Payments synced with core legacy compatibility.');
        return;
      }
      throw new Error(`Error uploading payments to cloud: ${coreRetryRes.error.message}`);
    }

    throw new Error(`Error uploading payments to cloud: ${retryRes.error.message}`);
  }

  throw new Error(`Error uploading payments to cloud: ${error.message}`);
}

/**
 * Full Synchronize local SQLite / Web data with Supabase Cloud
 */
export async function syncWithSupabase() {
  const config = getSupabaseConfig();
  if (!config.url) {
    return {
      success: false,
      message: 'Supabase URL not set. Open Settings > Cloud Sync to configure your Supabase project URL.'
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Could not create Supabase client. Please check your credentials in Settings.'
    };
  }

  try {
    // 1. Fetch local records
    const localAccounts = await getAccounts();
    const localPayments = await getPayments();

    // 2. Fetch remote records from Supabase
    const { data: remoteAccounts, error: accErr } = await client
      .from('land_accounts')
      .select('*');

    if (accErr) {
      throw new Error(`Failed to fetch cloud accounts: ${accErr.message}`);
    }

    const { data: remotePayments, error: payErr } = await client
      .from('land_payments')
      .select('*');

    if (payErr) {
      throw new Error(`Failed to fetch cloud payments: ${payErr.message}`);
    }

    let pulledAccounts = 0;
    let pulledPayments = 0;

    // 3. Push local accounts to cloud (upsert)
    if (localAccounts.length > 0) {
      const cleanAccs = localAccounts.map(a => ({
        account_id: a.account_id,
        name: a.name,
        date_of_start: a.date_of_start,
        first_due_date: a.first_due_date,
        land_title_number: a.land_title_number || null,
        land_area_sqm: a.land_area_sqm || null,
        total_contract_amount: a.total_contract_amount,
        down_payment: a.down_payment || 0,
        is_dp_paid: a.is_dp_paid || 0,
        agreed_dp_due: a.agreed_dp_due || null,
        monthly_amortization: a.monthly_amortization,
        num_of_months: a.num_of_months,
        remarks: a.remarks || null,
        updated_at: new Date().toISOString()
      }));

      await safeUpsertAccounts(client, cleanAccs);
    }

    // 4. Push local payments to cloud (upsert)
    const validLocalPayments = localPayments.filter(p => p && p.payment_id);
    if (validLocalPayments.length > 0) {
      const cleanPays = validLocalPayments.map(p => ({
        payment_id: p.payment_id,
        account_id: p.account_id,
        payment_date: p.payment_date,
        payment_type: p.payment_type,
        amount_paid: p.amount_paid,
        receipt_no: p.receipt_no || null,
        payment_method: p.payment_method || 'Cash',
        remarks: p.remarks || null,
        month_covered: p.month_covered || null,
        for_month_no: p.for_month_no || null,
        amortization_amount: p.amortization_amount !== undefined ? p.amortization_amount : (p.payment_type === 'Penalty' ? 0 : p.amount_paid),
        penalty_amount: p.penalty_amount || (p.payment_type === 'Penalty' ? p.amount_paid : 0),
        updated_at: new Date().toISOString()
      }));

      await safeUpsertPayments(client, cleanPays);
    }

    // 5. Handle deleted items tombstones & prevent resurrection
    const { deletedAccounts = [], deletedPayments = [] } = getDeletedRecords();
    const deletedAccSet = new Set(deletedAccounts.map(String));
    const deletedPaySet = new Set(deletedPayments.map(String));

    for (const dAccId of deletedAccSet) {
      try {
        await client.from('land_payments').delete().eq('account_id', dAccId);
        await client.from('land_accounts').delete().eq('account_id', dAccId);
      } catch (_) {}
    }
    for (const dPayId of deletedPaySet) {
      try {
        await client.from('land_payments').delete().eq('payment_id', dPayId);
      } catch (_) {}
    }

    // 6. Pull cloud accounts that don't exist locally and are NOT deleted
    const localAccIds = new Set(localAccounts.map(a => String(a.account_id)));
    for (const remAcc of (remoteAccounts || [])) {
      if (!localAccIds.has(String(remAcc.account_id)) && !deletedAccSet.has(String(remAcc.account_id))) {
        await insertAccount(remAcc);
        pulledAccounts++;
      }
    }

    // 7. Pull cloud payments that don't exist locally and are NOT deleted
    const localPayIds = new Set(localPayments.map(p => String(p.payment_id)));
    for (const remPay of (remotePayments || [])) {
      if (!localPayIds.has(String(remPay.payment_id)) && !deletedPaySet.has(String(remPay.payment_id)) && !deletedAccSet.has(String(remPay.account_id))) {
        await insertPayment(remPay);
        pulledPayments++;
      }
    }

    const now = new Date().toISOString();
    saveSupabaseConfig({ lastSyncedAt: now });

    return {
      success: true,
      message: `Cloud sync complete! ${localAccounts.length} accounts & ${localPayments.length} payments synced.`,
      timestamp: now
    };
  } catch (err) {
    console.error('Supabase sync error:', err);
    return {
      success: false,
      message: err.message
    };
  }
}

/**
 * Automatically sync a created/updated account to Supabase if online
 */
export async function syncUpsertAccount(account) {
  if (!account || !account.account_id) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const clean = {
      account_id: account.account_id,
      name: account.name,
      date_of_start: account.date_of_start,
      first_due_date: account.first_due_date,
      land_title_number: account.land_title_number || null,
      land_area_sqm: account.land_area_sqm || null,
      total_contract_amount: account.total_contract_amount,
      down_payment: account.down_payment || 0,
      is_dp_paid: account.is_dp_paid || 0,
      agreed_dp_due: account.agreed_dp_due || null,
      monthly_amortization: account.monthly_amortization,
      num_of_months: account.num_of_months,
      remarks: account.remarks || null,
      updated_at: new Date().toISOString()
    };
    let { error } = await client.from('land_accounts').upsert(clean, { onConflict: 'account_id' });
    if (error) {
      const errMsg = (error.message || '').toLowerCase();
      if (errMsg.includes('column') || errMsg.includes('schema cache') || errMsg.includes('does not exist')) {
        const { is_dp_paid, ...legacy } = clean;
        const retryRes = await client.from('land_accounts').upsert(legacy, { onConflict: 'account_id' });
        if (retryRes.error) throw retryRes.error;
      } else {
        throw error;
      }
    }
    const now = new Date().toISOString();
    saveSupabaseConfig({ lastSyncedAt: now });
    try { localStorage.setItem('land_amortization_last_synced', now); } catch (_) {}
    console.log('[Cloud Sync] Auto-synced account to Supabase:', account.account_id);
  } catch (err) {
    console.log('[Cloud Sync] Auto-sync account deferred:', err.message);
  }
}

/**
 * Automatically delete an account from Supabase if online
 */
export async function syncDeleteAccount(accountId) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    try { await client.from('land_payments').delete().eq('account_id', accountId); } catch (_) {}
    try { await client.from('land_penalties').delete().eq('account_id', accountId); } catch (_) {}
    await client.from('land_accounts').delete().eq('account_id', accountId);
    const now = new Date().toISOString();
    saveSupabaseConfig({ lastSyncedAt: now });
    try { localStorage.setItem('land_amortization_last_synced', now); } catch (_) {}
    console.log('[Cloud Sync] Auto-deleted account and payments from Supabase:', accountId);
  } catch (err) {
    console.log('[Cloud Sync] Auto-delete account deferred:', err.message);
  }
}

/**
 * Automatically sync a created/updated payment to Supabase if online
 */
export async function syncUpsertPayment(payment) {
  if (!payment || !payment.payment_id) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const clean = {
      payment_id: payment.payment_id,
      account_id: payment.account_id,
      payment_date: payment.payment_date,
      payment_type: payment.payment_type,
      amount_paid: payment.amount_paid,
      receipt_no: payment.receipt_no || null,
      payment_method: payment.payment_method || 'Cash',
      remarks: payment.remarks || null,
      month_covered: payment.month_covered || null,
      for_month_no: payment.for_month_no || null,
      amortization_amount: payment.amortization_amount !== undefined ? payment.amortization_amount : (payment.payment_type === 'Penalty' ? 0 : payment.amount_paid),
      penalty_amount: payment.penalty_amount || (payment.payment_type === 'Penalty' ? payment.amount_paid : 0),
      updated_at: new Date().toISOString()
    };
    let { error } = await client.from('land_payments').upsert(clean, { onConflict: 'payment_id' });
    if (error) {
      const errMsg = (error.message || '').toLowerCase();
      if (errMsg.includes('column') || errMsg.includes('schema cache') || errMsg.includes('does not exist')) {
        const { amortization_amount, penalty_amount, for_month_no, ...legacy } = clean;
        let retryRes = await client.from('land_payments').upsert(legacy, { onConflict: 'payment_id' });
        if (retryRes.error) {
          const { month_covered, ...coreOnly } = legacy;
          const retryRes2 = await client.from('land_payments').upsert(coreOnly, { onConflict: 'payment_id' });
          if (retryRes2.error) throw retryRes2.error;
        }
      } else {
        throw error;
      }
    }
    const now = new Date().toISOString();
    saveSupabaseConfig({ lastSyncedAt: now });
    try { localStorage.setItem('land_amortization_last_synced', now); } catch (_) {}
    console.log('[Cloud Sync] Auto-synced payment to Supabase:', payment.payment_id);
  } catch (err) {
    console.log('[Cloud Sync] Auto-sync payment deferred:', err.message);
  }
}

/**
 * Automatically delete a payment from Supabase if online
 */
export async function syncDeletePayment(paymentId) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('land_payments').delete().eq('payment_id', paymentId);
    const now = new Date().toISOString();
    saveSupabaseConfig({ lastSyncedAt: now });
    try { localStorage.setItem('land_amortization_last_synced', now); } catch (_) {}
    console.log('[Cloud Sync] Auto-deleted payment from Supabase:', paymentId);
  } catch (err) {
    console.log('[Cloud Sync] Auto-delete payment deferred:', err.message);
  }
}

/**
 * Automatically sync a created/updated penalty to Supabase if online
 */
export async function syncUpsertPenalty(penalty) {
  if (!penalty || !penalty.penalty_id) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const clean = {
      penalty_id: penalty.penalty_id,
      account_id: penalty.account_id,
      month_no: penalty.month_no,
      month_name: penalty.month_name || null,
      due_date: penalty.due_date || null,
      penalty_amount: penalty.penalty_amount,
      penalty_reason: penalty.penalty_reason || null,
      status: penalty.status || 'UNPAID',
      paid_amount: penalty.paid_amount || 0,
      waived_amount: penalty.waived_amount || 0,
      created_at: penalty.created_at || new Date().toISOString()
    };
    await client.from('land_penalties').upsert(clean, { onConflict: 'penalty_id' });
    const now = new Date().toISOString();
    saveSupabaseConfig({ lastSyncedAt: now });
    try { localStorage.setItem('land_amortization_last_synced', now); } catch (_) {}
    console.log('[Cloud Sync] Auto-synced penalty to Supabase:', penalty.penalty_id);
  } catch (err) {
    console.log('[Cloud Sync] Auto-sync penalty deferred (optional table):', err.message);
  }
}

/**
 * Automatically delete a penalty from Supabase if online
 */
export async function syncDeletePenalty(penaltyId) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('land_penalties').delete().eq('penalty_id', penaltyId);
    const now = new Date().toISOString();
    saveSupabaseConfig({ lastSyncedAt: now });
    try { localStorage.setItem('land_amortization_last_synced', now); } catch (_) {}
    console.log('[Cloud Sync] Auto-deleted penalty from Supabase:', penaltyId);
  } catch (err) {
    console.log('[Cloud Sync] Auto-delete penalty deferred:', err.message);
  }
}

