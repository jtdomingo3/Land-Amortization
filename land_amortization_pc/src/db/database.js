import {
  CREATE_TABLE_ACCOUNTS,
  CREATE_TABLE_PAYMENTS,
  CREATE_INDEX_PAYMENTS,
  CREATE_TABLE_PENALTIES,
  CREATE_INDEX_PENALTIES,
  CREATE_TABLE_SETTINGS,
  CREATE_TABLE_EXPORT_LOG
} from './queries.js';

import { addMonthsEdate } from '../utils/dateUtils.js';

let dbInstance = null;
let isWebFallback = false;

/**
 * Generates sample demo accounts and payments dynamically relative to the current date.
 * Guarantees that active, overdue, and penalty states are demonstrated regardless of device clock.
 */
export function getSampleData() {
  const today = new Date();
  const todayStr = today.toISOString().substring(0, 10);

  const accounts = [
    {
      account_id: 1001,
      name: "Juan Dela Cruz",
      date_of_start: addMonthsEdate(todayStr, -12),
      first_due_date: addMonthsEdate(todayStr, -11),
      land_title_number: "TCT-12345",
      land_area_sqm: 500,
      total_contract_amount: 1500000,
      down_payment: 50000,
      is_dp_paid: 1,
      agreed_dp_due: addMonthsEdate(todayStr, -12),
      monthly_amortization: 12083.33,
      num_of_months: 180,
      remarks: "Sample buyer 1 - On Track (Advance Payer, 180 Mos Term)"
    },
    {
      account_id: 1002,
      name: "Pedro Santos",
      date_of_start: addMonthsEdate(todayStr, -4),
      first_due_date: addMonthsEdate(todayStr, -3),
      land_title_number: "TCT-67890",
      land_area_sqm: 100,
      total_contract_amount: 300000,
      down_payment: 20000,
      is_dp_paid: 1,
      agreed_dp_due: addMonthsEdate(todayStr, -4),
      monthly_amortization: 2333.33,
      num_of_months: 120,
      remarks: "Sample buyer 2 - Delinquent (3 Consecutive Missed Months, 10% Late Penalty)"
    },
    {
      account_id: 1003,
      name: "Maria Clara",
      date_of_start: addMonthsEdate(todayStr, -2),
      first_due_date: addMonthsEdate(todayStr, 1),
      land_title_number: "TCT-99999",
      land_area_sqm: 250,
      total_contract_amount: 500000,
      down_payment: 20000,
      is_dp_paid: 0,
      agreed_dp_due: addMonthsEdate(todayStr, -1),
      monthly_amortization: 4166.67,
      num_of_months: 120,
      remarks: "Sample buyer 3 - Down Payment Overdue (1% Contract Amount Penalty, DP ₱20,000 Unpaid)"
    }
  ];

  const payments = [
    {
      payment_id: 1,
      account_id: 1001,
      payment_date: addMonthsEdate(todayStr, -11),
      payment_type: "Monthly Amortization",
      amount_paid: 12083.33,
      amortization_amount: 12083.33,
      penalty_amount: 0,
      month_covered: "Month 1",
      for_month_no: 1,
      receipt_no: "OR-10001",
      payment_method: "Cash",
      remarks: "1st monthly amortization"
    },
    {
      payment_id: 2,
      account_id: 1001,
      payment_date: addMonthsEdate(todayStr, -10),
      payment_type: "Monthly Amortization",
      amount_paid: 12083.33,
      amortization_amount: 12083.33,
      penalty_amount: 0,
      month_covered: "Month 2",
      for_month_no: 2,
      receipt_no: "OR-10002",
      payment_method: "Cash",
      remarks: "2nd monthly amortization"
    },
    {
      payment_id: 3,
      account_id: 1001,
      payment_date: addMonthsEdate(todayStr, -9),
      payment_type: "Monthly Amortization",
      amount_paid: 12083.33,
      amortization_amount: 12083.33,
      penalty_amount: 0,
      month_covered: "Month 3",
      for_month_no: 3,
      receipt_no: "OR-10003",
      payment_method: "Cash",
      remarks: "3rd monthly amortization"
    },
    {
      payment_id: 4,
      account_id: 1001,
      payment_date: addMonthsEdate(todayStr, -6),
      payment_type: "Monthly Amortization",
      amount_paid: 145000.00,
      amortization_amount: 145000.00,
      penalty_amount: 0,
      month_covered: "Advance Amortization",
      for_month_no: 4,
      receipt_no: "OR-10004",
      payment_method: "Bank Transfer",
      remarks: "Advance lump sum amortization"
    }
  ];

  return { accounts, payments };
}

export const INITIAL_ACCOUNTS = getSampleData().accounts;
export const INITIAL_PAYMENTS = getSampleData().payments;

// Helper: Web localStorage store
const WEB_STORAGE_KEYS = {
  ACCOUNTS: 'land_amortization_accounts',
  PAYMENTS: 'land_amortization_payments',
  PENALTIES: 'land_amortization_penalties',
  SETTINGS: 'land_amortization_settings',
  EXPORT_LOG: 'land_amortization_export_log'
};

const TOMBSTONE_KEYS = {
  DELETED_ACCOUNTS: 'land_amortization_deleted_accounts',
  DELETED_PAYMENTS: 'land_amortization_deleted_payments'
};

