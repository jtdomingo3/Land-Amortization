import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import logoImg from '../assets/logo.png';
import { Share2, Sun, Moon, Cloud, Bell } from 'lucide-react';
import { evaluateNotifications } from '../services/notificationService.js';

export function Header({ onSync, isSyncing, syncStatus, lastSyncedAt, onOpenNotifications }) {
  const { setActiveTab, theme, toggleTheme, syncCloud, isSyncing: appIsSyncing, accounts } = useApp();

  const handleSync = onSync || (() => syncCloud({ silent: false }));
  const syncing = isSyncing !== undefined ? isSyncing : appIsSyncing;
  const { totalAlerts } = evaluateNotifications(accounts || []);

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
        {/* Notifications Alert Bell */}
        {onOpenNotifications && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenNotifications}
            title={totalAlerts > 0 ? `${totalAlerts} payment alerts` : 'Notifications'}
            aria-label="Payment Notifications"
            style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          >
            <Bell size={16} color={totalAlerts > 0 ? 'var(--accent-rose)' : 'var(--text-secondary)'} />
            {totalAlerts > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 10,
                  background: 'var(--accent-rose)',
                  color: '#fff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 6px rgba(244, 63, 94, 0.6)'
                }}
              >
                {totalAlerts}
              </span>
            )}
          </button>
        )}

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
      </div>
    </header>
  );
}

export default Header;
