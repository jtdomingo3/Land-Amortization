import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import logoImg from '../assets/logo.png';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarRange,
  CloudUpload,
  Settings,
  HelpCircle,
  PlusCircle,
  Database,
  Cloud,
  CheckCircle2
} from 'lucide-react';

export function Sidebar({ onNewAccount, onNewPayment }) {
  const { activeTab, setActiveTab, accounts, payments } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Users, badge: accounts?.length || 0 },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: payments?.length || 0 },
    { id: 'schedule', label: 'Schedule', icon: CalendarRange },
    { id: 'export', label: 'Export & Sync', icon: CloudUpload },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'User Guide', icon: HelpCircle }
  ];

  const isElectron = Boolean(window.electronAPI);

  return (
    <aside className="sidebar-nav">
      {/* Brand Header */}
      <div className="sidebar-brand" onClick={() => setActiveTab('dashboard')}>
        <img src={logoImg} alt="App Logo" className="sidebar-logo-img" />
        <div className="sidebar-brand-text">
          <span className="sidebar-title">Land Amortization</span>
          <span className="sidebar-subtitle">Desktop Tracker</span>
        </div>
      </div>

      {/* Quick Action Buttons for Easy PC Usage */}
      <div className="sidebar-quick-actions">
        <button
          className="btn btn-primary btn-sm sidebar-quick-btn"
          onClick={() => {
            setActiveTab('accounts');
            if (onNewAccount) onNewAccount();
          }}
          title="Create New Land Amortization Account"
        >
          <PlusCircle size={15} />
          <span>New Account</span>
        </button>

        <button
          className="btn btn-secondary btn-sm sidebar-quick-btn"
          onClick={() => {
            setActiveTab('payments');
            if (onNewPayment) onNewPayment();
          }}
          title="Record a Payment"
        >
          <CreditCard size={15} />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-menu">
        <div className="sidebar-menu-heading">NAVIGATION</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
            >
              <div className="sidebar-nav-icon">
                <Icon size={18} />
              </div>
              <span className="sidebar-nav-label">{item.label}</span>
              {typeof item.badge !== 'undefined' && item.badge > 0 && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom System Status Widget */}
      <div className="sidebar-footer">
        <div className="sidebar-status-card">
          <div className="status-indicator-row">
            <span className="status-live-dot"></span>
            <span className="status-heading">
              {isElectron ? 'SQLite Engine: Active' : 'Offline Local Storage'}
            </span>
          </div>
          <div className="status-details">
            <span className="status-detail-item">
              <Database size={12} /> {accounts?.length || 0} Accounts Loaded
            </span>
            <span className="status-detail-item">
              <Cloud size={12} /> Supabase Sync Ready
            </span>
          </div>
        </div>
        <div className="sidebar-version-tag">
          Land Amortization Desktop v1.0
        </div>
      </div>
    </aside>
  );
}
