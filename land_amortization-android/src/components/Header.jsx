import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import logoImg from '../assets/logo.png';
import { Share2, Sun, Moon, Cloud } from 'lucide-react';

export function Header({ onSync, isSyncing, syncStatus, lastSyncedAt }) {
  const { setActiveTab, theme, toggleTheme, syncCloud, isSyncing: appIsSyncing } = useApp();

  const handleSync = onSync || (() => syncCloud({ silent: false }));
  const syncing = isSyncing !== undefined ? isSyncing : appIsSyncing;

  return (
    <header className="app-header">
      <div className="brand-badge" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
        <img
          src={logoImg}
          alt="App Logo"
          className="brand-logo-img"
        />
        <div className="brand-text">
          <h1>Land Amortization</h1>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Tracker</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Quick Cloud Sync Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleSync}
          disabled={syncing}
          title={syncing ? 'Syncing...' : 'Sync with Supabase Cloud'}
          aria-label="Sync with Supabase Cloud"
          style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Cloud
            size={16}
            color={syncing ? 'var(--accent-cyan)' : 'var(--accent-emerald)'}
            className={syncing ? 'animate-spin' : ''}
          />
        </button>

        {/* Theme Toggle Button (Light / Dark) */}
        <button
          className="btn btn-secondary btn-sm theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
          style={{ padding: '6px 8px' }}
        >
          {theme === 'dark' ? (
            <Sun size={17} color="#fbbf24" />
          ) : (
            <Moon size={17} color="#475569" />
          )}
        </button>

        {/* Quick Export Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setActiveTab('export')}
          title="Export / Share to Google Drive"
          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Share2 size={15} />
          <span className="header-export-text">Export</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
