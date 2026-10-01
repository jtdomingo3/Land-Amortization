import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { AccountFormModal } from './AccountFormModal.jsx';
import { PaymentFormModal } from './PaymentFormModal.jsx';
import {
  ArrowLeft,
  CalendarRange,
  CreditCard,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
  MapPin,
  Clock
} from 'lucide-react';

export function AccountDetailPage({ accountId, onBack }) {
  const {
    accounts,
    payments,
    updateAccount,
    deleteAccount,
    addPayment,
    setActiveTab,
    setSelectedAccountId
  } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const account = accounts.find(a => String(a.account_id) === String(accountId));

  if (!account) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Account not found</p>
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginTop: 12 }}>
          Back to Accounts
        </button>
      </div>
    );
  }

  const accountPayments = payments.filter(
    p => String(p.account_id) === String(account.account_id)
  );

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete Account #${account.account_id} (${account.name})? All associated payments will also be deleted.`)) {
      await deleteAccount(account.account_id);
      onBack();
    }
  };

  const handleViewSchedule = () => {
    setSelectedAccountId(account.account_id);
    setActiveTab('schedule');
  };

  const progressPercent = account.total_contract_amount > 0
    ? Math.min(100, (account.total_paid / account.total_contract_amount) * 100)
    : 0;

  return (
    <div className="account-detail-page">
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ padding: '6px 10px' }}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit2 size={14} />
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="glass-card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ACCOUNT #{account.account_id}
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {account.name}
            </h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>Title: <strong>{account.land_title_number || 'N/A'}</strong></span>
              <span>•</span>
              <span>Area: <strong>{account.land_area_sqm || 0} sqm</strong></span>
            </div>
          </div>
          <StatusBadge status={account.status} />
        </div>

        {/* Progress Bar */}
        <div style={{ margin: '14px 0 6px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Paid: {formatCurrency(account.total_paid)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald-light)' }}>
              {progressPercent.toFixed(1)}%
            </span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'var(--bg-surface)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))',
              borderRadius: 99
            }} />
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="account-financials">
          <div className="fin-col">
            <span className="label">Total Contract</span>
            <span className="value">{formatCurrency(account.total_contract_amount)}</span>
          </div>
          <div className="fin-col">
            <span className="label">Base Balance</span>
            <span className="value">{formatCurrency(account.base_balance)}</span>
          </div>
          <div className="fin-col full-width">
            <span className="label">Outstanding Due (Incl. Penalties)</span>
            <span className="value" style={{ color: account.outstanding_balance > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontSize: '0.96rem' }}>
              {formatCurrency(account.outstanding_balance)}
            </span>
          </div>
        </div>

        {/* Due Date & Overdue Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card-subtle)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '0.78rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Next Due Date: </span>
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatDate(account.next_due_date)}</strong>
          </div>
          {account.days_overdue > 0 ? (
            <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
              {account.days_overdue} days overdue
            </span>
          ) : (
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Up to date</span>
          )}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => setIsPaymentModalOpen(true)}>
          <CreditCard size={16} />
          Record Payment
        </button>
        <button className="btn btn-secondary" onClick={handleViewSchedule}>
          <CalendarRange size={16} />
          Monthly Schedule
        </button>
      </div>

      {/* Derived Calculation Breakdown (All 13 Computed Fields) */}
      <div className="glass-card" style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: '0.86rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Calculations & Penalties
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '0.8rem' }}>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Down Payment Paid</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2 }}>{formatCurrency(account.down_payment)}</div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Installments Paid</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2 }}>{formatCurrency(account.installments_paid)}</div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Monthly Amortization</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2 }}>{formatCurrency(account.monthly_amortization)}</div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Number of Months</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2 }}>{account.num_of_months || 120} mos</div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>DP Penalty (1%)</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2, color: account.dp_penalty > 0 ? 'var(--accent-rose)' : 'inherit' }}>
              {formatCurrency(account.dp_penalty)}
            </div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Consecutive Missed</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2, color: account.consecutive_missed >= 2 ? 'var(--accent-rose)' : 'inherit' }}>
              {account.consecutive_missed || 0} months
            </div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>10% Missed Penalty</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2, color: account.ten_percent_penalty > 0 ? 'var(--accent-rose)' : 'inherit' }}>
              {formatCurrency(account.ten_percent_penalty)}
            </div>
          </div>
          <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244,63,94,0.2)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: '#fb7185', fontSize: '0.72rem' }}>Total Penalties</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: 2, color: '#fb7185' }}>
              {formatCurrency(account.total_penalties)}
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Details */}
      <div className="glass-card" style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: '0.86rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Contract Information
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Date of Start:</span>
            <span>{formatDate(account.date_of_start)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>First Due Date:</span>
            <span>{formatDate(account.first_due_date)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Agreed DP Due:</span>
            <span>{formatDate(account.agreed_dp_due)}</span>
          </div>
          {account.remarks && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <strong>Remarks: </strong> {account.remarks}
            </div>
          )}
        </div>
      </div>

      {/* Payment History for this account */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Payment History ({accountPayments.length})
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsPaymentModalOpen(true)}>
            + Add
          </button>
        </div>

        {accountPayments.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No payments recorded yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {accountPayments.map(p => (
              <div
                key={p.payment_id}
                style={{
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                    {formatCurrency(p.amount_paid)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatDate(p.payment_date)} • {p.payment_type} • {p.payment_method}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {p.receipt_no || `ID #${p.payment_id}`}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {p.month_covered}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Account Modal */}
      <AccountFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={updateAccount}
        editAccount={account}
        existingAccounts={accounts}
      />

      {/* Add Payment Modal */}
      <PaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={addPayment}
        accounts={accounts}
        defaultAccountId={account.account_id}
      />
    </div>
  );
}
