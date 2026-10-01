import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initDatabase,
  getAccounts,
  insertAccount,
  updateAccount as dbUpdateAccount,
  deleteAccount as dbDeleteAccount,
  getPayments,
  insertPayment,
  updatePayment as dbUpdatePayment,
  deletePayment as dbDeletePayment,
  getExportLogs,
  addExportLog,
  resetToSampleData,
  clearAllData
} from '../db/database.js';
import { computeAccountDerived, computePaymentDerived } from '../engine/calculations.js';
import { computeDashboard } from '../engine/dashboard.js';
import { saveWorkbookToDevice } from '../export/excelExport.js';
import { shareToGoogleDrive } from '../share/shareFile.js';
import {
  syncUpsertAccount,
  syncDeleteAccount,
  syncUpsertPayment,
  syncDeletePayment
} from '../services/supabaseSync.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [isCordova, setIsCordova] = useState(false);

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('land_amortization_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  const [rawAccounts, setRawAccounts] = useState([]);
  const [rawPayments, setRawPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [exportLogs, setExportLogs] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('land_amortization_theme', theme);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Recompute derived fields whenever rawAccounts or rawPayments change
  const recompute = useCallback((accs, pays) => {
    const today = new Date();
    const computedAccs = accs.map(a => computeAccountDerived(a, pays, today));
    const computedPays = pays.map(p => {
      const a = accs.find(acc => String(acc.account_id) === String(p.account_id));
      return computePaymentDerived(p, a);
    });
    const dash = computeDashboard(computedAccs);

    setAccounts(computedAccs);
    setPayments(computedPays);
    setDashboard(dash);

    // If an account is selected, make sure it exists or select the first
    if (computedAccs.length > 0) {
      setSelectedAccountId(prev => {
        if (prev && computedAccs.some(a => String(a.account_id) === String(prev))) {
          return prev;
        }
        return computedAccs[0].account_id;
      });
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [accs, pays, logs] = await Promise.all([
        getAccounts(),
        getPayments(),
        getExportLogs()
      ]);
      setRawAccounts(accs);
      setRawPayments(pays);
      setExportLogs(logs);
      recompute(accs, pays);
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Error loading database');
    } finally {
      setLoading(false);
    }
  }, [recompute]);

  useEffect(() => {
    const init = async () => {
      const isCordovaEnv = Boolean(window.cordova || window.sqlitePlugin);
      setIsCordova(isCordovaEnv);

      const onDeviceReady = async () => {
        try {
          await initDatabase();
          await refreshData();
        } catch (e) {
          console.error('Initialization error:', e);
          setError(e.message);
          setLoading(false);
        }
      };

      if (window.cordova) {
        document.addEventListener('deviceready', onDeviceReady, false);
      } else {
        // Run immediately for web/browser
        onDeviceReady();
      }
    };

    init();
  }, [refreshData]);

  // CRUD Actions
  const handleAddAccount = async (accountData) => {
    await insertAccount(accountData);
    syncUpsertAccount(accountData); // Auto-sync to cloud if online

    // If down payment is marked as paid upfront, automatically create initial Down Payment payment record
    if (Number(accountData.is_dp_paid) === 1 && Number(accountData.down_payment) > 0) {
      const dpPayment = {
        account_id: accountData.account_id,
        payment_date: accountData.date_of_start || toISODateString(new Date()),
        payment_type: 'Down Payment',
        amount_paid: Number(accountData.down_payment),
        receipt_no: `DP-${accountData.account_id}`,
        payment_method: 'Cash',
        remarks: 'Initial Down Payment'
      };
      await insertPayment(dpPayment);
      syncUpsertPayment(dpPayment);
    }

    await refreshData();
  };

  const handleUpdateAccount = async (accountData) => {
    await dbUpdateAccount(accountData);
    syncUpsertAccount(accountData);
    await refreshData();
  };

  const handleDeleteAccount = async (accountId) => {
    await dbDeleteAccount(accountId);
    syncDeleteAccount(accountId);
    await refreshData();
  };

  const handleAddPayment = async (paymentData) => {
    await insertPayment(paymentData);
    syncUpsertPayment(paymentData);

    // If payment is a Down Payment, recompute and reduce monthly amortization on the account
    if (paymentData.payment_type === 'Down Payment') {
      const acc = rawAccounts.find(a => String(a.account_id) === String(paymentData.account_id));
      if (acc) {
        const priorDpPayments = rawPayments.filter(
          p => String(p.account_id) === String(acc.account_id) && p.payment_type === 'Down Payment'
        );
        const priorDpPaid = priorDpPayments.reduce((s, p) => s + (Number(p.amount_paid) || 0), 0);
        const newTotalDpPaid = priorDpPaid + (Number(paymentData.amount_paid) || 0);

        const contract = Number(acc.total_contract_amount) || 0;
        const months = Number(acc.num_of_months) || 120;
        const newMonthly = Number((Math.max(0, contract - newTotalDpPaid) / months).toFixed(2));

        const updatedAcc = {
          ...acc,
          monthly_amortization: newMonthly,
          is_dp_paid: 1
        };
        await dbUpdateAccount(updatedAcc);
        syncUpsertAccount(updatedAcc);
      }
    }

    await refreshData();
  };

  const handleUpdatePayment = async (paymentData) => {
    await dbUpdatePayment(paymentData);
    syncUpsertPayment(paymentData);
    await refreshData();
  };

  const handleDeletePayment = async (paymentId) => {
    const paymentToDelete = rawPayments.find(p => p.payment_id === paymentId);
    await dbDeletePayment(paymentId);
    syncDeletePayment(paymentId);

    if (paymentToDelete && paymentToDelete.payment_type === 'Down Payment') {
      const acc = rawAccounts.find(a => String(a.account_id) === String(paymentToDelete.account_id));
      if (acc) {
        const remainingDpPayments = rawPayments.filter(
          p => p.payment_id !== paymentId && String(p.account_id) === String(acc.account_id) && p.payment_type === 'Down Payment'
        );
        const remainingDpPaid = remainingDpPayments.reduce((s, p) => s + (Number(p.amount_paid) || 0), 0);
        const contract = Number(acc.total_contract_amount) || 0;
        const months = Number(acc.num_of_months) || 120;
        const isPaid = remainingDpPaid >= (Number(acc.down_payment) || 0) && remainingDpPaid > 0;
        const newMonthly = Number((Math.max(0, contract - remainingDpPaid) / months).toFixed(2));

        const updatedAcc = {
          ...acc,
          monthly_amortization: newMonthly,
          is_dp_paid: isPaid ? 1 : 0
        };
        await dbUpdateAccount(updatedAcc);
        syncUpsertAccount(updatedAcc);
      }
    }

    await refreshData();
  };

  const handleExportExcel = async (customFileName) => {
    const res = await saveWorkbookToDevice(rawAccounts, rawPayments, customFileName);
    await addExportLog({
      export_type: 'local_save',
      file_name: res.fileName,
      accounts_exported: rawAccounts.length,
      payments_exported: rawPayments.length
    });
    const logs = await getExportLogs();
    setExportLogs(logs);
    return res;
  };

  const handleShareDrive = async (customFileName) => {
    const res = await shareToGoogleDrive(rawAccounts, rawPayments, customFileName);
    await addExportLog({
      export_type: 'share_google_drive',
      file_name: res.fileName,
      accounts_exported: rawAccounts.length,
      payments_exported: rawPayments.length
    });
    const logs = await getExportLogs();
    setExportLogs(logs);
    return res;
  };

  const handleResetSample = async () => {
    await resetToSampleData();
    await refreshData();
  };

  const handleClearAll = async () => {
    await clearAllData();
    await refreshData();
  };

  const value = {
    loading,
    error,
    activeTab,
    setActiveTab,
    selectedAccountId,
    setSelectedAccountId,
    isCordova,
    theme,
    toggleTheme,
    rawAccounts,
    rawPayments,
    accounts,
    payments,
    dashboard,
    exportLogs,
    addAccount: handleAddAccount,
    updateAccount: handleUpdateAccount,
    deleteAccount: handleDeleteAccount,
    addPayment: handleAddPayment,
    updatePayment: handleUpdatePayment,
    deletePayment: handleDeletePayment,
    refreshData,
    exportExcel: handleExportExcel,
    shareDrive: handleShareDrive,
    resetSample: handleResetSample,
    clearAll: handleClearAll
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
