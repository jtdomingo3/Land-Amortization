import React, { useState, useEffect } from 'react';
import { Modal } from '../components/Modal.jsx';
import { addMonthsEdate } from '../utils/dateUtils.js';
import { toISODateString } from '../utils/formatters.js';

export function AccountFormModal({ isOpen, onClose, onSave, editAccount = null, existingAccounts = [] }) {
  const [formData, setFormData] = useState({
    account_id: '',
    name: '',
    date_of_start: toISODateString(new Date()),
    first_due_date: addMonthsEdate(toISODateString(new Date()), 1),
    land_title_number: '',
    land_area_sqm: '',
    total_contract_amount: '',
    down_payment: '0',
    agreed_dp_due: toISODateString(new Date()),
    monthly_amortization: '',
    num_of_months: '120',
    remarks: '',
    is_dp_paid: false
  });

  const [error, setError] = useState('');

  // Populate data when editing or opening
  useEffect(() => {
    if (editAccount) {
      setFormData({
        account_id: editAccount.account_id || '',
        name: editAccount.name || '',
        date_of_start: editAccount.date_of_start || toISODateString(new Date()),
        first_due_date: editAccount.first_due_date || '',
        land_title_number: editAccount.land_title_number || '',
        land_area_sqm: editAccount.land_area_sqm || '',
        total_contract_amount: editAccount.total_contract_amount || '',
        down_payment: editAccount.down_payment ?? 0,
        agreed_dp_due: editAccount.agreed_dp_due || '',
        monthly_amortization: editAccount.monthly_amortization || '',
        num_of_months: editAccount.num_of_months || 120,
        remarks: editAccount.remarks || '',
        is_dp_paid: Boolean(editAccount.is_dp_paid)
      });
    } else {
      // Suggest next Account ID
      const maxId = existingAccounts.length > 0 
        ? Math.max(...existingAccounts.map(a => Number(a.account_id) || 1000))
        : 1000;
      setFormData({
        account_id: maxId + 1,
        name: '',
        date_of_start: toISODateString(new Date()),
        first_due_date: addMonthsEdate(toISODateString(new Date()), 1),
        land_title_number: '',
        land_area_sqm: '',
        total_contract_amount: '',
        down_payment: '0',
        agreed_dp_due: toISODateString(new Date()),
        monthly_amortization: '',
        num_of_months: '120',
        remarks: '',
        is_dp_paid: false
      });
    }
    setError('');
  }, [editAccount, existingAccounts, isOpen]);

  // Calculate monthly amortization based on contract, down payment, months, and DP status
  const calculateAmortization = (contractVal, dpVal, monthsVal, isDpPaidVal) => {
    const contract = Number(contractVal) || 0;
    const dp = Number(dpVal) || 0;
    const months = Number(monthsVal) || 120;
    if (contract <= 0 || months <= 0) return '';
    // If DP is paid: amortize contract minus DP
    // If DP is NOT paid: amortize full contract
    const balance = isDpPaidVal ? Math.max(0, contract - dp) : contract;
    return (balance / months).toFixed(2);
  };

  const handleFieldChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const contract = field === 'total_contract_amount' ? val : updated.total_contract_amount;
    const dp = field === 'down_payment' ? val : updated.down_payment;
    const months = field === 'num_of_months' ? val : updated.num_of_months;
    const isPaid = field === 'is_dp_paid' ? val : updated.is_dp_paid;

    if (field === 'total_contract_amount' || field === 'down_payment' || field === 'num_of_months' || field === 'is_dp_paid') {
      const calc = calculateAmortization(contract, dp, months, isPaid);
      if (calc) {
        updated.monthly_amortization = calc;
      }
    }
    setFormData(updated);
  };

  const handleStartDateChange = (val) => {
    setFormData(prev => ({
      ...prev,
      date_of_start: val,
      first_due_date: addMonthsEdate(val, 1)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.account_id) {
      setError('Account ID is required');
      return;
    }
    if (!formData.name.trim()) {
      setError('Buyer name is required');
      return;
    }
    if (!formData.total_contract_amount || Number(formData.total_contract_amount) <= 0) {
      setError('Total contract amount must be greater than zero');
      return;
    }
    if (!formData.monthly_amortization || Number(formData.monthly_amortization) <= 0) {
      setError('Monthly amortization must be greater than zero');
      return;
    }
    if (!formData.num_of_months || Number(formData.num_of_months) <= 0) {
      setError('Number of months must be greater than zero');
      return;
    }

    onSave({
      ...formData,
      num_of_months: Number(formData.num_of_months) || 120,
      total_contract_amount: Number(formData.total_contract_amount) || 0,
      down_payment: Number(formData.down_payment) || 0,
      monthly_amortization: Number(formData.monthly_amortization) || 0,
      land_area_sqm: Number(formData.land_area_sqm) || 0,
      is_dp_paid: formData.is_dp_paid ? 1 : 0
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editAccount ? `Edit Account #${editAccount.account_id}` : 'Create New Land Account'}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            {editAccount ? 'Save Changes' : 'Create Account'}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">Account ID *</label>
            <input
              type="number"
              className="form-input mono"
              value={formData.account_id}
              onChange={e => setFormData({ ...formData, account_id: e.target.value })}
              disabled={Boolean(editAccount)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Buyer Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              placeholder="e.g. Maria Santos"
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">Date of Start</label>
            <input
              type="date"
              className="form-input"
              value={formData.date_of_start}
              onChange={e => handleStartDateChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">First Due Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.first_due_date}
              onChange={e => setFormData({ ...formData, first_due_date: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">Land Title Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. TCT-12345"
              value={formData.land_title_number}
              onChange={e => setFormData({ ...formData, land_title_number: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Area (sqm)</label>
            <input
              type="number"
              className="form-input mono"
              placeholder="500"
              value={formData.land_area_sqm}
              onChange={e => setFormData({ ...formData, land_area_sqm: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">Contract Amount (₱) *</label>
            <input
              type="number"
              step="0.01"
              className="form-input mono"
              placeholder="1500000"
              value={formData.total_contract_amount}
              onChange={e => handleFieldChange('total_contract_amount', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Down Payment (₱)</label>
            <input
              type="number"
              step="0.01"
              className="form-input mono"
              placeholder="50000"
              value={formData.down_payment}
              onChange={e => handleFieldChange('down_payment', e.target.value)}
            />
          </div>
        </div>

        {/* Down Payment Status Selection (Paid vs Not Paid) */}
        {Number(formData.down_payment) > 0 && (
          <div style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Down Payment Status
              </label>
              <div style={{
                display: 'inline-flex',
                background: 'var(--bg-surface)',
                padding: 2,
                borderRadius: 8,
                border: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => handleFieldChange('is_dp_paid', true)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: formData.is_dp_paid ? 'var(--accent-emerald)' : 'transparent',
                    color: formData.is_dp_paid ? '#000' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ✓ Paid
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange('is_dp_paid', false)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: !formData.is_dp_paid ? 'var(--accent-amber)' : 'transparent',
                    color: !formData.is_dp_paid ? '#000' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ✕ Not Paid
                </button>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: formData.is_dp_paid ? 'var(--accent-emerald-light)' : 'var(--text-muted)', lineHeight: 1.4 }}>
              {formData.is_dp_paid ? (
                <span>
                  ✓ <strong>Paid Upfront:</strong> Monthly amortization recomputed on balance (₱{Math.max(0, Number(formData.total_contract_amount || 0) - Number(formData.down_payment || 0)).toLocaleString()}) ÷ {formData.num_of_months || 120} mos = <strong>₱{formData.monthly_amortization || '0.00'}</strong>
                </span>
              ) : (
                <span>
                  ⏳ <strong>Not Paid:</strong> Monthly amortization computed on full contract (₱{Number(formData.total_contract_amount || 0).toLocaleString()}) ÷ {formData.num_of_months || 120} mos = <strong>₱{formData.monthly_amortization || '0.00'}</strong>. (Will reduce to ₱{((Math.max(0, Number(formData.total_contract_amount || 0) - Number(formData.down_payment || 0))) / (Number(formData.num_of_months) || 120)).toFixed(2)} when DP is paid).
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">Agreed DP Due</label>
            <input
              type="date"
              className="form-input"
              value={formData.agreed_dp_due}
              onChange={e => setFormData({ ...formData, agreed_dp_due: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Monthly (₱) *</label>
            <input
              type="number"
              step="0.01"
              className="form-input mono"
              placeholder="12083.33"
              value={formData.monthly_amortization}
              onChange={e => setFormData({ ...formData, monthly_amortization: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Term (Months) *</label>
            <input
              type="number"
              className="form-input mono"
              placeholder="120"
              value={formData.num_of_months}
              onChange={e => handleFieldChange('num_of_months', e.target.value)}
              required
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
              120 (10 yrs) / 180 (15 yrs)
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Remarks</label>
          <textarea
            className="form-textarea"
            rows="2"
            placeholder="Lot number, phase, or buyer notes..."
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}
