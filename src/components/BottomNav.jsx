import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarRange,
  CloudUpload,
  Settings
} from 'lucide-react';

export function BottomNav() {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'schedule', label: 'Schedule', icon: CalendarRange },
    { id: 'export', label: 'Export', icon: CloudUpload },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.label}
          >
            <div className="nav-icon-wrapper">
              <Icon size={19} />
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
