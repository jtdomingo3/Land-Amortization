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
  Calendar
} from 'lucide-react';

export function AccountsPage() {
  const { accounts, addAccount } = useApp();
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
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Users size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px auto' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            No accounts found
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            {searchQuery ? 'Try changing your search or filters' : 'Start by creating your first buyer account'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={14} />
            Create Account
          </button>
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
                  <StatusBadge status={account.status} />
                </div>

                <div className="account-financials">
                  <div className="fin-col">
                    <span className="label">Contract</span>
                    <span className="value">{formatCurrency(account.total_contract_amount)}</span>
                  </div>
                  <div className="fin-col">
                    <span className="label">Paid</span>
                    <span className="value" style={{ color: 'var(--accent-emerald-light)' }}>
                      {formatCurrency(account.total_paid)}
                    </span>
                  </div>
                  <div className="fin-col">
                    <span className="label">Balance Due</span>
                    <span className="value" style={{ color: account.outstanding_balance > 0 ? 'var(--accent-rose)' : 'inherit' }}>
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