export function recordDeletedAccount(accountId) {
  try {
    const list = JSON.parse(localStorage.getItem(TOMBSTONE_KEYS.DELETED_ACCOUNTS) || '[]');
    const strId = String(accountId);
    if (!list.some(item => (typeof item === 'object' && item ? String(item.id) : String(item)) === strId)) {
      list.push({ id: strId, deleted_at: new Date().toISOString() });
      localStorage.setItem(TOMBSTONE_KEYS.DELETED_ACCOUNTS, JSON.stringify(list));
    }
  } catch (_) {}
}

export function recordDeletedPayment(paymentId) {
  try {
    const list = JSON.parse(localStorage.getItem(TOMBSTONE_KEYS.DELETED_PAYMENTS) || '[]');
    const strId = String(paymentId);
    if (!list.some(item => (typeof item === 'object' && item ? String(item.id) : String(item)) === strId)) {
      list.push({ id: strId, deleted_at: new Date().toISOString() });
      localStorage.setItem(TOMBSTONE_KEYS.DELETED_PAYMENTS, JSON.stringify(list));
    }
  } catch (_) {}
}

export function getDeletedRecords() {
  try {
    const rawAccs = JSON.parse(localStorage.getItem(TOMBSTONE_KEYS.DELETED_ACCOUNTS) || '[]');
    const rawPays = JSON.parse(localStorage.getItem(TOMBSTONE_KEYS.DELETED_PAYMENTS) || '[]');
    const deletedAccounts = rawAccs.map(item => (typeof item === 'object' && item && item.id ? String(item.id) : String(item)));
    const deletedPayments = rawPays.map(item => (typeof item === 'object' && item && item.id ? String(item.id) : String(item)));
    return { deletedAccounts, deletedPayments, rawAccs, rawPays };
  } catch (_) {
    return { deletedAccounts: [], deletedPayments: [], rawAccs: [], rawPays: [] };
  }
}

export function pruneDeletedRecords(syncedAccountIds = [], syncedPaymentIds = []) {
  try {
    const accSet = new Set(syncedAccountIds.map(String));
    const paySet = new Set(syncedPaymentIds.map(String));
    const rawAccs = JSON.parse(localStorage.getItem(TOMBSTONE_KEYS.DELETED_ACCOUNTS) || '[]');
    const rawPays = JSON.parse(localStorage.getItem(TOMBSTONE_KEYS.DELETED_PAYMENTS) || '[]');
    const remAccs = rawAccs.filter(item => !accSet.has(typeof item === 'object' && item ? String(item.id) : String(item)));
    const remPays = rawPays.filter(item => !paySet.has(typeof item === 'object' && item ? String(item.id) : String(item)));
    localStorage.setItem(TOMBSTONE_KEYS.DELETED_ACCOUNTS, JSON.stringify(remAccs));
    localStorage.setItem(TOMBSTONE_KEYS.DELETED_PAYMENTS, JSON.stringify(remPays));
  } catch (_) {}
}

export function clearDeletedRecords() {
  try {
    localStorage.removeItem(TOMBSTONE_KEYS.DELETED_ACCOUNTS);
    localStorage.removeItem(TOMBSTONE_KEYS.DELETED_PAYMENTS);
  } catch (_) {}
}

function getWebData(key, defaultVal = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setWebData(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('LocalStorage write error', err);
  }
}

/**
 * Initialize Database (Electron Native SQLite, Cordova SQLite, or Web Storage Fallback)
 */
