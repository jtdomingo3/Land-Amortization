import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
let Database;
try {
  Database = require('better-sqlite3');
} catch (err) {
  const unpackedPath = path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules', 'better-sqlite3');
  if (fs.existsSync(unpackedPath)) {
    Database = require(unpackedPath);
  } else {
    console.error('Failed to load better-sqlite3:', err);
    throw err;
  }
}

let mainWindow = null;
let db = null;

function initSQLite() {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'land_amortization.db');
    console.log('[SQLite] Database path:', dbPath);

    db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? console.log : null });
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Run table schemas
    db.exec(`
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
        payment_id     INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id     INTEGER NOT NULL,
        payment_date   TEXT NOT NULL,
        payment_type   TEXT NOT NULL DEFAULT 'Monthly Amortization',
        amount_paid    REAL NOT NULL,
        receipt_no     TEXT,
        payment_method TEXT DEFAULT 'Cash',
        remarks        TEXT,
        created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES land_accounts(account_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_payments_account ON payments(account_id, payment_type);

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

    // Column migrations
    try { db.exec('ALTER TABLE land_accounts ADD COLUMN is_dp_paid INTEGER DEFAULT 0;'); } catch (_) {}
    try { db.exec('ALTER TABLE payments ADD COLUMN month_covered TEXT;'); } catch (_) {}
    try { db.exec('ALTER TABLE payments ADD COLUMN for_month_no INTEGER;'); } catch (_) {}
    try { db.exec('ALTER TABLE payments ADD COLUMN amortization_amount REAL DEFAULT 0;'); } catch (_) {}
    try { db.exec('ALTER TABLE payments ADD COLUMN penalty_amount REAL DEFAULT 0;'); } catch (_) {}
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS penalties (
          penalty_id     INTEGER PRIMARY KEY AUTOINCREMENT,
          account_id     INTEGER NOT NULL,
          month_no       INTEGER NOT NULL,
          month_name     TEXT,
          due_date       TEXT,
          penalty_amount REAL NOT NULL,
          penalty_reason TEXT,
          status         TEXT NOT NULL DEFAULT 'UNPAID',
          paid_amount    REAL DEFAULT 0,
          waived_amount  REAL DEFAULT 0,
          created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES land_accounts(account_id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_penalties_account ON penalties(account_id, status);
      `);
    } catch (_) {}

    // Auto-migrate legacy payment types 'Installment' to 'Monthly Amortization'
    try {
      db.exec(`
        UPDATE payments SET payment_type = 'Monthly Amortization' WHERE payment_type = 'Installment';
        UPDATE payments SET remarks = REPLACE(remarks, 'installment', 'monthly amortization') WHERE remarks LIKE '%installment%';
        UPDATE payments SET remarks = REPLACE(remarks, 'Installment', 'Monthly Amortization') WHERE remarks LIKE '%Installment%';
        UPDATE payments SET for_month_no = 1, month_covered = 'Month 1' WHERE receipt_no = 'OR-10001' AND (for_month_no IS NULL OR for_month_no = 0);
        UPDATE payments SET for_month_no = 2, month_covered = 'Month 2' WHERE receipt_no = 'OR-10002' AND (for_month_no IS NULL OR for_month_no = 0);
        UPDATE payments SET for_month_no = 3, month_covered = 'Month 3' WHERE receipt_no = 'OR-10003' AND (for_month_no IS NULL OR for_month_no = 0);
        UPDATE payments SET for_month_no = 4, month_covered = 'Advance Amortization' WHERE receipt_no = 'OR-10004' AND (for_month_no IS NULL OR for_month_no = 0);
        UPDATE payments SET amortization_amount = amount_paid WHERE payment_type = 'Monthly Amortization' AND (amortization_amount IS NULL OR amortization_amount = 0);
      `);
    } catch (_) {}

    console.log('[SQLite] Schema migration successful.');
  } catch (err) {
    console.error('[SQLite] Failed to initialize database:', err);
  }
}

