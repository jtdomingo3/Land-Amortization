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
  Trash2
} from 'lucide-react';

export function AccountsPage() {
  const { accounts, addAccount, resetSample, deleteAccount, showConfirm, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('id-asc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingAccountId, setViewingAccountId] = useState(null);

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

  const handleDeleteAccount = async (account, e) => {
    if (e) e.stopPropagation();
    const confirmed = await showConfirm({
      title: `Delete Account #${account.account_id}?`,
      message: `Are you sure you want to permanently delete ${account.name}'s account record?`,
      details: 'All associated amortization payments and ledger records will be deleted locally and in the cloud database.',
      confirmText: 'Delete Account',
      cancelText: 'Keep Account',
      type: 'danger'
    });
    if (confirmed) {
      await deleteAccount(account.account_id);
      showToast(`Account #${account.account_id} (${account.name}) deleted successfully`, 'success');
    }
  };

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
    <div className="accounts-page">
      {/* Search and Filters Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by buyer, ID, title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 120, fontSize: '0.8rem' }}
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="id-asc">ID ↑</option>
          <option value="id-desc">ID ↓</option>
          <option value="name-asc">Name A-Z</option>
          <option value="balance-desc">Balance ↓</option>
          <option value="overdue-desc">Days Overdue ↓</option>
        </select>
      </div>

      {/* Status Filter Pills */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 14,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        {[
          { id: 'ALL', label: `All (${accounts.length})` },
          { id: 'ACTIVE', label: 'Active' },
          { id: 'OVERDUE', label: 'Overdue' },
          { id: 'PENALTY', label: 'Penalty' },
          { id: 'DP_OVERDUE', label: 'DP Overdue' },
          { id: 'PAID', label: 'Paid' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id)}
            style={{
              background: statusFilter === filter.id ? 'var(--accent-emerald)' : 'var(--bg-card)',
              color: statusFilter === filter.id ? '#000' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: statusFilter === filter.id ? 'var(--accent-emerald)' : 'var(--border-subtle)',
              borderRadius: 99,
              padding: '4px 12px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Account Cards List */}
      {filteredAccounts.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '36px 18px', borderRadius: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-emerald)',
            marginBottom: 12
          }}>
            <Users size={26} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            {accounts.length === 0 ? 'No Land Accounts Yet' : 'No matching accounts found'}
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 320, margin: '0 auto 16px auto', lineHeight: 1.45 }}>
            {accounts.length === 0
              ? 'Start by creating your first buyer account, or load sample demo data to see how calculations and waterfall schedules work.'
              : 'Try changing your search terms or filters.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)} style={{ padding: '8px 16px' }}>
              <Plus size={15} />
              {accounts.length === 0 ? 'Create First Account' : 'New Account'}
            </button>
            {accounts.length === 0 && (
              <button className="btn btn-secondary btn-sm" onClick={resetSample} style={{ padding: '8px 16px' }}>
                <FileSpreadsheet size={15} color="var(--accent-emerald)" />
                Load Sample Demo Data
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="accounts-list">
          {filteredAccounts.map(account => {
            const isOverdue = account.days_overdue > 0;
            return (
              <div
                key={account.account_id}
                className="account-card"
                onClick={() => setViewingAccountId(account.account_id)}
              >
                <div className="account-card-header">
                  <div className="account-title-group">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ID #{account.account_id}
                    </span>
                    <h3>{account.name}</h3>
                    <div className="account-subtitle">
                      <span>Title: {account.land_title_number || 'N/A'}</span>
                      <span>•</span>
                      <span>{account.land_area_sqm || 0} sqm</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusBadge status={account.status} />
                    <button
                      className="btn btn-danger btn-xs action-icon-btn"
                      style={{ padding: '4px 6px', opacity: 0.85 }}
                      onClick={(e) => handleDeleteAccount(account, e)}
                      title="Delete Customer Account"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
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
                    <span className="value" style={{ color: account.outstanding_balance > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontSize: '0.88rem' }}>
                      {formatCurrency(account.outstanding_balance)}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.74rem',
                  paddingTop: 4
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Calendar size={13} />
                    <span>Next: <strong>{formatDate(account.next_due_date)}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {account.down_payment > 0 && Number(account.total_dp_paid || 0) < Number(account.down_payment) && (
                      <span style={{
                        background: 'rgba(234, 88, 12, 0.15)',
                        color: '#ea580c',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 700,
                        fontSize: '0.68rem'
                      }}>
                        DP Unpaid
                      </span>
                    )}
                    {isOverdue && (
                      <span style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: 'var(--accent-amber)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }}>
                        {account.days_overdue}d overdue
                      </span>
                    )}
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={() => setIsAddModalOpen(true)}
        aria-label="Add New Account"
      >
        <Plus size={24} />
      </button>

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
