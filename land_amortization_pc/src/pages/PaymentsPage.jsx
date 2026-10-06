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
  Filter,
  DollarSign,
  FileCheck2
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
    <div className="payments-page desktop-page">
      {/* Desktop Page Action Header */}
      <div className="desktop-toolbar-card glass-card">
        <div className="toolbar-top-row">
          <div className="toolbar-search-group">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by receipt #, buyer name, remarks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              style={{ minWidth: 200, fontSize: '0.82rem' }}
            >
              <option value="ALL">All Buyers ({accounts.length})</option>
              {accounts.map(acc => (
                <option key={acc.account_id} value={acc.account_id}>
                  #{acc.account_id} - {acc.name}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              style={{ minWidth: 150, fontSize: '0.82rem' }}
            >
              <option value="ALL">All Types</option>
              {PAYMENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Prominent Top Desktop Action Button */}
          <div className="toolbar-actions-group">
            <button
              className="btn btn-primary desktop-main-btn"
              onClick={() => setIsAddModalOpen(true)}
              title="Record New Payment"
            >
              <Plus size={16} />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* Financial Summary Strip */}
        <div className="payments-summary-strip">
          <div className="summary-strip-item">
            <span className="summary-strip-label">Transactions</span>
            <span className="summary-strip-val font-mono">{filteredPayments.length} of {payments.length}</span>
          </div>
          <div className="summary-strip-divider"></div>
          <div className="summary-strip-item">
            <span className="summary-strip-label">Total Amount Collected</span>
            <span className="summary-strip-val font-mono text-emerald">{formatCurrency(totalFilteredAmount)}</span>
          </div>
        </div>
      </div>

      {/* Desktop Payments Data Table */}
      {filteredPayments.length === 0 ? (
        <div className="glass-card empty-state-card">
          <div className="empty-icon-box">
            <CreditCard size={32} />
          </div>
          <h4>{payments.length === 0 ? 'No Payment Records Yet' : 'No matching payments found'}</h4>
          <p>
            {payments.length === 0
              ? 'When buyers make down payments or monthly amortizations, record them here to automatically reduce balances and generate printable official receipts.'
              : 'Try selecting All Buyers or clearing search filters.'}
          </p>
          <div className="empty-actions">
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} />
              <span>Record First Payment</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="desktop-table-container glass-card">
          <table className="desktop-table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Receipt #</th>
                <th style={{ width: 110 }}>Date</th>
                <th>Buyer Name</th>
                <th>Account ID</th>
                <th>Payment Type</th>
                <th>Month Covered</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
                <th>Remarks</th>
                <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => {
                const isDP = p.payment_type === 'Down Payment';
                return (
                  <tr key={p.payment_id} className="desktop-table-row">
                    <td className="cell-mono font-bold">
                      <span className="receipt-pill">
                        <Receipt size={12} />
                        {p.receipt_no || `REC-${p.payment_id}`}
                      </span>
                    </td>
                    <td className="cell-date">{formatDate(p.payment_date)}</td>
                    <td className="cell-primary font-bold">{p.name || 'Account #' + p.account_id}</td>
                    <td className="cell-mono cell-muted">#{p.account_id}</td>
                    <td>
                      <span className={`payment-type-badge ${isDP ? 'dp-type' : 'inst-type'}`}>
                        {p.payment_type}
                      </span>
                    </td>
                    <td className="cell-muted" style={{ fontSize: '0.78rem' }}>
                      {p.month_covered ? (
                        <span style={{ color: 'var(--accent-indigo)', fontWeight: 600 }}>{p.month_covered}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="cell-muted">{p.payment_method || 'Cash'}</td>
                    <td className="cell-mono font-bold text-emerald" style={{ textAlign: 'right' }}>
                      <div>{formatCurrency(p.amount_paid)}</div>
                      {Number(p.penalty_amount) > 0 && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--accent-amber)', fontWeight: 'normal' }}>
                          Penalty: {formatCurrency(p.penalty_amount)}
                        </div>
                      )}
                    </td>
                    <td className="cell-muted cell-truncate" style={{ maxWidth: 180 }}>
                      {p.remarks || '—'}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 16 }}>
                      <div className="table-row-actions">
                        <button
                          className="btn btn-secondary btn-xs action-icon-btn"
                          onClick={() => setReceiptModalPayment(p)}
                          title="Generate & Print Official Receipt"
                        >
                          <Printer size={14} />
                          <span>Receipt</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-xs action-icon-btn"
                          onClick={() => setEditingPayment(p)}
                          title="Edit Payment Record"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-xs action-icon-btn"
                          onClick={() => handleDelete(p)}
                          title="Delete Payment"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
