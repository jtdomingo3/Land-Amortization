import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Download, Sun, Moon, RotateCw, Cloud, HardDrive, Bell } from 'lucide-react';
import { formatLastSync } from '../utils/formatters.js';

export function Header({ onSync, isSyncing, syncStatus, lastSyncedAt }) {
  const app = useApp();
  const { activeTab, setActiveTab, theme, toggleTheme, refreshData, loading } = app;

  const currentOnSync = onSync || app.syncCloud;
  const currentIsSyncing = isSyncing !== undefined ? isSyncing : app.isSyncing;
  const currentSyncStatus = syncStatus !== undefined ? syncStatus : app.syncStatus;
  const currentLastSyncedAt = lastSyncedAt !== undefined ? lastSyncedAt : app.lastSyncedAt;

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
        {/* Supabase Sync Button with Live Date & Time of Last Sync */}
        {currentOnSync && (
          <div
            className="header-sync-container"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
              userSelect: 'none'
            }}
          >
            <button
              className={`btn btn-secondary btn-sm header-sync-btn ${currentIsSyncing ? 'syncing' : ''}`}
              onClick={() => currentOnSync()}
              disabled={currentIsSyncing}
              title={
                currentLastSyncedAt
                  ? `Last Synced: ${new Date(currentLastSyncedAt).toLocaleString()}\nClick to synchronize now with Supabase Cloud`
                  : (currentSyncStatus || 'Sync with Supabase Cloud')
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                height: 32
              }}
            >
              <Cloud
                size={15}
                className={currentIsSyncing ? 'animate-spin' : ''}
                color={currentIsSyncing ? 'var(--accent-cyan)' : (currentLastSyncedAt ? 'var(--accent-emerald)' : 'var(--text-secondary)')}
              />
              <span className="btn-text">{currentIsSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
              {currentLastSyncedAt && !currentIsSyncing && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--accent-emerald)',
                    display: 'inline-block',
                    boxShadow: '0 0 6px var(--accent-emerald)'
                  }}
                  title="Connected & Synced"
                />
              )}
            </button>

            <span
              className="header-sync-time"
              style={{
                fontSize: '0.64rem',
                color: currentIsSyncing ? 'var(--accent-cyan)' : 'var(--text-muted)',
                marginTop: 2,
                fontWeight: 600,
                lineHeight: 1,
                whiteSpace: 'nowrap'
              }}
              title={currentLastSyncedAt ? `Last Synced: ${new Date(currentLastSyncedAt).toLocaleString()}` : 'Not synchronized yet'}
            >
              {currentIsSyncing ? 'Syncing...' : (currentLastSyncedAt ? `Synced: ${formatLastSync(currentLastSyncedAt)}` : 'Never synced')}
            </span>
          </div>
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