function setupIpcHandlers() {
  // Query (SELECT)
  ipcMain.handle('sqlite:query', async (_event, sql, params = []) => {
    if (!db) throw new Error('Database not initialized');
    const stmt = db.prepare(sql);
    const rows = Array.isArray(params) ? stmt.all(...params) : stmt.all(params);
    return rows;
  });

  // Run (INSERT, UPDATE, DELETE)
  ipcMain.handle('sqlite:run', async (_event, sql, params = []) => {
    if (!db) throw new Error('Database not initialized');
    let safeParams = (Array.isArray(params) ? params : [params]).map(p => (p === undefined ? null : p));
    if (sql.includes('INSERT INTO export_log') && (safeParams[1] === null || safeParams[1] === undefined || safeParams[1] === '')) {
      safeParams[1] = `Land_Amortization_Tracker_${new Date().toISOString().substring(0, 10)}.xlsx`;
    }
    const stmt = db.prepare(sql);
    const result = stmt.run(...safeParams);
    return {
      lastInsertRowid: Number(result.lastInsertRowid),
      changes: result.changes
    };
  });

  // Exec (multi-statement DDL/script)
  ipcMain.handle('sqlite:exec', async (_event, sql) => {
    if (!db) throw new Error('Database not initialized');
    try {
      db.exec(sql);
    } catch (err) {
      if (err.message && (err.message.includes('duplicate column name') || err.message.includes('already exists'))) {
        return true;
      }
      throw err;
    }
    return true;
  });

  function getExcelDir() {
    const documentsPath = app.getPath('documents');
    const excelDir = path.join(documentsPath, 'Amortization Tracker', 'ExcelFile');
    if (!fs.existsSync(excelDir)) {
      fs.mkdirSync(excelDir, { recursive: true });
    }
    return excelDir;
  }

  // Native Save File Dialog for Excel/PDF exports
  ipcMain.handle('dialog:saveFile', async (_event, options = {}, fileData) => {
    const excelDir = getExcelDir();
    let defaultPath = options.defaultPath || 'land_amortization_report.xlsx';
    if (!path.isAbsolute(defaultPath)) {
      defaultPath = path.join(excelDir, path.basename(defaultPath));
    }

    const { title = 'Save File', filters = [] } = options;
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title,
      defaultPath,
      filters
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    try {
      let buffer;
      if (typeof fileData === 'string') {
        if (fileData.startsWith('data:')) {
          const base64Data = fileData.split(',')[1];
          buffer = Buffer.from(base64Data, 'base64');
        } else {
          buffer = Buffer.from(fileData, 'base64');
        }
      } else if (fileData instanceof Uint8Array || Buffer.isBuffer(fileData)) {
        buffer = Buffer.from(fileData);
      } else {
        buffer = Buffer.from(fileData);
      }

      await fs.promises.writeFile(filePath, buffer);
      return {
        success: true,
        filePath,
        fileName: path.basename(filePath),
        directory: path.dirname(filePath),
        displayPath: `My Documents > Amortization Tracker > ExcelFile > ${path.basename(filePath)}`
      };
    } catch (err) {
      console.error('[Dialog] Save file error:', err);
      return { success: false, error: err.message };
    }
  });

  // Direct save to My Documents > Amortization Tracker > ExcelFile
  ipcMain.handle('excel:saveDirect', async (_event, fileName, fileData) => {
    try {
      const excelDir = getExcelDir();
      const safeName = path.basename(fileName || 'land_amortization_report.xlsx');
      const filePath = path.join(excelDir, safeName);

      let buffer;
      if (typeof fileData === 'string') {
        if (fileData.startsWith('data:')) {
          const base64Data = fileData.split(',')[1];
          buffer = Buffer.from(base64Data, 'base64');
        } else {
          buffer = Buffer.from(fileData, 'base64');
        }
      } else if (fileData instanceof Uint8Array || Buffer.isBuffer(fileData)) {
        buffer = Buffer.from(fileData);
      } else {
        buffer = Buffer.from(fileData);
      }

      await fs.promises.writeFile(filePath, buffer);
      return {
        success: true,
        filePath,
        fileName: safeName,
        directory: excelDir,
        displayPath: `My Documents > Amortization Tracker > ExcelFile > ${safeName}`
      };
    } catch (err) {
      console.error('[Excel] Direct save error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('excel:getExcelDir', async () => {
    return getExcelDir();
  });

  // Open path in Windows File Explorer
  ipcMain.handle('shell:openPath', async (_event, targetPath) => {
    return await shell.openPath(targetPath);
  });

  // Show item in folder
  ipcMain.handle('shell:showItemInFolder', async (_event, targetPath) => {
    shell.showItemInFolder(targetPath);
    return true;
  });

  // Open external URL
  ipcMain.handle('shell:openExternal', async (_event, url) => {
    await shell.openExternal(url);
    return true;
  });

  // App Paths
  ipcMain.handle('app:getPath', async (_event, name) => {
    return app.getPath(name);
  });

  // Developer Mode IPC Handlers
  ipcMain.handle('dev:toggleDevTools', async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.toggleDevTools();
      return true;
    }
    return false;
  });

  ipcMain.handle('dev:reload', async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.reload();
      return true;
    }
    return false;
  });

  // Get available printers from Windows OS
  ipcMain.handle('print:getPrinters', async () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const printers = await mainWindow.webContents.getPrintersAsync();
        return printers || [];
      }
      return [];
    } catch (err) {
      console.error('[Print] getPrintersAsync error:', err);
      return [];
    }
  });

  // Desktop Native Print (Direct silent print to selected printer without native Windows print dialog)
  ipcMain.handle('print:html', async (_event, htmlContent, options = {}) => {
    return new Promise((resolve) => {
      let printWin = null;
      try {
        printWin = new BrowserWindow({
          show: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        });

        // Determine page size and orientation CSS
        const rawPageSize = options.pageSize || 'A4';
        const isLandscape = Boolean(options.landscape);
        const orientationCss = isLandscape ? 'landscape' : 'portrait';

        let sizeCss = 'A4';
        if (rawPageSize === 'Roll80' || rawPageSize === '80mm') {
          sizeCss = '80mm auto';
        } else if (rawPageSize === 'Roll58' || rawPageSize === '58mm') {
          sizeCss = '58mm auto';
        } else if (['Letter', 'Legal', 'A3', 'A4', 'A5'].includes(rawPageSize)) {
          sizeCss = rawPageSize;
        }

        // Determine margin CSS
        let marginCss = '10mm';
        const marginType = options.marginType || 'default';
        if (marginType === 'none') {
          marginCss = '0mm';
        } else if (marginType === 'narrow') {
          marginCss = '5mm';
        } else if (marginType === 'wide') {
          marginCss = '20mm';
        } else {
          marginCss = '10mm';
        }

        const fullHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>${options.title || 'Print Document'}</title>
              <style>
                @page {
                  size: ${sizeCss} ${orientationCss};
                  margin: ${marginCss};
                }
                @media print {
                  body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                  }
                  .page-break {
                    page-break-after: always !important;
                    break-after: page !important;
                  }
                  .no-break {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
                }
                *, *::before, *::after {
                  box-sizing: border-box;
                }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background: #ffffff;
                  color: #0f172a;
                }
                .document-sheet {
                  background: #ffffff;
                  color: #1e293b;
                  width: 100%;
                  box-sizing: border-box;
                  padding: ${marginType === 'none' ? '0' : (marginType === 'narrow' ? '8px' : (marginType === 'wide' ? '24px' : '16px'))};
                }
                .doc-header {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  border-bottom: 2px solid #0f172a;
                  padding-bottom: 12px;
                  margin-bottom: 14px;
                }
                .doc-brand {
                  display: flex;
                  align-items: center;
                  gap: 14px;
                }
                .doc-logo {
                  max-width: 68px;
                  max-height: 68px;
                  object-fit: contain;
                }
                .doc-company-name {
                  font-size: 1.25rem;
                  font-weight: 800;
                  color: #0f172a;
                  letter-spacing: -0.01em;
                  margin: 0 0 2px 0;
                  text-transform: uppercase;
                }
                .doc-company-detail {
                  font-size: 0.78rem;
                  color: #475569;
                  line-height: 1.35;
                }
                .doc-title-badge {
                  text-align: right;
                }
                .doc-type-title {
                  font-size: 1.15rem;
                  font-weight: 800;
                  color: #0f172a;
                  letter-spacing: 0.05em;
                  text-transform: uppercase;
                  margin: 0;
                }
                .doc-info-box {
                  background: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 6px;
                  padding: 10px 12px;
                }
                .doc-info-box-title {
                  font-size: 0.7rem;
                  font-weight: 800;
                  color: #64748b;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  border-bottom: 1px solid #e2e8f0;
                  padding-bottom: 4px;
                  margin-bottom: 6px;
                }
                .doc-row {
                  display: flex;
                  justify-content: space-between;
                  font-size: 0.78rem;
                  line-height: 1.5;
                }
                .doc-label {
                  color: #64748b;
                  font-weight: 500;
                }
                .doc-value {
                  color: #0f172a;
                  font-weight: 600;
                }
                .doc-value.mono {
                  font-family: Consolas, "JetBrains Mono", Menlo, monospace;
                }
                .doc-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 14px;
                  font-size: 0.78rem;
                }
                .doc-table th {
                  background: #0f172a;
                  color: #ffffff;
                  padding: 7px 10px;
                  font-weight: 700;
                  text-transform: uppercase;
                  font-size: 0.7rem;
                  letter-spacing: 0.04em;
                  text-align: left;
                }
                .doc-table th.right, .doc-table td.right { text-align: right; }
                .doc-table th.center, .doc-table td.center { text-align: center; }
                .doc-table td {
                  padding: 7px 10px;
                  border-bottom: 1px solid #e2e8f0;
                  color: #1e293b;
                }
                .doc-table tr:nth-child(even) td { background: #f8fafc; }
                .doc-table tr.total-row td {
                  background: #f1f5f9;
                  font-weight: 700;
                  border-top: 2px solid #0f172a;
                  border-bottom: 2px solid #0f172a;
                  color: #0f172a;
                }
                .doc-summary-card {
                  background: #f8fafc;
                  border: 1px solid #cbd5e1;
                  border-radius: 6px;
                  padding: 10px 14px;
                  margin-bottom: 16px;
                }
                .doc-grand-total {
                  font-size: 0.96rem;
                  font-weight: 800;
                  color: #0f172a;
                  display: flex;
                  justify-content: space-between;
                  padding-top: 6px;
                  margin-top: 6px;
                  border-top: 2px solid #0f172a;
                }
                .doc-signatures {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 24px;
                  margin-top: 24px;
                  padding-top: 10px;
                }
                .doc-sig-block {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  text-align: center;
                }
                .doc-sig-line {
                  width: 100%;
                  max-width: 220px;
                  border-bottom: 1.5px solid #0f172a;
                  margin-bottom: 6px;
                }
                .doc-sig-name {
                  font-size: 0.88rem;
                  font-weight: 800;
                  color: #1e293b;
                  text-transform: uppercase;
                  letter-spacing: 0.04em;
                }
                .doc-sig-title {
                  font-size: 0.72rem;
                  color: #64748b;
                  margin-top: 2px;
                }
                .doc-footer {
                  margin-top: 16px;
                  padding-top: 8px;
                  border-top: 1px dashed #cbd5e1;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  font-size: 0.68rem;
                  color: #94a3b8;
                }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `;

        printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);

        printWin.webContents.on('did-finish-load', () => {
          setTimeout(() => {
            if (!printWin || printWin.isDestroyed()) return;

            // Map margins for Electron print API
            let marginsOpt = { marginType: 'default' };
            if (marginType === 'none') {
              marginsOpt = { marginType: 'none' };
            } else if (marginType === 'narrow') {
              marginsOpt = { marginType: 'custom', top: 5, bottom: 5, left: 5, right: 5 };
            } else if (marginType === 'wide') {
              marginsOpt = { marginType: 'custom', top: 20, bottom: 20, left: 20, right: 20 };
            }

            const printSettings = {
              silent: options.silent !== undefined ? options.silent : true,
              printBackground: true,
              deviceName: options.deviceName || '',
              landscape: isLandscape,
              copies: Math.max(1, parseInt(options.copies, 10) || 1),
              margins: marginsOpt
            };

            // Standard page size or custom micron dimensions
            if (['A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid'].includes(rawPageSize)) {
              printSettings.pageSize = rawPageSize;
            } else if (rawPageSize === 'Roll80' || rawPageSize === '80mm') {
              printSettings.pageSize = { width: 80000, height: 297000 };
            } else if (rawPageSize === 'Roll58' || rawPageSize === '58mm') {
              printSettings.pageSize = { width: 58000, height: 297000 };
            }

            printWin.webContents.print(
              printSettings,
              (success, failureReason) => {
                try {
                  if (printWin && !printWin.isDestroyed()) printWin.close();
                } catch (_) {}
                if (!success && failureReason && failureReason !== 'Print job was cancelled') {
                  resolve({ success: false, error: failureReason });
                } else {
                  resolve({ success: true, canceled: !success });
                }
              }
            );
          }, 300);
        });

        printWin.webContents.on('did-fail-load', () => {
          try {
            if (printWin && !printWin.isDestroyed()) printWin.close();
          } catch (_) {}
          resolve({ success: false, error: 'Failed to load document for printing.' });
        });
      } catch (err) {
        if (printWin) {
          try { if (!printWin.isDestroyed()) printWin.close(); } catch (_) {}
        }
        resolve({ success: false, error: err.message });
      }
    });
  });

  // Desktop Native Print to PDF (Vector-crisp PDF output via Electron native renderer)
  ipcMain.handle('print:toPdf', async (_event, htmlContent, options = {}) => {
    return new Promise((resolve) => {
      let printWin = null;
      try {
        printWin = new BrowserWindow({
          show: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        });

        const rawPageSize = options.pageSize || 'A4';
        const isLandscape = Boolean(options.landscape);
        const orientationCss = isLandscape ? 'landscape' : 'portrait';

        let sizeCss = 'A4';
        if (rawPageSize === 'Roll80' || rawPageSize === '80mm') {
          sizeCss = '80mm auto';
        } else if (rawPageSize === 'Roll58' || rawPageSize === '58mm') {
          sizeCss = '58mm auto';
        } else if (['Letter', 'Legal', 'A3', 'A4', 'A5'].includes(rawPageSize)) {
          sizeCss = rawPageSize;
        }

        const fullHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>${options.title || 'Document'}</title>
              <style>
                @page { size: ${sizeCss} ${orientationCss}; margin: 10mm; }
                @media print {
                  body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    background: #ffffff !important;
                  }
                }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `;

        printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);

        printWin.webContents.on('did-finish-load', () => {
          setTimeout(async () => {
            try {
              if (!printWin || printWin.isDestroyed()) return;
              const pdfBuffer = await printWin.webContents.printToPDF({
                pageSize: options.pageSize || 'A4',
                landscape: Boolean(options.landscape),
                printBackground: true,
                margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
              });

              try {
                if (printWin && !printWin.isDestroyed()) printWin.close();
              } catch (_) {}

              const sanitizedTitle = (options.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
              const defaultFileName = `${sanitizedTitle}.pdf`;

              const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
                title: options.dialogTitle || 'Save Document as PDF',
                defaultPath: defaultFileName,
                filters: [{ name: 'PDF Documents (*.pdf)', extensions: ['pdf'] }]
              });

              if (canceled || !filePath) {
                return resolve({ success: false, canceled: true });
              }

              await fs.promises.writeFile(filePath, pdfBuffer);
              resolve({ success: true, filePath, fileName: path.basename(filePath) });
            } catch (err) {
              try {
                if (printWin && !printWin.isDestroyed()) printWin.close();
              } catch (_) {}
              resolve({ success: false, error: err.message });
            }
          }, 250);
        });

        printWin.webContents.on('did-fail-load', () => {
          try {
            if (printWin && !printWin.isDestroyed()) printWin.close();
          } catch (_) {}
          resolve({ success: false, error: 'Failed to render PDF document.' });
        });
      } catch (err) {
        if (printWin) {
          try { if (!printWin.isDestroyed()) printWin.close(); } catch (_) {}
        }
        resolve({ success: false, error: err.message });
      }
    });
  });
}

