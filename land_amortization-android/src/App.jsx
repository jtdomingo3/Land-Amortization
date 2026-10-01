import React from 'react';
import { useApp } from './context/AppContext.jsx';
import { Header } from './components/Header.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AccountsPage } from './pages/AccountsPage.jsx';
import { PaymentsPage } from './pages/PaymentsPage.jsx';
import { SchedulePage } from './pages/SchedulePage.jsx';
import { ExportSharePage } from './pages/ExportSharePage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { WelcomeModal } from './components/WelcomeModal.jsx';
import { Loader2 } from 'lucide-react';

export function App() {
  const { activeTab, loading, error } = useApp();

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
        <Loader2 className="animate-spin" size={36} color="var(--accent-emerald)" style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading Land Amortization...</div>
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
        return <ExportSharePage />;
      case 'settings':
        return <SettingsPage />;
      case 'help':
        return <SettingsPage defaultOpenHelp={true} />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      <div className="app-container">
        <Header />

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            borderBottom: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '8px 16px',
            fontSize: '0.8rem',
            textAlign: 'center'
          }}>
            Database Warning: {error}
          </div>
        )}

        <main className="app-content">
          {renderContent()}
        </main>

        <WelcomeModal />

        <BottomNav />
      </div>

      <div id="print-area"></div>
    </>
  );
}

export default App;
