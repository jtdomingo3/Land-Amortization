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
    remarks: ''
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
        remarks: editAccount.remarks || ''
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
        remarks: ''
      });
    }
    setError('');
  }, [editAccount, existingAccounts, isOpen]);

  // Auto-calculate suggested monthly amortization when contract amount or months change
  const handleContractOrMonthsChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const contract = Number(field === 'total_contract_amount' ? val : updated.total_contract_amount) || 0;
    const dp = Number(field === 'down_payment' ? val : updated.down_payment) || 0;
    const months = Number(field === 'num_of_months' ? val : updated.num_of_months) || 120;

    if (contract > 0 && months > 0 && (!updated.monthly_amortization || field === 'total_contract_amount' || field === 'down_payment' || field === 'num_of_months')) {
      const balance = Math.max(0, contract - dp);
      updated.monthly_amortization = (balance / months).toFixed(2);
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
      land_area_sqm: Number(formData.land_area_sqm) || 0
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
              onChange={e => handleContractOrMonthsChange('total_contract_amount', e.target.value)}
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
              onChange={e => handleContractOrMonthsChange('down_payment', e.target.value)}
            />
          </div>
        </div>

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
              onChange={e => handleContractOrMonthsChange('num_of_months', e.target.value)}
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