function createWindow() {
  const icoDev = path.join(__dirname, '../public/icon.ico');
  const icoProd = path.join(app.getAppPath(), 'dist/icon.ico');
  const devIconPath = path.join(__dirname, '../public/logo.png');
  const prodIconPath = path.join(app.getAppPath(), 'dist/logo.png');
  const fallbackIcon = path.join(__dirname, '../src/assets/logo.png');
  let appIcon = devIconPath;
  if (fs.existsSync(icoDev)) {
    appIcon = icoDev;
  } else if (fs.existsSync(icoProd)) {
    appIcon = icoProd;
  } else if (fs.existsSync(devIconPath)) {
    appIcon = devIconPath;
  } else if (fs.existsSync(prodIconPath)) {
    appIcon = prodIconPath;
  } else if (fs.existsSync(fallbackIcon)) {
    appIcon = fallbackIcon;
  }

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1024,
    minHeight: 680,
    title: 'Land Amortization Tracker',
    icon: appIcon,
    backgroundColor: '#f8fafc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Remove default menu bar for clean modern Windows desktop look
  mainWindow.removeMenu();

  // Developer Mode Shortcuts: F12 or Ctrl+Shift+I to toggle DevTools, F5 or Ctrl+R to reload
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    const isCtrlShiftI = (input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i';
    const isF12 = input.key === 'F12';
    if (isCtrlShiftI || isF12) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
      return;
    }

    const isCtrlR = (input.control || input.meta) && input.key.toLowerCase() === 'r';
    const isF5 = input.key === 'F5';
    if (isCtrlR || isF5) {
      mainWindow.webContents.reload();
      event.preventDefault();
      return;
    }
  });

  // Forward renderer console errors and warnings directly to Electron terminal stdout
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const lvlName = levels[level] || 'LOG';
    if (level >= 2) {
      const srcName = sourceId ? path.basename(sourceId) : 'renderer';
      console.log(`[Renderer ${lvlName}] ${message} (${srcName}:${line})`);
    }
  });

  // Route any window.open / target="_blank" links safely into Windows default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  initSQLite();
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) {
      try {
        db.close();
      } catch (e) {
        console.warn('Error closing database', e);
      }
    }
    app.quit();
  }
});
