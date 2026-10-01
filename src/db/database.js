import {
  CREATE_TABLE_ACCOUNTS,
  CREATE_TABLE_PAYMENTS,
  CREATE_INDEX_PAYMENTS,
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
      down_payment: 0,
      agreed_dp_due: addMonthsEdate(todayStr, -1),
      monthly_amortization: 4166.67,
      num_of_months: 120,
      remarks: "Sample buyer 3 - Down Payment Overdue (1% Contract Amount Penalty)"
    }
  ];

  const payments = [
    {
      payment_id: 1,
      account_id: 1001,
      payment_date: addMonthsEdate(todayStr, -11),
      payment_type: "Installment",
      amount_paid: 12083.33,
      receipt_no: "OR-10001",
      payment_method: "Cash",
      remarks: "1st installment"
    },
    {
      payment_id: 2,
      account_id: 1001,
      payment_date: addMonthsEdate(todayStr, -10),
      payment_type: "Installment",
      amount_paid: 12083.33,
      receipt_no: "OR-10002",
      payment_method: "Cash",
      remarks: "2nd installment"
    },
    {
      payment_id: 3,
      account_id: 1001,
      payment_date: addMonthsEdate(todayStr, -9),
      payment_type: "Installment",
      amount_paid: 12083.33,
      receipt_no: "OR-10003",
      payment_method: "Cash",
      remarks: "3rd installment"
    },
    {
      payment_id: 4,
      account_id: 1001,
      payment_date: addMonthsEdate(todayStr, -6),
      payment_type: "Installment",
      amount_paid: 145000.00,
      receipt_no: "OR-10004",
      payment_method: "Bank Transfer",
      remarks: "Advance lump sum payment"
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
  SETTINGS: 'land_amortization_settings',
  EXPORT_LOG: 'land_amortization_export_log'
};

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
 * Initialize Database (Cordova SQLite or Web Fallback)
 */
export async function initDatabase() {
  return new Promise((resolve, reject) => {
    // Check if Cordova SQLite is available
    if (window.sqlitePlugin && typeof window.sqlitePlugin.openDatabase === 'function') {
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
          tx.executeSql(CREATE_TABLE_SETTINGS);
          tx.executeSql(CREATE_TABLE_EXPORT_LOG);
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
      console.log('Running in browser mode: using Web Storage DB shim');
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
    setWebData(WEB_STORAGE_KEYS.SETTINGS, { theme: 'light', currency: 'PHP' });
    setWebData(WEB_STORAGE_KEYS.EXPORT_LOG, []);
    console.log('Web Storage initialized clean with 0 accounts.');
  }
}

async function checkAndSeedData() {
  // Start with clean database; user can load sample demo data on demand
  console.log('SQLite database ready for user accounts.');
}

/**
 * Execute a SQL query on native SQLite
 */
function runSql(sql, params = []) {
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
    remarks: acc.remarks || ''
  };

  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.ACCOUNTS, []);
    const existingIdx = list.findIndex(a => Number(a.account_id) === account.account_id);
    if (existingIdx >= 0) {
      throw new Error(`Account ID ${account.account_id} already exists`);
    }
    list.push(account);
    setWebData(WEB_STORAGE_KEYS.ACCOUNTS, list);
    return account;
  }

  const sql = `
    INSERT INTO land_accounts (
      account_id, name, date_of_start, first_due_date, land_title_number,
      land_area_sqm, total_contract_amount, down_payment, agreed_dp_due,
      monthly_amortization, num_of_months, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await runSql(sql, [
    account.account_id, account.name, account.date_of_start, account.first_due_date,
    account.land_title_number, account.land_area_sqm, account.total_contract_amount,
    account.down_payment, account.agreed_dp_due, account.monthly_amortization,
    account.num_of_months, account.remarks
  ]);
  return account;
}

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
    remarks: acc.remarks || ''
  };

  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.ACCOUNTS, []);
    const idx = list.findIndex(a => Number(a.account_id) === account.account_id);
    if (idx === -1) throw new Error('Account not found');
    list[idx] = { ...list[idx], ...account };
    setWebData(WEB_STORAGE_KEYS.ACCOUNTS, list);
    return account;
  }

  const sql = `
    UPDATE land_accounts SET
      name = ?, date_of_start = ?, first_due_date = ?, land_title_number = ?,
      land_area_sqm = ?, total_contract_amount = ?, down_payment = ?, agreed_dp_due = ?,
      monthly_amortization = ?, num_of_months = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
    WHERE account_id = ?
  `;
  await runSql(sql, [
    account.name, account.date_of_start, account.first_due_date, account.land_title_number,
    account.land_area_sqm, account.total_contract_amount, account.down_payment,
    account.agreed_dp_due, account.monthly_amortization, account.num_of_months,
    account.remarks, account.account_id
  ]);
  return account;
}

export async function deleteAccount(accountId) {
  if (isWebFallback) {
    let accounts = getWebData(WEB_STORAGE_KEYS.ACCOUNTS, []);
    accounts = accounts.filter(a => Number(a.account_id) !== Number(accountId));
    setWebData(WEB_STORAGE_KEYS.ACCOUNTS, accounts);

    let payments = getWebData(WEB_STORAGE_KEYS.PAYMENTS, []);
    payments = payments.filter(p => Number(p.account_id) !== Number(accountId));
    setWebData(WEB_STORAGE_KEYS.PAYMENTS, payments);
    return true;
  }

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
  const payment = {
    account_id: Number(p.account_id),
    payment_date: p.payment_date,
    payment_type: p.payment_type || 'Installment',
    amount_paid: Number(p.amount_paid) || 0,
    receipt_no: p.receipt_no || '',
    payment_method: p.payment_method || 'Cash',
    remarks: p.remarks || ''
  };

  if (isWebFallback) {
    const list = getWebData(WEB_STORAGE_KEYS.PAYMENTS, []);
    const nextId = list.length > 0 ? Math.max(...list.map(item => item.payment_id || 0)) + 1 : 1;
    const newPayment = { ...payment, payment_id: nextId };
    list.push(newPayment);
    setWebData(WEB_STORAGE_KEYS.PAYMENTS, list);
    return newPayment;
  }

  const sql = `
    INSERT INTO payments (
      account_id, payment_date, payment_type, amount_paid, receipt_no, payment_method, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const res = await runSql(sql, [
    payment.account_id, payment.payment_date, payment.payment_type,
    payment.amount_paid, payment.receipt_no, payment.payment_method, payment.remarks
  ]);
  return { ...payment, payment_id: res.insertId };
}

export async function updatePayment(p) {
  const paymentId = Number(p.payment_id);
  const payment = {
    account_id: Number(p.account_id),
    payment_date: p.payment_date,
    payment_type: p.payment_type || 'Installment',
    amount_paid: Number(p.amount_paid) || 0,
    receipt_no: p.receipt_no || '',
    payment_method: p.payment_method || 'Cash',
    remarks: p.remarks || ''
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
      receipt_no = ?, payment_method = ?, remarks = ?
    WHERE payment_id = ?
  `;
  await runSql(sql, [
    payment.account_id, payment.payment_date, payment.payment_type,
    payment.amount_paid, payment.receipt_no, payment.payment_method, payment.remarks, paymentId
  ]);
  return { ...payment, payment_id: paymentId };
}

export async function deletePayment(paymentId) {
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
  const item = {
    export_type,
    file_name,
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
    [export_type, file_name, accounts_exported, payments_exported]
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