export async function initDatabase() {
  // 1. Electron Desktop Environment (Native SQLite)
  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.sqlite) {
    console.log('[Database] Initializing Electron Native SQLite via IPC...');
    isWebFallback = false;
    try {
      // Execute any startup verification & migrations
      await window.electronAPI.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS land_accounts (
          account_id            INTEGER PRIMARY KEY,
          name                  TEXT NOT NULL,
          date_of_start         TEXT NOT NULL,
          first_due_date        TEXT NOT NULL,
          land_title_number     TEXT,
          land_area_sqm         REAL,
          total_contract_amount REAL NOT NULL,
          down_payment          REAL DEFAULT 0,
          agreed_dp_due         TEXT,
          monthly_amortization  REAL NOT NULL,
          num_of_months         INTEGER NOT NULL DEFAULT 120,
          remarks               TEXT,
          is_dp_paid            INTEGER DEFAULT 0,
          created_at            TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at            TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payments (
          payment_id          INTEGER PRIMARY KEY AUTOINCREMENT,
          account_id          INTEGER NOT NULL,
          payment_date        TEXT NOT NULL,
          payment_type        TEXT NOT NULL DEFAULT 'Monthly Amortization',
          amount_paid         REAL NOT NULL,
          receipt_no          TEXT,
          payment_method      TEXT DEFAULT 'Cash',
          remarks             TEXT,
          month_covered       TEXT,
          for_month_no        INTEGER,
          amortization_amount REAL DEFAULT 0,
          penalty_amount      REAL DEFAULT 0,
          created_at          TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES land_accounts(account_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_payments_account ON payments(account_id, payment_type);

        CREATE TABLE IF NOT EXISTS penalties (
          penalty_id     INTEGER PRIMARY KEY AUTOINCREMENT,
          account_id     INTEGER NOT NULL,
          penalty_type   TEXT NOT NULL,
          month_no       INTEGER,
          month_covered  TEXT,
          amount         REAL NOT NULL,
          assessed_date  TEXT NOT NULL,
          status         TEXT DEFAULT 'UNPAID',
          amount_paid    REAL DEFAULT 0,
          remarks        TEXT,
          created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES land_accounts(account_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_penalties_account ON penalties(account_id, status);

        CREATE TABLE IF NOT EXISTS app_settings (
          key   TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS export_log (
          log_id            INTEGER PRIMARY KEY AUTOINCREMENT,
          export_type       TEXT NOT NULL,
          file_name         TEXT NOT NULL,
          accounts_exported INTEGER DEFAULT 0,
          payments_exported INTEGER DEFAULT 0,
          created_at        TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Safe migrations for existing tables
      try {
        const payCols = await window.electronAPI.sqlite.query('PRAGMA table_info(payments);');
        const paySet = new Set((payCols || []).map(c => c.name));
        if (!paySet.has('month_covered')) {
          await window.electronAPI.sqlite.exec('ALTER TABLE payments ADD COLUMN month_covered TEXT;');
        }
        if (!paySet.has('for_month_no')) {
          await window.electronAPI.sqlite.exec('ALTER TABLE payments ADD COLUMN for_month_no INTEGER;');
        }
        if (!paySet.has('amortization_amount')) {
          await window.electronAPI.sqlite.exec('ALTER TABLE payments ADD COLUMN amortization_amount REAL DEFAULT 0;');
        }
        if (!paySet.has('penalty_amount')) {
          await window.electronAPI.sqlite.exec('ALTER TABLE payments ADD COLUMN penalty_amount REAL DEFAULT 0;');
        }

        const accCols = await window.electronAPI.sqlite.query('PRAGMA table_info(land_accounts);');
        const accSet = new Set((accCols || []).map(c => c.name));
        if (!accSet.has('is_dp_paid')) {
          await window.electronAPI.sqlite.exec('ALTER TABLE land_accounts ADD COLUMN is_dp_paid INTEGER DEFAULT 0;');
        }

        // Migrate legacy 'Installment' records to 'Monthly Amortization' and normalize sample data
        await window.electronAPI.sqlite.exec(`
          UPDATE payments SET payment_type = 'Monthly Amortization' WHERE payment_type = 'Installment';
          UPDATE payments SET remarks = REPLACE(remarks, 'installment', 'monthly amortization') WHERE remarks LIKE '%installment%';
          UPDATE payments SET remarks = REPLACE(remarks, 'Installment', 'Monthly Amortization') WHERE remarks LIKE '%Installment%';
          UPDATE payments SET for_month_no = 1, month_covered = 'Month 1' WHERE receipt_no = 'OR-10001' AND (for_month_no IS NULL OR for_month_no = 0);
          UPDATE payments SET for_month_no = 2, month_covered = 'Month 2' WHERE receipt_no = 'OR-10002' AND (for_month_no IS NULL OR for_month_no = 0);
          UPDATE payments SET for_month_no = 3, month_covered = 'Month 3' WHERE receipt_no = 'OR-10003' AND (for_month_no IS NULL OR for_month_no = 0);
          UPDATE payments SET for_month_no = 4, month_covered = 'Advance Amortization' WHERE receipt_no = 'OR-10004' AND (for_month_no IS NULL OR for_month_no = 0);
          UPDATE payments SET amortization_amount = amount_paid WHERE payment_type = 'Monthly Amortization' AND (amortization_amount IS NULL OR amortization_amount = 0);
        `);
      } catch (colErr) {
        console.warn('[Database] Column migration check note:', colErr.message);
      }

      console.log('[Database] Electron SQLite initialized successfully.');
      return true;
    } catch (e) {
      console.error('[Database] Failed to verify Electron SQLite schemas:', e);
      return true;
    }
  }

  // 2. Cordova Mobile Environment
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.sqlitePlugin && typeof window.sqlitePlugin.openDatabase === 'function') {
      console.log('Initializing Cordova SQLite Plugin...');
      isWebFallback = false;
      try {
        dbInstance = window.sqlitePlugin.openDatabase({
          name: 'land_amortization.db',
          location: 'default',
          androidDatabaseProvider: 'system'
        });

        dbInstance.transaction(tx => {
          tx.executeSql(CREATE_TABLE_ACCOUNTS);
          tx.executeSql(CREATE_TABLE_PAYMENTS);
          tx.executeSql(CREATE_INDEX_PAYMENTS);
          tx.executeSql(CREATE_TABLE_PENALTIES);
          tx.executeSql(CREATE_INDEX_PENALTIES);
          tx.executeSql(CREATE_TABLE_SETTINGS);
          tx.executeSql(CREATE_TABLE_EXPORT_LOG);
          tx.executeSql('ALTER TABLE land_accounts ADD COLUMN is_dp_paid INTEGER DEFAULT 0;', [], () => {}, () => false);
          tx.executeSql('ALTER TABLE payments ADD COLUMN month_covered TEXT;', [], () => {}, () => false);
          tx.executeSql('ALTER TABLE payments ADD COLUMN for_month_no INTEGER;', [], () => {}, () => false);
          tx.executeSql('ALTER TABLE payments ADD COLUMN amortization_amount REAL DEFAULT 0;', [], () => {}, () => false);
          tx.executeSql('ALTER TABLE payments ADD COLUMN penalty_amount REAL DEFAULT 0;', [], () => {}, () => false);
          tx.executeSql("UPDATE payments SET payment_type = 'Monthly Amortization' WHERE payment_type = 'Installment';", [], () => {}, () => false);
          tx.executeSql("UPDATE payments SET remarks = REPLACE(remarks, 'installment', 'monthly amortization') WHERE remarks LIKE '%installment%';", [], () => {}, () => false);
          tx.executeSql("UPDATE payments SET remarks = REPLACE(remarks, 'Installment', 'Monthly Amortization') WHERE remarks LIKE '%Installment%';", [], () => {}, () => false);
          tx.executeSql("UPDATE payments SET for_month_no = 1, month_covered = 'Month 1' WHERE receipt_no = 'OR-10001' AND (for_month_no IS NULL OR for_month_no = 0);", [], () => {}, () => false);
          tx.executeSql("UPDATE payments SET for_month_no = 2, month_covered = 'Month 2' WHERE receipt_no = 'OR-10002' AND (for_month_no IS NULL OR for_month_no = 0);", [], () => {}, () => false);
          tx.executeSql("UPDATE payments SET for_month_no = 3, month_covered = 'Month 3' WHERE receipt_no = 'OR-10003' AND (for_month_no IS NULL OR for_month_no = 0);", [], () => {}, () => false);
          tx.executeSql("UPDATE payments SET for_month_no = 4, month_covered = 'Advance Amortization' WHERE receipt_no = 'OR-10004' AND (for_month_no IS NULL OR for_month_no = 0);", [], () => {}, () => false);
          tx.executeSql("UPDATE payments SET amortization_amount = amount_paid WHERE payment_type = 'Monthly Amortization' AND (amortization_amount IS NULL OR amortization_amount = 0);", [], () => {}, () => false);
        }, (err) => {
          console.error('Database migration error:', err);
          reject(err);
        }, async () => {
          console.log('Cordova SQLite initialized successfully.');
          await checkAndSeedData();
          resolve(true);
        });
      } catch (e) {
        console.warn('Cordova SQLite failed, falling back to web storage', e);
        setupWebStorage();
        resolve(true);
      }
    } else {
      console.log('Running in browser dev mode: using Web Storage DB shim');
      setupWebStorage();
      resolve(true);
    }
  });
}

function setupWebStorage() {
  isWebFallback = true;
  const accounts = getWebData(WEB_STORAGE_KEYS.ACCOUNTS, null);
  if (accounts === null) {
    setWebData(WEB_STORAGE_KEYS.ACCOUNTS, []);
    setWebData(WEB_STORAGE_KEYS.PAYMENTS, []);
    setWebData(WEB_STORAGE_KEYS.PENALTIES, []);
    setWebData(WEB_STORAGE_KEYS.SETTINGS, { theme: 'light', currency: 'PHP' });
    setWebData(WEB_STORAGE_KEYS.EXPORT_LOG, []);
    console.log('Web Storage initialized clean with 0 accounts.');
  } else {
    if (getWebData(WEB_STORAGE_KEYS.PENALTIES, null) === null) {
      setWebData(WEB_STORAGE_KEYS.PENALTIES, []);
    }
    // Auto-migrate web storage payments
    const storedPays = getWebData(WEB_STORAGE_KEYS.PAYMENTS, []);
    let hasWebMigrate = false;
    for (const p of storedPays) {
      if (p.payment_type === 'Installment') {
        p.payment_type = 'Monthly Amortization';
        hasWebMigrate = true;
      }
      if (p.remarks && /installment/i.test(p.remarks)) {
        p.remarks = p.remarks.replace(/installment/gi, 'monthly amortization');
        hasWebMigrate = true;
      }
      if (p.receipt_no === 'OR-10001' && (!p.for_month_no || p.for_month_no === 0)) {
        p.for_month_no = 1;
        p.month_covered = 'Month 1';
        hasWebMigrate = true;
      }
      if (p.receipt_no === 'OR-10002' && (!p.for_month_no || p.for_month_no === 0)) {
        p.for_month_no = 2;
        p.month_covered = 'Month 2';
        hasWebMigrate = true;
      }
      if (p.receipt_no === 'OR-10003' && (!p.for_month_no || p.for_month_no === 0)) {
        p.for_month_no = 3;
        p.month_covered = 'Month 3';
        hasWebMigrate = true;
      }
      if (p.receipt_no === 'OR-10004' && (!p.for_month_no || p.for_month_no === 0)) {
        p.for_month_no = 4;
        p.month_covered = 'Advance Amortization';
        hasWebMigrate = true;
      }
      if (p.payment_type === 'Monthly Amortization' && (!p.amortization_amount || p.amortization_amount === 0)) {
        p.amortization_amount = p.amount_paid;
        hasWebMigrate = true;
      }
    }
    if (hasWebMigrate) {
      setWebData(WEB_STORAGE_KEYS.PAYMENTS, storedPays);
    }
  }
}

async function checkAndSeedData() {
  // Start with clean database; user can load sample demo data on demand
  console.log('SQLite database ready for user accounts.');
}

/**
 * Execute a SQL query on native SQLite (Electron IPC or Cordova Plugin)
 */
async function runSql(sql, params = []) {
  // Electron Native SQLite path
  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.sqlite) {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
      const rows = await window.electronAPI.sqlite.query(sql, params);
      return { rows: rows || [], insertId: null, rowsAffected: 0 };
    } else {
      const res = await window.electronAPI.sqlite.run(sql, params);
      return {
        rows: [],
        insertId: res ? res.lastInsertRowid : null,
        rowsAffected: res ? res.changes : 0
      };
    }
  }

  // Cordova SQLite path
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      return reject(new Error('Database not initialized'));
    }
    dbInstance.executeSql(sql, params, (res) => {
      const rows = [];
      if (res && res.rows) {
        for (let i = 0; i < res.rows.length; i++) {
          rows.push(res.rows.item(i));
        }
      }
      resolve({
        rows,
        insertId: res ? res.insertId : null,
        rowsAffected: res ? res.rowsAffected : 0
      });
    }, (err) => {
      reject(err);
    });
  });
}

