import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { AccountFormModal } from './AccountFormModal.jsx';
import { AccountDetailPage } from './AccountDetailPage.jsx';
import {
  Search,
  Plus,
  ArrowUpDown,
  Filter,
  Users,
  ChevronRight,
  Clock,
  Calendar,
  FileSpreadsheet,
  Table as TableIcon,
  LayoutGrid,
  FileText,
  MapPin
} from 'lucide-react';

export function AccountsPage() {
  const { accounts, addAccount, resetSample } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('id-asc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingAccountId, setViewingAccountId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Filter & Sort
  const filteredAccounts = useMemo(() => {
    return accounts
      .filter(acc => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = String(acc.account_id).includes(q);
          const matchName = (acc.name || '').toLowerCase().includes(q);
          const matchTitle = (acc.land_title_number || '').toLowerCase().includes(q);
          if (!matchId && !matchName && !matchTitle) return false;
        }

        // Status filter
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'PENALTY' && !acc.status.includes('PENALTY')) return false;
          if (statusFilter === 'OVERDUE' && acc.status !== 'OVERDUE') return false;
          if (statusFilter === 'ACTIVE' && acc.status !== 'ACTIVE') return false;
          if (statusFilter === 'PAID' && acc.status !== 'PAID') return false;
          if (statusFilter === 'DP_OVERDUE' && !acc.status.includes('DOWN PAYMENT')) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'id-asc':
            return Number(a.account_id) - Number(b.account_id);
          case 'id-desc':
            return Number(b.account_id) - Number(a.account_id);
          case 'name-asc':
            return (a.name || '').localeCompare(b.name || '');
          case 'balance-desc':
            return (b.outstanding_balance || 0) - (a.outstanding_balance || 0);
          case 'overdue-desc':
            return (b.days_overdue || 0) - (a.days_overdue || 0);
          default:
            return 0;
        }
      });
  }, [accounts, searchQuery, statusFilter, sortBy]);

  // If viewing detail of a specific account, show detail view
  if (viewingAccountId) {
    return (
      <AccountDetailPage
        accountId={viewingAccountId}
        onBack={() => setViewingAccountId(null)}
      />
    );
  }

  return (
    <div className="accounts-page desktop-page">
      {/* Desktop Page Action Header */}
      <div className="desktop-toolbar-card glass-card">
        <div className="toolbar-top-row">
          <div className="toolbar-search-group">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by buyer name, account #, title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="sort-wrapper">
              <select
                className="form-select"
                style={{ minWidth: 150, fontSize: '0.82rem' }}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="id-asc">Sort: ID (Ascending)</option>
                <option value="id-desc">Sort: ID (Descending)</option>
                <option value="name-asc">Sort: Name (A-Z)</option>
                <option value="balance-desc">Sort: Highest Balance</option>
                <option value="overdue-desc">Sort: Days Overdue</option>
              </select>
            </div>
          </div>

          {/* Desktop Right Actions: View Toggle + Prominent Add Button */}
          <div className="toolbar-actions-group">
            <div className="view-toggle-group">
              <button
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View (Desktop Spreadsheet)"
              >
                <TableIcon size={16} />
                <span>Table</span>
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid Cards View"
              >
                <LayoutGrid size={16} />
                <span>Cards</span>
              </button>
            </div>

            <button
              className="btn btn-primary desktop-main-btn"
              onClick={() => setIsAddModalOpen(true)}
              title="Add New Land Account"
            >
              <Plus size={16} />
              <span>New Account</span>
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="status-filter-row">
          {[
            { id: 'ALL', label: `All Accounts (${accounts.length})` },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'OVERDUE', label: 'Overdue' },
            { id: 'PENALTY', label: 'In Penalty' },
            { id: 'DP_OVERDUE', label: 'DP Overdue' },
            { id: 'PAID', label: 'Fully Paid' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`filter-pill ${statusFilter === filter.id ? 'active' : ''}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Account Records List / Table */}
      {filteredAccounts.length === 0 ? (
        <div className="glass-card empty-state-card">
          <div className="empty-icon-box">
            <Users size={32} />
          </div>
          <h4>{accounts.length === 0 ? 'No Land Accounts Yet' : 'No matching accounts found'}</h4>
          <p>
            {accounts.length === 0
              ? 'Start by creating your first buyer account, or load sample demo data to see how calculations and waterfall schedules work.'
              : 'Try clearing your search terms or selecting a different status filter.'}
          </p>
          <div className="empty-actions">
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} />
              {accounts.length === 0 ? 'Create First Account' : 'New Account'}
            </button>
            {accounts.length === 0 && (
              <button className="btn btn-secondary" onClick={resetSample}>
                <FileSpreadsheet size={16} color="var(--accent-emerald)" />
                Load Sample Demo Data
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* DESKTOP TABLE VIEW */
        <div className="desktop-table-container glass-card">
          <table className="desktop-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Buyer Name</th>
                <th>Land Title / Area</th>
                <th>Contract Amount</th>
                <th>Total Paid</th>
                <th>Balance Due</th>
                <th>Monthly Amortization</th>
                <th>Next Due Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(account => {
                const isOverdue = account.days_overdue > 0;
                return (
                  <tr
                    key={account.account_id}
                    onClick={() => setViewingAccountId(account.account_id)}
                    className="desktop-table-row"
                  >
                    <td className="cell-mono font-bold">#{account.account_id}</td>
                    <td className="cell-primary">
                      <div className="buyer-name-cell">
                        <span className="buyer-name">{account.name}</span>
                        {account.down_payment > 0 && Number(account.total_dp_paid || 0) < Number(account.down_payment) && (
                          <span className="badge-warning-inline">DP Unpaid</span>
                        )}
                      </div>
                    </td>
                    <td className="cell-muted">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{account.land_title_number || 'N/A'}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{account.land_area_sqm || 0} sqm</span>
                      </div>
                    </td>
                    <td className="cell-mono">{formatCurrency(account.total_contract_amount)}</td>
                    <td className="cell-mono cell-emerald">{formatCurrency(account.total_paid)}</td>
                    <td className="cell-mono font-bold" style={{ color: account.outstanding_balance > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                      {formatCurrency(account.outstanding_balance)}
                    </td>
                    <td className="cell-mono">{formatCurrency(account.monthly_amortization)}/mo</td>
                    <td className="cell-date">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        <span>{formatDate(account.next_due_date)}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={account.status} />
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 16 }}>
                      <button
                        className="btn btn-secondary btn-sm table-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingAccountId(account.account_id);
                        }}
                      >
                        <FileText size={14} />
                        <span>View Ledger</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* DESKTOP GRID CARDS VIEW */
        <div className="desktop-account-grid">
          {filteredAccounts.map(account => {
            const isOverdue = account.days_overdue > 0;
            return (
              <div
                key={account.account_id}
                className="account-card glass-card"
                onClick={() => setViewingAccountId(account.account_id)}
              >
                <div className="account-card-header">
                  <div className="account-title-group">
                    <span className="account-id-tag">ID #{account.account_id}</span>
                    <h3>{account.name}</h3>
                    <div className="account-subtitle">
                      <span>Title: {account.land_title_number || 'N/A'}</span>
                      <span>•</span>
                      <span>{account.land_area_sqm || 0} sqm</span>
                    </div>
                  </div>
                  <StatusBadge status={account.status} />
                </div>

                <div className="account-financials">
                  <div className="fin-col">
                    <span className="label">Total Contract</span>
                    <span className="value">{formatCurrency(account.total_contract_amount)}</span>
                  </div>
                  <div className="fin-col">
                    <span className="label">Total Paid</span>
                    <span className="value" style={{ color: 'var(--accent-emerald-light)' }}>
                      {formatCurrency(account.total_paid)}
                    </span>
                  </div>
                  <div className="fin-col full-width">
                    <span className="label">Balance Due</span>
                    <span className="value" style={{ color: account.outstanding_balance > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontSize: '0.92rem' }}>
                      {formatCurrency(account.outstanding_balance)}
                    </span>
                  </div>
                </div>

                <div className="account-card-footer">
                  <div className="due-date-indicator">
                    <Calendar size={13} />
                    <span>Next Due: <strong>{formatDate(account.next_due_date)}</strong></span>
                  </div>

                  <div className="card-footer-badges">
                    {account.down_payment > 0 && Number(account.total_dp_paid || 0) < Number(account.down_payment) && (
                      <span className="badge-warning-inline">DP Unpaid</span>
                    )}
                    {isOverdue && (
                      <span className="badge-overdue-inline">{account.days_overdue}d overdue</span>
                    )}
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      <AccountFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={addAccount}
        existingAccounts={accounts}
      />
    </div>
  );
}
