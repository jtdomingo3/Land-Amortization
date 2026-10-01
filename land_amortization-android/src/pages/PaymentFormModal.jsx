import React, { useState, useEffect } from 'react';
import { Modal } from '../components/Modal.jsx';
import { PAYMENT_TYPES, PAYMENT_METHODS } from '../utils/constants.js';
import { toISODateString } from '../utils/formatters.js';

export function PaymentFormModal({
  isOpen,
  onClose,
  onSave,
  editPayment = null,
  accounts = [],
  defaultAccountId = null,
  defaultPaymentType = 'Installment',
  defaultAmount = null
}) {
  const [formData, setFormData] = useState({
    payment_id: null,
    account_id: defaultAccountId || '',
    payment_date: toISODateString(new Date()),
    payment_type: defaultPaymentType || 'Installment',
    amount_paid: defaultAmount || '',
    receipt_no: '',
    payment_method: 'Cash',
    remarks: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (editPayment) {
      setFormData({
        payment_id: editPayment.payment_id,
        account_id: editPayment.account_id || '',
        payment_date: editPayment.payment_date || toISODateString(new Date()),
        payment_type: editPayment.payment_type || 'Installment',
        amount_paid: editPayment.amount_paid || '',
        receipt_no: editPayment.receipt_no || '',
        payment_method: editPayment.payment_method || 'Cash',
        remarks: editPayment.remarks || ''
      });
    } else {
      const selectedAcc = accounts.find(a => String(a.account_id) === String(defaultAccountId)) || accounts[0];
      const pType = defaultPaymentType || 'Installment';
      let initAmount = defaultAmount !== null ? defaultAmount : '';

      if (!initAmount && selectedAcc) {
        if (pType === 'Down Payment') {
          const agreedDp = Number(selectedAcc.down_payment) || 0;
          const paidDp = Number(selectedAcc.total_dp_paid) || 0;
          const unpaidDp = Math.max(0, agreedDp - paidDp);
          initAmount = unpaidDp > 0 ? unpaidDp : (agreedDp > 0 ? agreedDp : '');
        } else {
          initAmount = selectedAcc.monthly_amortization || '';
        }
      }

      setFormData({
        payment_id: null,
        account_id: selectedAcc ? selectedAcc.account_id : '',
        payment_date: toISODateString(new Date()),
        payment_type: pType,
        amount_paid: initAmount,
        receipt_no: '',
        payment_method: 'Cash',
        remarks: pType === 'Down Payment' ? 'Down Payment' : ''
      });
    }
    setError('');
  }, [editPayment, defaultAccountId, accounts, isOpen, defaultPaymentType, defaultAmount]);

  const handleAccountChange = (accId) => {
    const selectedAcc = accounts.find(a => String(a.account_id) === String(accId));
    let newAmount = formData.amount_paid;
    if (selectedAcc) {
      if (formData.payment_type === 'Down Payment') {
        const agreedDp = Number(selectedAcc.down_payment) || 0;
        const paidDp = Number(selectedAcc.total_dp_paid) || 0;
        const unpaidDp = Math.max(0, agreedDp - paidDp);
        newAmount = unpaidDp > 0 ? unpaidDp : (agreedDp > 0 ? agreedDp : '');
      } else if (!formData.amount_paid || formData.payment_type === 'Installment') {
        newAmount = selectedAcc.monthly_amortization || '';
      }
    }
    setFormData(prev => ({
      ...prev,
      account_id: accId,
      amount_paid: newAmount
    }));
  };

  const handlePaymentTypeChange = (newType) => {
    const selectedAcc = accounts.find(a => String(a.account_id) === String(formData.account_id));
    let suggestedAmount = formData.amount_paid;

    if (newType === 'Down Payment') {
      if (selectedAcc) {
        const agreedDp = Number(selectedAcc.down_payment) || 0;
        const paidDp = Number(selectedAcc.total_dp_paid) || 0;
        const unpaidDp = Math.max(0, agreedDp - paidDp);
        suggestedAmount = unpaidDp > 0 ? unpaidDp : (agreedDp > 0 ? agreedDp : '');
      }
    } else if (newType === 'Installment') {
      if (selectedAcc) {
        suggestedAmount = selectedAcc.monthly_amortization || '';
      }
    }

    setFormData(prev => ({
      ...prev,
      payment_type: newType,
      amount_paid: suggestedAmount,
      remarks: newType === 'Down Payment' && !prev.remarks ? 'Down Payment' : prev.remarks
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.account_id) {
      setError('Please select an account');
      return;
    }
    if (!formData.amount_paid || Number(formData.amount_paid) <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }
    if (!formData.payment_date) {
      setError('Payment date is required');
      return;
    }

    onSave(formData);
    onClose();
  };

  const currentAccount = accounts.find(a => String(a.account_id) === String(formData.account_id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editPayment ? `Edit Payment #${editPayment.payment_id}` : 'Record New Payment'}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            {editPayment ? 'Update Payment' : 'Record Payment'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 14,
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Buyer / Account *</label>
          <select
            className="form-select"
            value={formData.account_id}
            onChange={e => handleAccountChange(e.target.value)}
            required
          >
            <option value="">Select Account</option>
            {accounts.map(acc => (
              <option key={acc.account_id} value={acc.account_id}>
                #{acc.account_id} — {acc.name} (Monthly: ₱{Number(acc.monthly_amortization).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {currentAccount && (
          <div style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 14,
            fontSize: '0.78rem',
            display: 'flex',
            justifyContent: 'space-between',
            color: 'var(--text-secondary)'
          }}>
            <span>Balance: <strong>₱{Number(currentAccount.outstanding_balance).toLocaleString()}</strong></span>
            <span>Next Due: <strong>{currentAccount.next_due_date || 'N/A'}</strong></span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">Payment Date *</label>
            <input
              type="date"
              className="form-input"
              value={formData.payment_date}
              onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Type *</label>
            <select
              className="form-select"
              value={formData.payment_type}
              onChange={e => handlePaymentTypeChange(e.target.value)}
            >
              {PAYMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {formData.payment_type === 'Down Payment' && (
          <div style={{
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 14,
            fontSize: '0.74rem',
            color: 'var(--accent-cyan)',
            lineHeight: 1.45
          }}>
            ℹ️ <strong>Down Payment:</strong> Recording this payment will be credited to the principal and will automatically recompute and reduce the monthly amortization for this account.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">Amount Paid (₱) *</label>
            <input
              type="number"
              step="0.01"
              className="form-input mono"
              placeholder="0.00"
              value={formData.amount_paid}
              onChange={e => setFormData({ ...formData, amount_paid: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Receipt / OR #</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. OR-1002"
              value={formData.receipt_no}
              onChange={e => setFormData({ ...formData, receipt_no: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Payment Method</label>
          <select
            className="form-select"
            value={formData.payment_method}
            onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
          >
            {PAYMENT_METHODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Remarks</label>
          <textarea
            className="form-textarea"
            rows="2"
            placeholder="Reference notes, bank ref, check no..."
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}
