export const CREATE_TABLE_ACCOUNTS = `
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
`;

export const CREATE_TABLE_PAYMENTS = `
  CREATE TABLE IF NOT EXISTS payments (
    payment_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id     INTEGER NOT NULL,
    payment_date   TEXT NOT NULL,
    payment_type   TEXT NOT NULL DEFAULT 'Installment',
    amount_paid    REAL NOT NULL,
    receipt_no     TEXT,
    payment_method TEXT DEFAULT 'Cash',
    remarks        TEXT,
    created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES land_accounts(account_id) ON DELETE CASCADE
  );
`;

export const CREATE_INDEX_PAYMENTS = `
  CREATE INDEX IF NOT EXISTS idx_payments_account ON payments(account_id, payment_type);
`;

export const CREATE_TABLE_SETTINGS = `
  CREATE TABLE IF NOT EXISTS app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`;

export const CREATE_TABLE_EXPORT_LOG = `
  CREATE TABLE IF NOT EXISTS export_log (
    log_id            INTEGER PRIMARY KEY AUTOINCREMENT,
    export_type       TEXT NOT NULL,
    file_name         TEXT NOT NULL,
    accounts_exported INTEGER DEFAULT 0,
    payments_exported INTEGER DEFAULT 0,
    created_at        TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;
