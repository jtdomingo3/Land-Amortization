import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { PAYMENT_TYPES } from '../utils/constants.js';
import { PaymentFormModal } from './PaymentFormModal.jsx';
import { ReceiptPreviewModal } from '../components/ReceiptPreviewModal.jsx';
import {
  Search,
  Plus,
  CreditCard,
  Edit2,
  Trash2,
  Calendar,
  Receipt,
  Printer,
  Filter
} from 'lucide-react';

export function PaymentsPage() {
  const {
    accounts,
    payments,
    addPayment,
    updatePayment,
    deletePayment,
    showConfirm,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [receiptModalPayment, setReceiptModalPayment] = useState(null);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Account filter
      if (selectedAccountId !== 'ALL' && String(p.account_id) !== String(selectedAccountId)) {
        return false;
      }
      // Type filter
      if (selectedType !== 'ALL' && p.payment_type !== selectedType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchReceipt = (p.receipt_no || '').toLowerCase().includes(q);
        const matchRemarks = (p.remarks || '').toLowerCase().includes(q);
        const matchId = String(p.payment_id).includes(q) || String(p.account_id).includes(q);
        if (!matchName && !matchReceipt && !matchRemarks && !matchId) return false;
      }
      return true;
    });
  }, [payments, selectedAccountId, selectedType, searchQuery]);

  const totalFilteredAmount = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
  }, [filteredPayments]);

  const handleDelete = async (payment) => {
    const confirmed = await showConfirm({
      title: 'Delete Payment Record?',
      message: `Are you sure you want to delete payment of ${formatCurrency(payment.amount_paid)} for ${payment.name}?`,
      details: 'This will remove the payment from both local SQLite and cloud ledger, and recalculate customer balances.',
      confirmText: 'Delete Payment',
      cancelText: 'Keep Payment',
      type: 'danger'
    });
    if (confirmed) {
      await deletePayment(payment.payment_id);
      showToast(`Payment of ${formatCurrency(payment.amount_paid)} deleted`, 'success');
    }
  };

  return (
    <div className="payments-page">
      {/* Search and Filters */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by receipt #, buyer, remarks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10, marginBottom: 14 }}>
        <select
          className="form-select"
          value={selectedAccountId}
          onChange={e => setSelectedAccountId(e.target.value)}
        >
          <option value="ALL">All Buyers ({accounts.length})</option>
          {accounts.map(acc => (
            <option key={acc.account_id} value={acc.account_id}>
              #{acc.account_id} {acc.name}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
        >
          <option value="ALL">All Types</option>
          {PAYMENT_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Summary Strip */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '10px 14px',
        marginBottom: 14,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--card-shadow)'
      }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredPayments.length}</strong> payments
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>
          Total: {formatCurrency(totalFilteredAmount)}
        </span>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <CreditCard size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px auto' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            No payments found
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Record amortization or down payment collections
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={14} />
            Record Payment
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredPayments.map(p => (
            <div
              key={p.payment_id}
              className="glass-card"
              style={{ padding: '12px 14px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      #{p.account_id}
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {p.name}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Month Covered: <span style={{ color: 'var(--accent-cyan)' }}>{p.month_covered || 'N/A'}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent-emerald-light)' }}>
                    {formatCurrency(p.amount_paid)}
                  </div>
                  {Number(p.penalty_amount) > 0 && (
                    <div style={{ fontSize: '0.66rem', color: 'var(--accent-amber)', marginTop: 1 }}>
                      Penalty: {formatCurrency(p.penalty_amount)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                    <span style={{
                      background: 'var(--bg-surface)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.68rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {p.payment_type}
                    </span>
                    <span style={{
                      background: 'rgba(16,185,129,0.1)',
                      color: 'var(--accent-emerald-light)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.68rem'
                    }}>
                      {p.payment_method}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                paddingTop: 8,
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.74rem',
                color: 'var(--text-muted)'
              }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <span>{formatDate(p.payment_date)}</span>
                  {p.receipt_no && <span>• OR: <strong style={{ color: 'var(--text-primary)' }}>{p.receipt_no}</strong></span>}
                  {p.month_covered && (
                    <span style={{ color: 'var(--accent-indigo)', fontWeight: 600 }}>
                      • For: {p.month_covered}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => setReceiptModalPayment(p)}
                    title="Print / Share Receipt"
                  >
                    <Printer size={12} color="var(--accent-emerald)" />
                    <span>Receipt</span>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    onClick={() => setEditingPayment(p)}
                    title="Edit Payment"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              </div>

              {p.remarks && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
                  "{p.remarks}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={() => setIsAddModalOpen(true)}
        aria-label="Record New Payment"
      >
        <Plus size={24} />
      </button>

      {/* Add Payment Modal */}
      <PaymentFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={addPayment}
        accounts={accounts}
        defaultAccountId={selectedAccountId !== 'ALL' ? selectedAccountId : null}
      />

      {/* Edit Payment Modal */}
      {editingPayment && (
        <PaymentFormModal
          isOpen={Boolean(editingPayment)}
          onClose={() => setEditingPayment(null)}
          onSave={updatePayment}
          editPayment={editingPayment}
          accounts={accounts}
        />
      )}

      {/* Receipt Preview & Share Modal */}
      {receiptModalPayment && (
        <ReceiptPreviewModal
          isOpen={Boolean(receiptModalPayment)}
          onClose={() => setReceiptModalPayment(null)}
          payment={receiptModalPayment}
          account={accounts.find(a => String(a.account_id) === String(receiptModalPayment.account_id))}
          allPayments={payments}
        />
      )}
    </div>
  );
}
