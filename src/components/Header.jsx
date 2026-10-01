import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import logoImg from '../assets/logo.png';
import { Share2, Sun, Moon } from 'lucide-react';

export function Header() {
  const { setActiveTab, isCordova, theme, toggleTheme } = useApp();

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
          <div className="status-row">
            <span className="offline-pill">
              <span className="offline-dot"></span>
              {isCordova ? 'Offline SQLite' : 'Offline Storage'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Theme Toggle Button (Light / Dark) */}
        <button
          className="btn btn-secondary btn-sm theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
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
        >
          <Share2 size={16} />
          <span className="header-export-text">Export</span>
        </button>
      </div>
    </header>
  );
}
