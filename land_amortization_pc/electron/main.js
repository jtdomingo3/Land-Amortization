import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

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
        payment_type   TEXT NOT NULL DEFAULT 'Installment',
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
    try {
      db.exec('ALTER TABLE land_accounts ADD COLUMN is_dp_paid INTEGER DEFAULT 0;');
    } catch {
      // Column already exists
    }

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
    db.exec(sql);
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

  // Desktop Native Print (Bypasses broken Chromium print preview, invokes system print dialog)
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

        const fullHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>${options.title || 'Print Document'}</title>
              <style>
                @page { size: auto; margin: 10mm; }
                @media print {
                  body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                  }
                }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background: #ffffff;
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
            printWin.webContents.print(
              {
                silent: options.silent || false,
                printBackground: true,
                deviceName: options.deviceName || ''
              },
              (success, failureReason) => {
                try {
                  if (printWin && !printWin.isDestroyed()) printWin.close();
                } catch (_) {}
                if (!success && failureReason !== 'Print job was cancelled') {
                  resolve({ success: false, error: failureReason });
                } else {
                  resolve({ success: true, canceled: !success });
                }
              }
            );
          }, 250);
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

        const fullHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>${options.title || 'Document'}</title>
              <style>
                @page { size: A4; margin: 10mm; }
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
  const devIconPath = path.join(__dirname, '../public/logo.png');
  const prodIconPath = path.join(app.getAppPath(), 'dist/logo.png');
  const fallbackIcon = path.join(__dirname, '../src/assets/logo.png');
  let appIcon = devIconPath;
  if (fs.existsSync(devIconPath)) {
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
