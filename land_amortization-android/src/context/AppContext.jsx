import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  getPenalties,
  insertPenalty as dbInsertPenalty,
  waivePenalty as dbWaivePenalty,
  deletePenalty as dbDeletePenalty,
  getExportLogs,
  addExportLog,
  resetToSampleData,
  clearAllData,
  clearDeletedRecords
} from '../db/database.js';
import { computeAccountDerived, computePaymentDerived } from '../engine/calculations.js';
import { computeDashboard } from '../engine/dashboard.js';
import { saveWorkbookToDevice } from '../export/excelExport.js';
import { shareToGoogleDrive } from '../share/shareFile.js';
import {
  syncWithSupabase,
  getSupabaseConfig,
  saveSupabaseConfig,
  syncUpsertAccount,
  syncDeleteAccount,
  syncUpsertPayment,
  syncDeletePayment,
  syncUpsertPenalty,
  syncDeletePenalty
} from '../services/supabaseSync.js';

import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { ToastContainer } from '../components/Toast.jsx';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [isCordova, setIsCordova] = useState(false);

  // Cloud Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => {
    try {
      const cfg = getSupabaseConfig();
      return cfg.lastSyncedAt || localStorage.getItem('land_amortization_last_synced') || null;
    } catch {
      return null;
    }
  });

  const isSyncingRef = useRef(false);
  const autoSyncTimerRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('land_amortization_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  const [rawAccounts, setRawAccounts] = useState([]);
  const [rawPayments, setRawPayments] = useState([]);
  const [rawPenalties, setRawPenalties] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [exportLogs, setExportLogs] = useState([]);
  const [dialogConfig, setDialogConfig] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialogConfig({
        ...options,
        isOpen: true,
        isAlert: false,
        onConfirm: () => {
          setDialogConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setDialogConfig(null);
          resolve(false);
        }
      });
    });
  }, []);

  const showAlert = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    return new Promise((resolve) => {
      setDialogConfig({
        title: 'Notice',
        type: 'info',
        ...opts,
        isOpen: true,
        isAlert: true,
        confirmText: opts?.confirmText || 'Understood',
        onConfirm: () => {
          setDialogConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setDialogConfig(null);
          resolve(true);
        }
      });
    });
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [globalPaymentModalConfig, setGlobalPaymentModalConfig] = useState({
    isOpen: false,
    defaultAccountId: null,
    defaultPaymentType: 'Monthly Amortization',
    defaultAmount: null
  });

  const openNewAccountModal = useCallback(() => {
    setIsNewAccountModalOpen(true);
  }, []);

  const closeNewAccountModal = useCallback(() => {
    setIsNewAccountModalOpen(false);
  }, []);

  const openNewPaymentModal = useCallback((config = {}) => {
    if (accounts.length === 0) {
      showToast('No accounts found. Please create an account first.', 'warning');
      setIsNewAccountModalOpen(true);
      return;
    }
    setGlobalPaymentModalConfig({
      isOpen: true,
      defaultAccountId: config?.defaultAccountId || null,
      defaultPaymentType: config?.defaultPaymentType || 'Monthly Amortization',
      defaultAmount: config?.defaultAmount !== undefined ? config.defaultAmount : null
    });
  }, [accounts, showToast]);

  const closeNewPaymentModal = useCallback(() => {
    setGlobalPaymentModalConfig(prev => ({ ...prev, isOpen: false }));
  }, []);

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

  // Recompute derived fields whenever rawAccounts, rawPayments, or rawPenalties change
  const recompute = useCallback((accs, pays, pens = []) => {
    const today = new Date();
    const computedAccs = accs.map(a => computeAccountDerived(a, pays, today, pens));
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
      const [accs, pays, pens, logs] = await Promise.all([
        getAccounts(),
        getPayments(),
        getPenalties(),
        getExportLogs()
      ]);
      setRawAccounts(accs);
      setRawPayments(pays);
      setRawPenalties(pens);
      setExportLogs(logs);
      recompute(accs, pays, pens);
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Error loading database');
    } finally {
      setLoading(false);
    }
  }, [recompute]);

  // Full Bidirectional Cloud Sync
  const syncCloud = useCallback(async (options = {}) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);

    if (!options.silent) {
      setSyncStatus('Connecting to Supabase...');
    }

    try {
      const res = await syncWithSupabase();
      if (res && res.success) {
        const now = res.timestamp || new Date().toISOString();
        setLastSyncedAt(now);
        try {
          localStorage.setItem('land_amortization_last_synced', now);
          saveSupabaseConfig({ lastSyncedAt: now });
        } catch (_) {}

        if (!options.silent) {
          setSyncStatus(`Sync complete! ${res.message || ''}`);
        }
        // Refresh local data in case new records were pulled
        await refreshData();
        return res;
      } else {
        if (!options.silent && res?.message) {
          setSyncStatus(`Sync notice: ${res.message}`);
        }
        return res;
      }
    } catch (err) {
      console.warn('[Cloud Sync] Error during sync:', err);
      if (!options.silent) {
        setSyncStatus(`Sync error: ${err.message}`);
      }
      return { success: false, message: err.message };
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      if (!options.silent) {
        setTimeout(() => setSyncStatus(null), 5000);
      }
    }
  }, [refreshData]);

  // Debounced auto-sync trigger after database modifications
  const triggerAutoSync = useCallback(() => {
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
    }
    autoSyncTimerRef.current = setTimeout(() => {
      console.log('[Cloud Sync] Auto-sync triggered after data changes...');
      syncCloud({ silent: true });
    }, 800);
  }, [syncCloud]);

  useEffect(() => {
    const init = async () => {
      const isCordovaEnv = Boolean(window.cordova || window.sqlitePlugin);
      setIsCordova(isCordovaEnv);

      const onDeviceReady = async () => {
        try {
          await initDatabase();
          await refreshData();

          // Auto-sync upon opening (after database is loaded)
          setTimeout(() => {
            console.log('[Cloud Sync] Auto-sync upon app opening...');
            syncCloud({ silent: true });
          }, 1200);
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
  }, [refreshData, syncCloud]);

  // CRUD Actions
  const handleAddAccount = async (accountData) => {
    await insertAccount(accountData);
    syncUpsertAccount(accountData);

    // If down payment is marked as paid upfront, automatically create initial Down Payment payment record
    if (Number(accountData.is_dp_paid) === 1 && Number(accountData.down_payment) > 0) {
      const dpPayment = {
        account_id: accountData.account_id,
        payment_date: accountData.date_of_start || new Date().toISOString().substring(0, 10),
        payment_type: 'Down Payment',
        amount_paid: Number(accountData.down_payment),
        receipt_no: `DP-${accountData.account_id}`,
        payment_method: 'Cash',
        remarks: 'Initial Down Payment'
      };
      const createdDp = await insertPayment(dpPayment);
      if (createdDp && createdDp.payment_id) {
        syncUpsertPayment(createdDp);
      }
    }

    await refreshData();
    triggerAutoSync();
    showToast(`Account #${accountData.account_id} created successfully!`, 'success');
  };

  const handleUpdateAccount = async (accountData) => {
    await dbUpdateAccount(accountData);
    syncUpsertAccount(accountData);
    await refreshData();
    triggerAutoSync();
    showToast(`Account #${accountData.account_id} updated successfully!`, 'success');
  };

  const handleDeleteAccount = async (accountId) => {
    await dbDeleteAccount(accountId);
    syncDeleteAccount(accountId);
    await refreshData();
    triggerAutoSync();
  };

  const handleAddPayment = async (paymentData) => {
    const createdPayment = await insertPayment(paymentData);
    if (createdPayment && createdPayment.payment_id) {
      syncUpsertPayment(createdPayment);
    }

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
    triggerAutoSync();
    showToast(`Payment of ₱${Number(paymentData.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })} recorded successfully!`, 'success');
  };

  const handleUpdatePayment = async (paymentData) => {
    await dbUpdatePayment(paymentData);
    syncUpsertPayment(paymentData);
    await refreshData();
    triggerAutoSync();
    showToast(`Payment #${paymentData.payment_id} updated successfully!`, 'success');
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
    triggerAutoSync();
  };

  const handleAddPenalty = async (penaltyData) => {
    await dbInsertPenalty(penaltyData);
    syncUpsertPenalty(penaltyData);
    await refreshData();
    triggerAutoSync();
  };

  const handleWaivePenalty = async (penaltyId, waivedAmount) => {
    await dbWaivePenalty(penaltyId, waivedAmount);
    const updated = rawPenalties.find(p => p.penalty_id === penaltyId);
    if (updated) {
      syncUpsertPenalty({
        ...updated,
        status: 'WAIVED',
        waived_amount: waivedAmount !== undefined ? waivedAmount : updated.penalty_amount
      });
    }
    await refreshData();
    triggerAutoSync();
  };

  const handleDeletePenalty = async (penaltyId) => {
    await dbDeletePenalty(penaltyId);
    syncDeletePenalty(penaltyId);
    await refreshData();
    triggerAutoSync();
  };

  const handleExportExcel = async (customFileName) => {
    const res = await saveWorkbookToDevice(rawAccounts, rawPayments, customFileName);
    if (res && res.success && !res.canceled) {
      const safeName = res.fileName || customFileName || `Land_Amortization_Tracker_${new Date().toISOString().substring(0, 10)}.xlsx`;
      await addExportLog({
        export_type: 'local_save',
        file_name: safeName,
        accounts_exported: rawAccounts.length,
        payments_exported: rawPayments.length
      });
      const logs = await getExportLogs();
      setExportLogs(logs);
    }
    return res;
  };

  const handleShareDrive = async (customFileName) => {
    // Preserved Android's stable Google Drive implementation
    const res = await shareToGoogleDrive(rawAccounts, rawPayments, customFileName);
    if (res && res.success && !res.canceled) {
      const safeName = res.fileName || customFileName || `Land_Amortization_Tracker_${new Date().toISOString().substring(0, 10)}.xlsx`;
      await addExportLog({
        export_type: 'share_google_drive',
        file_name: safeName,
        accounts_exported: rawAccounts.length,
        payments_exported: rawPayments.length
      });
      const logs = await getExportLogs();
      setExportLogs(logs);
    }
    return res;
  };

  const handleResetSample = async () => {
    await resetToSampleData();
    await refreshData();
    triggerAutoSync();
  };

  const handleClearAll = async () => {
    await clearAllData();
    clearDeletedRecords();
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
    rawPenalties,
    accounts,
    payments,
    dashboard,
    exportLogs,
    isSyncing,
    syncStatus,
    lastSyncedAt,
    syncCloud,
    triggerAutoSync,
    addAccount: handleAddAccount,
    updateAccount: handleUpdateAccount,
    deleteAccount: handleDeleteAccount,
    addPayment: handleAddPayment,
    updatePayment: handleUpdatePayment,
    deletePayment: handleDeletePayment,
    addPenalty: handleAddPenalty,
    waivePenalty: handleWaivePenalty,
    deletePenalty: handleDeletePenalty,
    refreshData,
    exportExcel: handleExportExcel,
    shareDrive: handleShareDrive,
    resetSample: handleResetSample,
    clearAll: handleClearAll,
    showConfirm,
    showAlert,
    showToast,
    isNewAccountModalOpen,
    setIsNewAccountModalOpen,
    openNewAccountModal,
    closeNewAccountModal,
    globalPaymentModalConfig,
    setGlobalPaymentModalConfig,
    openNewPaymentModal,
    closeNewPaymentModal
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {dialogConfig && <ConfirmDialog {...dialogConfig} />}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
