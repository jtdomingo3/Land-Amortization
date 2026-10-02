import { createClient } from '@supabase/supabase-js';
import {
  getAccounts,
  getPayments,
  insertAccount,
  updateAccount,
  insertPayment,
  updatePayment
} from '../db/database.js';

const SUPABASE_CONFIG_STORAGE_KEY = 'land_amortization_supabase_config';

// Supabase Project Configuration (loaded safely from local .env)
export const ENV_SUPABASE_URL =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL)) ||
  '';

export const ENV_SUPABASE_KEY =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)) ||
  '';

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
export const SUPABASE_SQL_SCHEMA = `-- Land Amortization Tracker: Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to enable real-time sync with PC and Mobile

-- 1. Accounts Table
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

-- 2. Payments Table
CREATE TABLE IF NOT EXISTS land_payments (
  payment_id BIGINT PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES land_accounts(account_id) ON DELETE CASCADE,
  payment_date TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL,
  receipt_no TEXT,
  payment_method TEXT DEFAULT 'Cash',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_land_payments_account ON land_payments(account_id);

-- Enable Row Level Security (RLS) or public access
ALTER TABLE land_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_payments ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for the app key
CREATE POLICY "Allow all operations for land_accounts" ON land_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for land_payments" ON land_payments FOR ALL USING (true) WITH CHECK (true);
`;

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

      const { error: upsertAccErr } = await client
        .from('land_accounts')
        .upsert(cleanAccs, { onConflict: 'account_id' });

      if (upsertAccErr) {
        throw new Error(`Error uploading accounts to cloud: ${upsertAccErr.message}`);
      }
    }

    // 4. Push local payments to cloud (upsert)
    if (localPayments.length > 0) {
      const cleanPays = localPayments.map(p => ({
        payment_id: p.payment_id,
        account_id: p.account_id,
        payment_date: p.payment_date,
        payment_type: p.payment_type,
        amount_paid: p.amount_paid,
        receipt_no: p.receipt_no || null,
        payment_method: p.payment_method || 'Cash',
        remarks: p.remarks || null,
        updated_at: new Date().toISOString()
      }));

      const { error: upsertPayErr } = await client
        .from('land_payments')
        .upsert(cleanPays, { onConflict: 'payment_id' });

      if (upsertPayErr) {
        throw new Error(`Error uploading payments to cloud: ${upsertPayErr.message}`);
      }
    }

    // 5. Pull cloud accounts that don't exist locally
    const localAccIds = new Set(localAccounts.map(a => String(a.account_id)));
    for (const remAcc of (remoteAccounts || [])) {
      if (!localAccIds.has(String(remAcc.account_id))) {
        await insertAccount(remAcc);
        pulledAccounts++;
      }
    }

    // 6. Pull cloud payments that don't exist locally
    const localPayIds = new Set(localPayments.map(p => String(p.payment_id)));
    for (const remPay of (remotePayments || [])) {
      if (!localPayIds.has(String(remPay.payment_id))) {
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
    await client.from('land_accounts').upsert(clean, { onConflict: 'account_id' });
    const now = new Date().toISOString();
    saveSupabaseConfig({ lastSyncedAt: now });
    try { localStorage.setItem('land_amortization_last_synced', now); } catch (_) {}
    console.log('[Cloud Sync] Auto-synced account to Supabase:', account.account_id);
  } catch (err) {
    console.warn('[Cloud Sync] Auto-sync account deferred:', err.message);
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
    await client.from('land_accounts').delete().eq('account_id', accountId);
    const now = new Date().toISOString();
    saveSupabaseConfig({ lastSyncedAt: now });
    try { localStorage.setItem('land_amortization_last_synced', now); } catch (_) {}
    console.log('[Cloud Sync] Auto-deleted account from Supabase:', accountId);
  } catch (err) {
    console.warn('[Cloud Sync] Auto-delete account deferred:', err.message);
  }
}

/**
 * Automatically sync a created/updated payment to Supabase if online
 */
export async function syncUpsertPayment(payment) {
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
      updated_at: new Date().toISOString()
    };
    await client.from('land_payments').upsert(clean, { onConflict: 'payment_id' });
    const now = new Date().toISOString();
    saveSupabaseConfig({ lastSyncedAt: now });
    try { localStorage.setItem('land_amortization_last_synced', now); } catch (_) {}
    console.log('[Cloud Sync] Auto-synced payment to Supabase:', payment.payment_id);
  } catch (err) {
    console.warn('[Cloud Sync] Auto-sync payment deferred:', err.message);
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
    console.warn('[Cloud Sync] Auto-delete payment deferred:', err.message);
  }
}
