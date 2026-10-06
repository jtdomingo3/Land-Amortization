import React, { useState } from 'react';
import { useApp } from './context/AppContext.jsx';
import { Header } from './components/Header.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AccountsPage } from './pages/AccountsPage.jsx';
import { PaymentsPage } from './pages/PaymentsPage.jsx';
import { SchedulePage } from './pages/SchedulePage.jsx';
import { ExportSharePage } from './pages/ExportSharePage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { HelpPage } from './pages/HelpPage.jsx';
import { WelcomeModal } from './components/WelcomeModal.jsx';
import { AccountFormModal } from './pages/AccountFormModal.jsx';
import { PaymentFormModal } from './pages/PaymentFormModal.jsx';
import { Loader2 } from 'lucide-react';
import { syncWithSupabase } from './services/supabaseSync.js';

export function App() {
  const {
    activeTab,
    loading,
    error,
    refreshData,
    isSyncing,
    syncStatus,
    lastSyncedAt,
    syncCloud,
    accounts,
    addAccount,
    addPayment,
    isNewAccountModalOpen,
    closeNewAccountModal,
    globalPaymentModalConfig,
    closeNewPaymentModal
  } = useApp();

  const handleSyncCloud = () => {
    return syncCloud({ silent: false });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        gap: 12
      }}>
        <Loader2 className="animate-spin" size={40} color="var(--accent-emerald)" style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Loading Land Amortization Tracker...</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Initializing offline SQLite database engine</div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'accounts':
        return <AccountsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'schedule':
        return <SchedulePage />;
      case 'export':
        return <ExportSharePage onSync={handleSyncCloud} isSyncing={isSyncing} syncStatus={syncStatus} lastSyncedAt={lastSyncedAt} />;
      case 'settings':
        return <SettingsPage />;
      case 'help':
        return <HelpPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      <div className="desktop-app-layout">
        {/* Desktop Sidebar Navigation */}
        <Sidebar />

        {/* Desktop Main Content Container */}
        <div className="desktop-main-wrapper">
          <Header
            onSync={handleSyncCloud}
            isSyncing={isSyncing}
            syncStatus={syncStatus}
            lastSyncedAt={lastSyncedAt}
          />

          {error && (
            <div className="desktop-db-warning">
              <span>Database Notice: {error}</span>
            </div>
          )}

          {syncStatus && (
            <div className="desktop-sync-banner">
              <span>{syncStatus}</span>
            </div>
          )}

          <main className="app-content">
            <div className="content-container">
              {renderContent()}
            </div>
          </main>
        </div>

        <WelcomeModal />

        {/* Global Action Modals triggered by upper-left Sidebar shortcuts */}
        <AccountFormModal
          isOpen={isNewAccountModalOpen}
          onClose={closeNewAccountModal}
          onSave={addAccount}
          existingAccounts={accounts}
        />

        <PaymentFormModal
          isOpen={Boolean(globalPaymentModalConfig?.isOpen)}
          onClose={closeNewPaymentModal}
          onSave={addPayment}
          accounts={accounts}
          defaultAccountId={globalPaymentModalConfig?.defaultAccountId || null}
          defaultPaymentType={globalPaymentModalConfig?.defaultPaymentType || 'Monthly Amortization'}
          defaultAmount={globalPaymentModalConfig?.defaultAmount !== undefined ? globalPaymentModalConfig.defaultAmount : null}
        />
      </div>

      <div id="print-area"></div>
    </>
  );
}

export default App;
