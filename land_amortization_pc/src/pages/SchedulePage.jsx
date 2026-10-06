import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { AccountFormModal } from './AccountFormModal.jsx';
import {
  CalendarRange,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  Edit2
} from 'lucide-react';

export function SchedulePage() {
  const { accounts, selectedAccountId, setSelectedAccountId, updateAccount } = useApp();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(24); // Show 24 months at a time for fast rendering
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Find currently selected account
  const currentAccount = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;
    if (selectedAccountId) {
      const found = accounts.find(a => String(a.account_id) === String(selectedAccountId));
      if (found) return found;
    }
    return accounts[0];
  }, [accounts, selectedAccountId]);

  const schedule = currentAccount?.schedule || [];

  // Filter schedule
  const filteredSchedule = useMemo(() => {
    if (statusFilter === 'ALL') return schedule;
    return schedule.filter(row => row.payment_status === statusFilter);
  }, [schedule, statusFilter]);

  const visibleRows = filteredSchedule.slice(0, visibleCount);

  if (!currentAccount) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <CalendarRange size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px auto' }} />
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          No accounts found
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Please add a Land Account first to view its monthly schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      {/* Account Selector Dropdown */}
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">Select Account / Buyer</label>
        <select
          className="form-select"
          value={currentAccount.account_id}
          onChange={e => {
            setSelectedAccountId(e.target.value);
            setVisibleCount(24);
          }}
        >
          {accounts.map(acc => (
            <option key={acc.account_id} value={acc.account_id}>
              #{acc.account_id} — {acc.name} ({acc.status})
            </option>
          ))}
        </select>
      </div>

      {/* Account Summary Banner */}
      <div className="glass-card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              MONTHLY WATERFALL SCHEDULE
            </span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentAccount.name}
            </h3>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Monthly Due: <strong>{formatCurrency(currentAccount.monthly_amortization)}</strong> • Term: {currentAccount.num_of_months || 120} months
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <StatusBadge status={currentAccount.status} />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditModalOpen(true)}
              style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Edit2 size={12} />
              Edit Term
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          background: 'var(--bg-card-subtle)',
          borderRadius: 8,
          padding: '8px 12px',
          marginTop: 10,
          fontSize: '0.78rem'
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Amortization Paid</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald-light)' }}>
              {formatCurrency(currentAccount.installments_paid)}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Consecutive Missed</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: currentAccount.consecutive_missed >= 2 ? 'var(--accent-rose)' : 'inherit'
            }}>
              {currentAccount.consecutive_missed || 0} mos
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Next Due Date</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {formatDate(currentAccount.next_due_date)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="status-filter-row" style={{ marginBottom: 16 }}>
        {[
          { id: 'ALL', label: `All (${schedule.length})` },
          { id: 'PAID', label: 'Paid' },
          { id: 'PARTIAL', label: 'Partial' },
          { id: 'OVERDUE', label: 'Overdue' },
          { id: 'DUE', label: 'Due' }
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

      {/* Waterfall Schedule Table */}
      <div className="schedule-table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Due Date</th>
              <th>Expected</th>
              <th>Applied</th>
              <th>Advance Rem.</th>
              <th>Status</th>
              <th>Missed</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  No schedule rows match this filter.
                </td>
              </tr>
            ) : (
              visibleRows.map(row => {
                const isPaid = row.payment_status === 'PAID';
                const isOverdue = row.payment_status === 'OVERDUE';
                const isPartial = row.payment_status === 'PARTIAL';

                return (
                  <tr
                    key={row.month_no}
                    style={{
                      background: isOverdue ? 'rgba(244, 63, 94, 0.04)' : (isPaid ? 'rgba(16, 185, 129, 0.02)' : 'transparent')
                    }}
                  >
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      M{row.month_no}
                    </td>
                    <td>{formatDate(row.due_date)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(row.expected_amortization)}
                    </td>
                    <td style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: isPaid ? 'var(--accent-emerald-light)' : (isPartial ? 'var(--accent-amber)' : 'inherit')
                    }}>
                      {formatCurrency(row.amount_applied)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: row.advance_remaining > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {formatCurrency(row.advance_remaining)}
                    </td>
                    <td>
                      <StatusBadge status={row.payment_status} />
                    </td>
                    <td style={{
                      fontFamily: 'var(--font-mono)',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: row.consecutive_missed >= 2 ? 'var(--accent-rose)' : (row.consecutive_missed > 0 ? 'var(--accent-amber)' : 'var(--text-muted)')
                    }}>
                      {row.consecutive_missed}
                    </td>
                    <td style={{ fontSize: '0.72rem', color: row.remarks ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {row.remarks || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Load More Button */}
      {visibleRows.length < filteredSchedule.length && (
        <button
          className="btn btn-secondary btn-block"
          style={{ marginTop: 12 }}
          onClick={() => setVisibleCount(prev => prev + 24)}
        >
          <ChevronDown size={16} />
          Load Next 24 Months ({visibleRows.length} of {filteredSchedule.length})
        </button>
      )}

      {/* Edit Account / Term Modal */}
      {currentAccount && (
        <AccountFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={updateAccount}
          editAccount={currentAccount}
          existingAccounts={accounts}
        />
      )}
    </div>
  );
}
