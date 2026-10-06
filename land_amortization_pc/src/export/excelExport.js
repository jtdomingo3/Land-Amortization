import * as XLSX from 'xlsx';
import { INSTRUCTIONS, PENALTY_RULES } from '../utils/constants.js';
import { computeAccountDerived, computePaymentDerived } from '../engine/calculations.js';
import { computeMonthlySchedule } from '../engine/waterfall.js';
import { computeDashboard } from '../engine/dashboard.js';
import { toISODateString } from '../utils/formatters.js';

/**
 * Generates an XLSX workbook binary with all 5 sheets.
 * 
 * @param {Array<Object>} accounts - Raw accounts from DB
 * @param {Array<Object>} payments - Raw payments from DB
 * @param {Date} [todayRef] - Current date reference
 * @returns {Blob|Uint8Array}
 */
export function generateWorkbook(accounts = [], payments = [], todayRef = new Date()) {
  const wb = XLSX.utils.book_new();

  // Set Workbook Metadata
  wb.Props = {
    Title: 'Land Amortization Tracker',
    Subject: 'Land Amortization Accounts & Schedules',
    CreatedDate: new Date()
  };

  // 1. Precompute all account derived values
  const accountsDerived = accounts.map(a => computeAccountDerived(a, payments, todayRef));
  const paymentsDerived = payments.map(p => {
    const acc = accounts.find(a => String(a.account_id) === String(p.account_id));
    return computePaymentDerived(p, acc);
  });
  const dashboard = computeDashboard(accountsDerived);

  // ============================================
  // SHEET 1: Dashboard
  // ============================================
  const dashboardData = [
    ['LAND AMORTIZATION COLLECTION DASHBOARD', '', '', ''],
    ['', '', '', ''],
    ['SUMMARY METRICS', 'VALUE', '', ''],
    ['Total Accounts', dashboard.totalAccounts],
    ['Total Contract Amount', dashboard.totalContractAmount],
    ['Total Down Payments', dashboard.totalDownPayments],
    ['Total Installments Paid', dashboard.totalInstallmentsPaid],
    ['Total Collected', dashboard.totalCollected],
    ['Down Payment Penalties (1%)', dashboard.dpPenalties],
    ['10% Penalties', dashboard.tenPercentPenalties],
    ['Total Penalties', dashboard.totalPenalties],
    ['Total Amount Due', dashboard.totalAmountDue],
    ['Outstanding Balance', dashboard.outstandingBalance],
    ['Active Accounts', dashboard.activeAccounts],
    ['Overdue Accounts', dashboard.overdueAccounts],
    ['2+ Consecutive Missed', dashboard.twoPlusMissed],
    ['Down Payments Overdue', dashboard.downPaymentsOverdue],
    ['', '', '', ''],
    ['', '', '', ''],
    ['PENALTY / PAYMENT RULES', '', '', ''],
    ...PENALTY_RULES.map(rule => [rule, '', '', ''])
  ];

  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
  wsDashboard['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsDashboard, 'Dashboard');

  // ============================================
  // SHEET 2: Land Accounts
  // ============================================
  const accountHeaders = [
    'Account ID', 'Name', 'Date of Start', 'First Due Date', 'Land Title Number',
    'Land Area (sqm)', 'Total Contract Amount', 'Down Payment', 'Agreed Down Payment Due',
    'Monthly Amortization', 'No. of Months', 'Installments Paid', 'Total Paid',
    'Base Balance', 'Down Payment Penalty (1%)', 'Consecutive Missed Months',
    '10% Penalty', 'Total Penalties', 'Total Amount Due', 'Outstanding Balance',
    'Next Due Date', 'Days Overdue', 'Status', 'Remarks'
  ];

  const accountRows = [accountHeaders];
  for (const acc of accountsDerived) {
    accountRows.push([
      acc.account_id,
      acc.name,
      acc.date_of_start,
      acc.first_due_date,
      acc.land_title_number,
      acc.land_area_sqm,
      acc.total_contract_amount,
      acc.down_payment,
      acc.agreed_dp_due,
      acc.monthly_amortization,
      acc.num_of_months,
      acc.installments_paid,
      acc.total_paid,
      acc.base_balance,
      acc.dp_penalty,
      acc.consecutive_missed,
      acc.ten_percent_penalty,
      acc.total_penalties,
      acc.total_amount_due,
      acc.outstanding_balance,
      acc.next_due_date,
      acc.days_overdue,
      acc.status,
      acc.remarks || ''
    ]);
  }

  const wsAccounts = XLSX.utils.aoa_to_sheet(accountRows);
  wsAccounts['!cols'] = [
    { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
    { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 24 }, { wch: 20 },
    { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 24 },
    { wch: 24 }, { wch: 14 }, { wch: 15 }, { wch: 16 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAccounts, 'Land Accounts');

  // ============================================
  // SHEET 3: Payments
  // ============================================
  const paymentHeaders = [
    'Payment ID', 'Account ID', 'Name', 'Payment Date',
    'Payment Type', 'For Month No.', 'Month Covered', 'Amortization Amount',
    'Penalty Amount', 'Total Amount Paid', 'OR/Receipt No.', 'Payment Method',
    'Remarks'
  ];

  const paymentRows = [paymentHeaders];
  for (const p of paymentsDerived) {
    paymentRows.push([
      p.payment_id,
      p.account_id,
      p.name,
      p.payment_date,
      p.payment_type,
      p.for_month_no || '',
      p.month_covered || '',
      p.amortization_amount !== undefined ? p.amortization_amount : (p.payment_type === 'Penalty' ? 0 : p.amount_paid),
      p.penalty_amount || (p.payment_type === 'Penalty' ? p.amount_paid : 0),
      p.amount_paid,
      p.receipt_no,
      p.payment_method,
      p.remarks || ''
    ]);
  }

  const wsPayments = XLSX.utils.aoa_to_sheet(paymentRows);
  wsPayments['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 14 },
    { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 20 },
    { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments');

  // ============================================
  // SHEET 4: Monthly Schedule
  // ============================================
  const scheduleHeaders = [
    'Account ID', 'Name', 'Month No.', 'Due Date', 'Expected Amortization',
    'Amount Applied', 'Advance / Remaining', 'Payment Status', 'Remarks',
    'Consecutive Missed Months'
  ];

  const scheduleRows = [scheduleHeaders];
  for (const acc of accounts) {
    const accPayments = payments.filter(p => String(p.account_id) === String(acc.account_id));
    const sched = computeMonthlySchedule(acc, accPayments, todayRef);
    for (const row of sched) {
      scheduleRows.push([
        row.account_id,
        row.name,
        row.month_no,
        row.due_date,
        row.expected_amortization,
        row.amount_applied,
        row.advance_remaining,
        row.payment_status,
        row.remarks,
        row.consecutive_missed
      ]);
    }
  }

  const wsSchedule = XLSX.utils.aoa_to_sheet(scheduleRows);
  wsSchedule['!cols'] = [
    { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 22 },
    { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 40 }, { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSchedule, 'Monthly Schedule');

  // ============================================
  // SHEET 5: Instructions
  // ============================================
  const instructionsRows = [
    ['HOW TO USE THE LAND AMORTIZATION TRACKER'],
    [''],
    ...INSTRUCTIONS.map(i => [i])
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsRows);
  wsInstructions['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  return wb;
}

/**
 * Available filename presets for quick selection
 */
export function getFileNamePresets() {
  const now = new Date();
  const dateStr = toISODateString(now);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_');

  return [
    {
      id: 'dated',
      label: '📅 Today Date',
      fileName: `Land_Amortization_Tracker_${dateStr}.xlsx`
    },
    {
      id: 'timestamped',
      label: '⏱️ With Time',
      fileName: `Land_Amortization_Tracker_${dateStr}_${timeStr}.xlsx`
    },
    {
      id: 'monthly',
      label: '📁 Monthly Report',
      fileName: `Land_Amortization_Report_${monthName}.xlsx`
    },
    {
      id: 'standard',
      label: '🏷️ Standard',
      fileName: `Land_Amortization_Tracker.xlsx`
    }
  ];
}

/**
 * Generate clean filename with current timestamp or custom name
 */
export function getExportFileName(customFileName = '') {
  if (customFileName && typeof customFileName === 'string' && customFileName.trim()) {
    let name = customFileName.trim().replace(/[\\/:*?"<>|]/g, '_');
    return name.toLowerCase().endsWith('.xlsx') ? name : `${name}.xlsx`;
  }
  const dateStr = toISODateString(new Date());
  return `Land_Amortization_Tracker_${dateStr}.xlsx`;
}

/**
 * Trigger direct browser file download with guaranteed non-zero .xlsx content
 */
export async function downloadInBrowser(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.setAttribute('download', fileName);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    } catch (_) {}
  }, 1000);

  // Keep Blob URL valid for 5 minutes so direct download anchor links remain clickable
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch (_) {}
  }, 300000);

  return {
    success: true,
    saveLocation: 'downloads_folder',
    blobUrl: url,
    message: `Saved as "${fileName}" to your computer's Downloads folder.`
  };
}

/**
 * Optional: Explicit Windows / Mac "Save As" folder picker
 */
export async function saveWithFolderPicker(accounts = [], payments = [], customFileName = null) {
  const fileName = getExportFileName(customFileName);
  const wb = generateWorkbook(accounts, payments);
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'Microsoft Excel Spreadsheet (*.xlsx)',
          accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
          }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return {
        success: true,
        saveLocation: 'chosen_folder',
        fileName,
        blob,
        message: `Saved as "${fileName}" to your chosen folder!`
      };
    } catch (pickerErr) {
      if (pickerErr && pickerErr.name === 'AbortError') {
        throw new Error('Save cancelled by user');
      }
      console.warn('showSaveFilePicker notice, falling back to direct download:', pickerErr);
    }
  }

  // Fallback to direct download
  return saveWorkbookToDevice(accounts, payments, customFileName);
}

/**
 * Save workbook to device Documents / Amortization Tracker folder or Downloads
 * Returns { success, filePath, displayPath, fileName, blob, blobUrl, saveLocation, message, base64Data, dataUri }
 */
export async function saveWorkbookToDevice(accounts = [], payments = [], customFileName = null) {
  const fileName = getExportFileName(customFileName);
  const wb = generateWorkbook(accounts, payments);

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const base64Data = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  // 1. Electron Desktop Environment: Direct save to My Documents > Amortization Tracker > ExcelFile
  if (typeof window !== 'undefined' && window.electronAPI?.excel?.saveDirect) {
    try {
      const res = await window.electronAPI.excel.saveDirect(fileName, base64Data);
      if (res && res.success) {
        return {
          success: true,
          filePath: res.filePath,
          displayPath: res.displayPath,
          directory: res.directory,
          fileName: res.fileName || fileName,
          saveLocation: 'documents_amortization_tracker_excelfile',
          message: `Saved to My Documents > Amortization Tracker > ExcelFile > ${res.fileName}`,
          blob,
          base64Data,
          dataUri
        };
      }
    } catch (directErr) {
      console.warn('Electron saveDirect error, falling back to dialog:', directErr);
    }
  }

  // Fallback to Native Windows Save File Dialog (pre-routed to ExcelFile folder)
  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.dialog) {
    try {
      const res = await window.electronAPI.dialog.saveFile({
        title: 'Save Land Amortization Workbook',
        defaultPath: fileName,
        filters: [{ name: 'Excel Workbook (*.xlsx)', extensions: ['xlsx'] }]
      }, base64Data);

      if (res && res.success) {
        return {
          success: true,
          filePath: res.filePath,
          displayPath: res.displayPath || res.filePath,
          directory: res.directory,
          fileName: res.fileName || fileName,
          saveLocation: 'windows_file_dialog',
          message: `Saved successfully to ${res.displayPath || res.filePath}`,
          blob,
          base64Data,
          dataUri
        };
      } else if (res && res.canceled) {
        return {
          success: false,
          canceled: true,
          message: 'Save cancelled by user'
        };
      }
    } catch (electronErr) {
      console.warn('Electron save dialog error, falling back to browser download:', electronErr);
    }
  }

  // 2. Native Cordova Environment on device
  if (window.cordova) {
    let savedFilePath = null;
    let displayLocation = 'Documents/Amortization Tracker';
    let saveLocation = 'documents_folder';

    if (window.resolveLocalFileSystemURL && window.cordova.file) {
      const extRoot = window.cordova.file.externalRootDirectory; // file:///storage/emulated/0/

      // Strategy 1: Target /storage/emulated/0/Documents/Amortization Tracker/
      if (extRoot) {
        try {
          savedFilePath = await new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(extRoot, (rootEntry) => {
              rootEntry.getDirectory('Documents', { create: true, exclusive: false }, (docsEntry) => {
                docsEntry.getDirectory('Amortization Tracker', { create: true, exclusive: false }, (trackerEntry) => {
                  trackerEntry.getFile(fileName, { create: true, exclusive: false }, (fileEntry) => {
                    fileEntry.createWriter((fileWriter) => {
                      fileWriter.onwriteend = () => resolve(fileEntry.nativeURL || fileEntry.toURL());
                      fileWriter.onerror = (e) => reject(e);
                      fileWriter.write(blob);
                    }, reject);
                  }, reject);
                }, reject);
              }, reject);
            }, reject);
          });

          if (savedFilePath) {
            displayLocation = `Documents/Amortization Tracker/${fileName}`;
            saveLocation = 'documents_folder';
          }
        } catch (docErr) {
          console.warn('Could not save to Documents/Amortization Tracker, trying Download folder:', docErr);
        }
      }

      // Strategy 2: Target /storage/emulated/0/Download/Amortization Tracker/
      if (!savedFilePath && extRoot) {
        try {
          savedFilePath = await new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(extRoot, (rootEntry) => {
              rootEntry.getDirectory('Download', { create: true, exclusive: false }, (dlEntry) => {
                dlEntry.getDirectory('Amortization Tracker', { create: true, exclusive: false }, (trackerEntry) => {
                  trackerEntry.getFile(fileName, { create: true, exclusive: false }, (fileEntry) => {
                    fileEntry.createWriter((fileWriter) => {
                      fileWriter.onwriteend = () => resolve(fileEntry.nativeURL || fileEntry.toURL());
                      fileWriter.onerror = (e) => reject(e);
                      fileWriter.write(blob);
                    }, reject);
                  }, reject);
                }, reject);
              }, reject);
            }, reject);
          });

          if (savedFilePath) {
            displayLocation = `Download/Amortization Tracker/${fileName}`;
            saveLocation = 'downloads_folder';
          }
        } catch (dlErr) {
          console.warn('Could not save to Download/Amortization Tracker:', dlErr);
        }
      }

      // Strategy 3: Standard app documentsDirectory
      if (!savedFilePath && window.cordova.file.documentsDirectory) {
        try {
          savedFilePath = await new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(window.cordova.file.documentsDirectory, (docsEntry) => {
              docsEntry.getFile(fileName, { create: true, exclusive: false }, (fileEntry) => {
                fileEntry.createWriter((fileWriter) => {
                  fileWriter.onwriteend = () => resolve(fileEntry.nativeURL || fileEntry.toURL());
                  fileWriter.onerror = (e) => reject(e);
                  fileWriter.write(blob);
                }, reject);
              }, reject);
            }, reject);
          });

          if (savedFilePath) {
            displayLocation = `Documents/${fileName}`;
            saveLocation = 'documents_folder';
          }
        } catch (appDocErr) {
          console.warn('Could not save to cordova.file.documentsDirectory:', appDocErr);
        }
      }
    }

    const fileTarget = savedFilePath || dataUri;

    return {
      success: true,
      filePath: fileTarget,
      displayPath: displayLocation,
      fileName,
      saveLocation,
      message: `Saved directly to ${displayLocation}`,
      blob,
      base64Data,
      dataUri
    };
  }

  // 2. Browser environment: trigger robust download
  const browserRes = await downloadInBrowser(blob, fileName);

  return {
    success: true,
    filePath: fileName,
    displayPath: `Downloads/${fileName}`,
    fileName: fileName,
    blob,
    base64Data,
    dataUri,
    ...browserRes
  };
}