// ============================================
// ACCOUNT OPERATIONS
// ============================================

export async function getAccounts() {
  if (isWebFallback) {
    return getWebData(WEB_STORAGE_KEYS.ACCOUNTS, []);
  }
  const res = await runSql('SELECT * FROM land_accounts ORDER BY account_id ASC');
  return res.rows;
}

export async function getAccountById(accountId) {
  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.ACCOUNTS, []);
    return list.find(a => String(a.account_id) === String(accountId)) || null;
  }
  const res = await runSql('SELECT * FROM land_accounts WHERE account_id = ?', [accountId]);
  return res.rows.length > 0 ? res.rows[0] : null;
}

export async function insertAccount(acc) {
  const account = {
    account_id: Number(acc.account_id),
    name: String(acc.name || '').trim(),
    date_of_start: acc.date_of_start || '',
    first_due_date: acc.first_due_date || '',
    land_title_number: acc.land_title_number || '',
    land_area_sqm: Number(acc.land_area_sqm) || 0,
    total_contract_amount: Number(acc.total_contract_amount) || 0,
    down_payment: Number(acc.down_payment) || 0,
    agreed_dp_due: acc.agreed_dp_due || '',
    monthly_amortization: Number(acc.monthly_amortization) || 0,
    num_of_months: Number(acc.num_of_months) || 120,
    remarks: acc.remarks || '',
    is_dp_paid: acc.is_dp_paid ? 1 : 0,
    created_at: acc.created_at || new Date().toISOString(),
    updated_at: acc.updated_at || new Date().toISOString()
  };

  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.ACCOUNTS, []);
    const existingIdx = list.findIndex(a => Number(a.account_id) === account.account_id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...account };
      setWebData(WEB_STORAGE_KEYS.ACCOUNTS, list);
      return list[existingIdx];
    }
    list.push(account);
    setWebData(WEB_STORAGE_KEYS.ACCOUNTS, list);
    return account;
  }

  const sql = `
    INSERT OR REPLACE INTO land_accounts (
      account_id, name, date_of_start, first_due_date, land_title_number,
      land_area_sqm, total_contract_amount, down_payment, agreed_dp_due,
      monthly_amortization, num_of_months, remarks, is_dp_paid, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await runSql(sql, [
    account.account_id, account.name, account.date_of_start, account.first_due_date,
    account.land_title_number, account.land_area_sqm, account.total_contract_amount,
    account.down_payment, account.agreed_dp_due, account.monthly_amortization,
    account.num_of_months, account.remarks, account.is_dp_paid,
    account.created_at, account.updated_at
  ]);
  return account;
}

export const upsertAccount = insertAccount;

export async function updateAccount(acc) {
  const account = {
    account_id: Number(acc.account_id),
    name: String(acc.name || '').trim(),
    date_of_start: acc.date_of_start || '',
    first_due_date: acc.first_due_date || '',
    land_title_number: acc.land_title_number || '',
    land_area_sqm: Number(acc.land_area_sqm) || 0,
    total_contract_amount: Number(acc.total_contract_amount) || 0,
    down_payment: Number(acc.down_payment) || 0,
    agreed_dp_due: acc.agreed_dp_due || '',
    monthly_amortization: Number(acc.monthly_amortization) || 0,
    num_of_months: Number(acc.num_of_months) || 120,
    remarks: acc.remarks || '',
    is_dp_paid: acc.is_dp_paid ? 1 : 0,
    updated_at: acc.updated_at || new Date().toISOString()
  };

  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.ACCOUNTS, []);
    const idx = list.findIndex(a => Number(a.account_id) === account.account_id);
    if (idx === -1) throw new Error('Account not found');
    list[idx] = { ...list[idx], ...account };
    setWebData(WEB_STORAGE_KEYS.ACCOUNTS, list);
    return list[idx];
  }

  const sql = `
    UPDATE land_accounts SET
      name = ?, date_of_start = ?, first_due_date = ?, land_title_number = ?,
      land_area_sqm = ?, total_contract_amount = ?, down_payment = ?, agreed_dp_due = ?,
      monthly_amortization = ?, num_of_months = ?, remarks = ?, is_dp_paid = ?, updated_at = ?
    WHERE account_id = ?
  `;
  await runSql(sql, [
    account.name, account.date_of_start, account.first_due_date, account.land_title_number,
    account.land_area_sqm, account.total_contract_amount, account.down_payment,
    account.agreed_dp_due, account.monthly_amortization, account.num_of_months,
    account.remarks, account.is_dp_paid, account.updated_at, account.account_id
  ]);
  return account;
}

export async function deleteAccount(accountId) {
  recordDeletedAccount(accountId);
  if (isWebFallback) {
    let accounts = getWebData(WEB_STORAGE_KEYS.ACCOUNTS, []);
    accounts = accounts.filter(a => Number(a.account_id) !== Number(accountId));
    setWebData(WEB_STORAGE_KEYS.ACCOUNTS, accounts);

    let payments = getWebData(WEB_STORAGE_KEYS.PAYMENTS, []);
    payments = payments.filter(p => Number(p.account_id) !== Number(accountId));
    setWebData(WEB_STORAGE_KEYS.PAYMENTS, payments);

    let penalties = getWebData(WEB_STORAGE_KEYS.PENALTIES, []);
    penalties = penalties.filter(p => Number(p.account_id) !== Number(accountId));
    setWebData(WEB_STORAGE_KEYS.PENALTIES, penalties);
    return true;
  }

  await runSql('DELETE FROM penalties WHERE account_id = ?', [accountId]);
  await runSql('DELETE FROM payments WHERE account_id = ?', [accountId]);
  await runSql('DELETE FROM land_accounts WHERE account_id = ?', [accountId]);
  return true;
}

// ============================================
// PAYMENT OPERATIONS
// ============================================

export async function getPayments() {
  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.PAYMENTS, []);
    return list.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  }
  const res = await runSql('SELECT * FROM payments ORDER BY payment_date DESC, payment_id DESC');
  return res.rows;
}

export async function getPaymentsByAccount(accountId) {
  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.PAYMENTS, []);
    return list.filter(p => String(p.account_id) === String(accountId));
  }
  const res = await runSql('SELECT * FROM payments WHERE account_id = ? ORDER BY payment_date ASC, payment_id ASC', [accountId]);
  return res.rows;
}

export async function insertPayment(p) {
  const pType = p.payment_type || 'Monthly Amortization';
  const totalAmount = Number(p.amount_paid) || 0;
  let amortAmount = p.amortization_amount !== undefined ? Number(p.amortization_amount) : 0;
  let penAmount = p.penalty_amount !== undefined ? Number(p.penalty_amount) : 0;

  if (pType === 'Penalty') {
    penAmount = totalAmount;
    amortAmount = 0;
  } else if (pType === 'Monthly Amortization' || pType === 'Installment') {
    amortAmount = totalAmount;
    penAmount = 0;
  } else if (pType === 'Amortization + Penalty') {
    if (amortAmount === 0 && penAmount === 0) {
      amortAmount = totalAmount;
    }
  }

  const payment = {
    account_id: Number(p.account_id),
    payment_date: p.payment_date,
    payment_type: pType,
    amount_paid: totalAmount,
    receipt_no: p.receipt_no || '',
    payment_method: p.payment_method || 'Cash',
    remarks: p.remarks || '',
    month_covered: p.month_covered || '',
    for_month_no: p.for_month_no !== null && p.for_month_no !== undefined ? Number(p.for_month_no) : null,
    amortization_amount: amortAmount,
    penalty_amount: penAmount,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString()
  };

  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.PAYMENTS, []);
    const targetId = p.payment_id ? Number(p.payment_id) : (list.length > 0 ? Math.max(...list.map(item => item.payment_id || 0)) + 1 : 1);
    const newPayment = { ...payment, payment_id: targetId };
    const existingIdx = list.findIndex(item => Number(item.payment_id) === targetId);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...newPayment };
    } else {
      list.push(newPayment);
    }
    setWebData(WEB_STORAGE_KEYS.PAYMENTS, list);
    return newPayment;
  }

  if (p.payment_id) {
    const sql = `
      INSERT OR REPLACE INTO payments (
        payment_id, account_id, payment_date, payment_type, amount_paid, receipt_no, payment_method, remarks,
        month_covered, for_month_no, amortization_amount, penalty_amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await runSql(sql, [
      p.payment_id, payment.account_id, payment.payment_date, payment.payment_type,
      payment.amount_paid, payment.receipt_no, payment.payment_method, payment.remarks,
      payment.month_covered, payment.for_month_no, payment.amortization_amount, payment.penalty_amount,
      payment.created_at
    ]);
    return { ...payment, payment_id: p.payment_id };
  }

  const sql = `
    INSERT INTO payments (
      account_id, payment_date, payment_type, amount_paid, receipt_no, payment_method, remarks,
      month_covered, for_month_no, amortization_amount, penalty_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const res = await runSql(sql, [
    payment.account_id, payment.payment_date, payment.payment_type,
    payment.amount_paid, payment.receipt_no, payment.payment_method, payment.remarks,
    payment.month_covered, payment.for_month_no, payment.amortization_amount, payment.penalty_amount
  ]);
  return { ...payment, payment_id: res.insertId };
}

export async function updatePayment(p) {
  const paymentId = Number(p.payment_id);
  const pType = p.payment_type || 'Monthly Amortization';
  const totalAmount = Number(p.amount_paid) || 0;
  let amortAmount = p.amortization_amount !== undefined ? Number(p.amortization_amount) : 0;
  let penAmount = p.penalty_amount !== undefined ? Number(p.penalty_amount) : 0;

  if (pType === 'Penalty') {
    penAmount = totalAmount;
    amortAmount = 0;
  } else if (pType === 'Monthly Amortization' || pType === 'Installment') {
    amortAmount = totalAmount;
    penAmount = 0;
  }

  const payment = {
    account_id: Number(p.account_id),
    payment_date: p.payment_date,
    payment_type: pType,
    amount_paid: totalAmount,
    receipt_no: p.receipt_no || '',
    payment_method: p.payment_method || 'Cash',
    remarks: p.remarks || '',
    month_covered: p.month_covered || '',
    for_month_no: p.for_month_no !== null && p.for_month_no !== undefined ? Number(p.for_month_no) : null,
    amortization_amount: amortAmount,
    penalty_amount: penAmount,
    updated_at: p.updated_at || new Date().toISOString()
  };

  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.PAYMENTS, []);
    const idx = list.findIndex(item => Number(item.payment_id) === paymentId);
    if (idx === -1) throw new Error('Payment not found');
    list[idx] = { ...list[idx], ...payment };
    setWebData(WEB_STORAGE_KEYS.PAYMENTS, list);
    return { ...payment, payment_id: paymentId };
  }

  const sql = `
    UPDATE payments SET
      account_id = ?, payment_date = ?, payment_type = ?, amount_paid = ?,
      receipt_no = ?, payment_method = ?, remarks = ?,
      month_covered = ?, for_month_no = ?, amortization_amount = ?, penalty_amount = ?
    WHERE payment_id = ?
  `;
  await runSql(sql, [
    payment.account_id, payment.payment_date, payment.payment_type,
    payment.amount_paid, payment.receipt_no, payment.payment_method, payment.remarks,
    payment.month_covered, payment.for_month_no, payment.amortization_amount, payment.penalty_amount,
    paymentId
  ]);
  return { ...payment, payment_id: paymentId };
}

export async function deletePayment(paymentId) {
  recordDeletedPayment(paymentId);
  if (isWebFallback) {
    let list = getWebData(WEB_STORAGE_KEYS.PAYMENTS, []);
    list = list.filter(p => Number(p.payment_id) !== Number(paymentId));
    setWebData(WEB_STORAGE_KEYS.PAYMENTS, list);
    return true;
  }
  await runSql('DELETE FROM payments WHERE payment_id = ?', [paymentId]);
  return true;
}

// ============================================
// PENALTY OPERATIONS
// ============================================

export async function getPenalties(accountId = null) {
  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.PENALTIES, []);
    return accountId ? list.filter(p => String(p.account_id) === String(accountId)) : list;
  }
  if (accountId) {
    const res = await runSql('SELECT * FROM penalties WHERE account_id = ? ORDER BY assessed_date ASC, penalty_id ASC', [accountId]);
    return res.rows;
  }
  const res = await runSql('SELECT * FROM penalties ORDER BY assessed_date ASC, penalty_id ASC');
  return res.rows;
}

export async function insertPenalty(p) {
  const penalty = {
    account_id: Number(p.account_id),
    penalty_type: p.penalty_type || '10% Late Penalty',
    month_no: p.month_no ? Number(p.month_no) : null,
    month_covered: p.month_covered || '',
    amount: Number(p.amount !== undefined ? p.amount : p.penalty_amount) || 0,
    assessed_date: p.assessed_date || p.due_date || new Date().toISOString().substring(0, 10),
    status: p.status || 'UNPAID',
    amount_paid: Number(p.amount_paid !== undefined ? p.amount_paid : p.paid_amount) || 0,
    remarks: p.remarks || p.penalty_reason || ''
  };

  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.PENALTIES, []);
    const targetId = p.penalty_id ? Number(p.penalty_id) : (list.length > 0 ? Math.max(...list.map(item => item.penalty_id || 0)) + 1 : 1);
    const newPenalty = { ...penalty, penalty_id: targetId };
    const existingIdx = list.findIndex(item => Number(item.penalty_id) === targetId);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...newPenalty };
    } else {
      list.push(newPenalty);
    }
    setWebData(WEB_STORAGE_KEYS.PENALTIES, list);
    return newPenalty;
  }

  if (p.penalty_id) {
    const sql = `
      INSERT OR REPLACE INTO penalties (
        penalty_id, account_id, penalty_type, month_no, month_covered, amount, assessed_date, status, amount_paid, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await runSql(sql, [
      p.penalty_id, penalty.account_id, penalty.penalty_type, penalty.month_no, penalty.month_covered,
      penalty.amount, penalty.assessed_date, penalty.status, penalty.amount_paid, penalty.remarks
    ]);
    return { ...penalty, penalty_id: p.penalty_id };
  }

  const sql = `
    INSERT INTO penalties (
      account_id, penalty_type, month_no, month_covered, amount, assessed_date, status, amount_paid, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const res = await runSql(sql, [
    penalty.account_id, penalty.penalty_type, penalty.month_no, penalty.month_covered,
    penalty.amount, penalty.assessed_date, penalty.status, penalty.amount_paid, penalty.remarks
  ]);
  return { ...penalty, penalty_id: res.insertId };
}

export async function updatePenalty(p) {
  const penaltyId = Number(p.penalty_id);
  const penalty = {
    account_id: Number(p.account_id),
    penalty_type: p.penalty_type,
    month_no: p.month_no ? Number(p.month_no) : null,
    month_covered: p.month_covered || '',
    amount: Number(p.amount) || 0,
    assessed_date: p.assessed_date,
    status: p.status || 'UNPAID',
    amount_paid: Number(p.amount_paid) || 0,
    remarks: p.remarks || ''
  };

  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.PENALTIES, []);
    const idx = list.findIndex(item => Number(item.penalty_id) === penaltyId);
    if (idx === -1) throw new Error('Penalty not found');
    list[idx] = { ...list[idx], ...penalty };
    setWebData(WEB_STORAGE_KEYS.PENALTIES, list);
    return { ...penalty, penalty_id: penaltyId };
  }

  const sql = `
    UPDATE penalties SET
      account_id = ?, penalty_type = ?, month_no = ?, month_covered = ?,
      amount = ?, assessed_date = ?, status = ?, amount_paid = ?, remarks = ?
    WHERE penalty_id = ?
  `;
  await runSql(sql, [
    penalty.account_id, penalty.penalty_type, penalty.month_no, penalty.month_covered,
    penalty.amount, penalty.assessed_date, penalty.status, penalty.amount_paid, penalty.remarks,
    penaltyId
  ]);
  return { ...penalty, penalty_id: penaltyId };
}

export async function waivePenalty(penaltyId, remarks = 'Waived by management') {
  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.PENALTIES, []);
    const idx = list.findIndex(item => Number(item.penalty_id) === Number(penaltyId));
    if (idx !== -1) {
      list[idx].status = 'WAIVED';
      list[idx].remarks = (list[idx].remarks ? list[idx].remarks + ' | ' : '') + remarks;
      setWebData(WEB_STORAGE_KEYS.PENALTIES, list);
      return list[idx];
    }
    return null;
  }
  await runSql("UPDATE penalties SET status = 'WAIVED', remarks = COALESCE(remarks || ' | ', '') || ? WHERE penalty_id = ?", [remarks, penaltyId]);
  return true;
}

export async function deletePenalty(penaltyId) {
  if (isWebFallback) {
    let list = getWebData(WEB_STORAGE_KEYS.PENALTIES, []);
    list = list.filter(p => Number(p.penalty_id) !== Number(penaltyId));
    setWebData(WEB_STORAGE_KEYS.PENALTIES, list);
    return true;
  }
  await runSql('DELETE FROM penalties WHERE penalty_id = ?', [penaltyId]);
  return true;
}

// ============================================
// EXPORT LOG OPERATIONS
// ============================================

export async function getExportLogs() {
  if (isWebFallback) {
    return getWebData(WEB_STORAGE_KEYS.EXPORT_LOG, []);
  }
  const res = await runSql('SELECT * FROM export_log ORDER BY created_at DESC LIMIT 50');
  return res.rows;
}

export async function addExportLog({ export_type, file_name, accounts_exported, payments_exported }) {
  const safeFileName = file_name || `Land_Amortization_Tracker_${new Date().toISOString().substring(0, 10)}.xlsx`;
  const safeExportType = export_type || 'local_save';

  const item = {
    export_type: safeExportType,
    file_name: safeFileName,
    accounts_exported: accounts_exported || 0,
    payments_exported: payments_exported || 0,
    created_at: new Date().toISOString()
  };

  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.EXPORT_LOG, []);
    const nextId = list.length > 0 ? Math.max(...list.map(l => l.log_id || 0)) + 1 : 1;
    list.unshift({ ...item, log_id: nextId });
    setWebData(WEB_STORAGE_KEYS.EXPORT_LOG, list);
    return item;
  }

  await runSql(
    'INSERT INTO export_log (export_type, file_name, accounts_exported, payments_exported) VALUES (?, ?, ?, ?)',
    [safeExportType, safeFileName, accounts_exported || 0, payments_exported || 0]
  );
  return item;
}

// ============================================
// RESET & BACKUP UTILS
// ============================================

export async function resetToSampleData() {
  const { accounts, payments } = getSampleData();
  if (isWebFallback) {
    setWebData(WEB_STORAGE_KEYS.ACCOUNTS, accounts);
    setWebData(WEB_STORAGE_KEYS.PAYMENTS, payments);
    setWebData(WEB_STORAGE_KEYS.EXPORT_LOG, []);
    return true;
  }
  await runSql('DELETE FROM payments');
  await runSql('DELETE FROM land_accounts');
  for (const acc of accounts) {
    await insertAccount(acc);
  }
  for (const p of payments) {
    await insertPayment(p);
  }
  return true;
}

export async function clearAllData() {
  if (isWebFallback) {
    setWebData(WEB_STORAGE_KEYS.ACCOUNTS, []);
    setWebData(WEB_STORAGE_KEYS.PAYMENTS, []);
    return true;
  }
  await runSql('DELETE FROM payments');
  await runSql('DELETE FROM land_accounts');
  return true;
}

// ============================================
// APP SETTINGS OPERATIONS
// ============================================

export async function getAllSettings() {
  if (isWebFallback) {
    return getWebData(WEB_STORAGE_KEYS.SETTINGS, {});
  }
  try {
    const res = await runSql('SELECT key, value FROM app_settings');
    const settings = {};
    for (const row of res.rows) {
      settings[row.key] = row.value;
    }
    return settings;
  } catch (err) {
    console.warn('Failed to load settings from SQLite, fallback to empty:', err);
    return {};
  }
}

export async function getSetting(key, defaultVal = null) {
  if (isWebFallback) {
    const settings = getWebData(WEB_STORAGE_KEYS.SETTINGS, {});
    return settings[key] !== undefined ? settings[key] : defaultVal;
  }
  try {
    const res = await runSql('SELECT value FROM app_settings WHERE key = ?', [key]);
    if (res.rows && res.rows.length > 0) {
      return res.rows[0].value;
    }
    return defaultVal;
  } catch (err) {
    console.warn(`Failed to get setting ${key}:`, err);
    return defaultVal;
  }
}

export async function setSetting(key, value) {
  const strVal = typeof value === 'string' ? value : JSON.stringify(value);
  if (isWebFallback) {
    const settings = getWebData(WEB_STORAGE_KEYS.SETTINGS, {});
    settings[key] = strVal;
    setWebData(WEB_STORAGE_KEYS.SETTINGS, settings);
    return true;
  }
  await runSql('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, strVal]);
  return true;
}

export async function setMultipleSettings(settingsObj) {
  if (!settingsObj || typeof settingsObj !== 'object') return false;
  if (isWebFallback) {
    const settings = getWebData(WEB_STORAGE_KEYS.SETTINGS, {});
    Object.assign(settings, settingsObj);
    setWebData(WEB_STORAGE_KEYS.SETTINGS, settings);
    return true;
  }
  for (const [key, value] of Object.entries(settingsObj)) {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    await runSql('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, strVal]);
  }
  return true;
}
