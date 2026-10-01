import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Download, Sun, Moon, RotateCw, Cloud, HardDrive, Bell } from 'lucide-react';

export function Header({ onSync, isSyncing, syncStatus }) {
  const { activeTab, setActiveTab, theme, toggleTheme, refreshData, loading } = useApp();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Collection overview & amortized loan metrics' };
      case 'accounts':
        return { title: 'Accounts Directory', subtitle: 'Manage land buyers, contracts, and terms' };
      case 'payments':
        return { title: 'Payment Ledger', subtitle: 'Track installment collections & official receipts' };
      case 'schedule':
        return { title: 'Amortization Schedules', subtitle: 'Projected vs actual installment waterfall breakdown' };
      case 'export':
        return { title: 'Export & Cloud Sync', subtitle: 'Backup to Excel or synchronize with Supabase' };
      case 'settings':
        return { title: 'System Settings', subtitle: 'Preferences, database management & credentials' };
      case 'help':
        return { title: 'Documentation & Guide', subtitle: 'Penalty formulas, calculations, and rules' };
      default:
        return { title: 'Land Amortization', subtitle: 'PC Management Studio' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="desktop-app-header">
      <div className="header-titles">
        <h1 className="header-page-title">{title}</h1>
        <p className="header-page-subtitle">{subtitle}</p>
      </div>

      <div className="header-actions">
        {/* Supabase Sync Button */}
        {onSync && (
          <button
            className={`btn btn-secondary btn-sm header-sync-btn ${isSyncing ? 'syncing' : ''}`}
            onClick={onSync}
            disabled={isSyncing}
            title={syncStatus || 'Sync with Supabase Cloud'}
          >
            <Cloud size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span className="btn-text">{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>
        )}

        {/* Refresh Database Data */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => refreshData()}
          disabled={loading}
          title="Reload data from SQLite"
          aria-label="Reload Data"
        >
          <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
          <span className="btn-text">Refresh</span>
        </button>

        {/* Theme Toggle Button (Light / Dark) */}
        <button
          className="btn btn-secondary btn-sm theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun size={16} color="#fbbf24" />
          ) : (
            <Moon size={16} color="#475569" />
          )}
        </button>

        {/* Quick Export Button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setActiveTab('export')}
          title="Export Data & Backup to Excel"
        >
          <Download size={15} />
          <span className="btn-text">Export Excel</span>
        </button>
      </div>
    </header>
  );
}
