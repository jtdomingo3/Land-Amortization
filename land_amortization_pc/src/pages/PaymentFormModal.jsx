import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../components/Modal.jsx';
import { PAYMENT_TYPES, PAYMENT_METHODS } from '../utils/constants.js';
import { toISODateString, formatNumber, formatDate, formatMonthCovered } from '../utils/formatters.js';

export function PaymentFormModal({
  isOpen,
  onClose,
  onSave,
  editPayment = null,
  accounts = [],
  defaultAccountId = null,
  defaultPaymentType = 'Monthly Amortization',
  defaultAmount = null
}) {
  const [accountId, setAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(toISODateString(new Date()));
  const [paymentType, setPaymentType] = useState('Monthly Amortization');
  const [amountPaid, setAmountPaid] = useState('');
  const [amortizationAmount, setAmortizationAmount] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [forMonthNo, setForMonthNo] = useState('');
  const [monthCovered, setMonthCovered] = useState('');
  const [isCustomMonth, setIsCustomMonth] = useState(false);
  const [receiptNo, setReceiptNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  // Selected account
  const currentAccount = useMemo(() => {
    return accounts.find(a => String(a.account_id) === String(accountId)) || null;
  }, [accounts, accountId]);

  // Schedule for current account
  const schedule = useMemo(() => {
    if (!currentAccount || !Array.isArray(currentAccount.schedule)) return [];
    return currentAccount.schedule;
  }, [currentAccount]);

  // Helper to find earliest unpaid or overdue month in schedule
  const findDefaultMonth = (sched) => {
    if (!sched || sched.length === 0) return null;
    const unpaid = sched.find(s => ['OVERDUE', 'DUE', 'PARTIAL', 'PENALTY', 'UPCOMING'].includes(s.status) && s.status !== 'PAID');
    return unpaid || sched[0];
  };

  useEffect(() => {
    if (editPayment) {
      setAccountId(editPayment.account_id ? String(editPayment.account_id) : '');
      setPaymentDate(editPayment.payment_date || toISODateString(new Date()));
      setPaymentType(editPayment.payment_type || 'Monthly Amortization');
      setAmountPaid(editPayment.amount_paid !== undefined ? String(editPayment.amount_paid) : '');
      setAmortizationAmount(
        editPayment.amortization_amount !== undefined && editPayment.amortization_amount !== null
          ? String(editPayment.amortization_amount)
          : (editPayment.payment_type === 'Penalty' ? '0' : String(editPayment.amount_paid || ''))
      );
      setPenaltyAmount(
        editPayment.penalty_amount !== undefined && editPayment.penalty_amount !== null
          ? String(editPayment.penalty_amount)
          : (editPayment.payment_type === 'Penalty' ? String(editPayment.amount_paid || '') : '0')
      );
      setForMonthNo(editPayment.for_month_no !== null && editPayment.for_month_no !== undefined ? String(editPayment.for_month_no) : '');
      setMonthCovered(editPayment.month_covered || '');
      setIsCustomMonth(Boolean(editPayment.month_covered && !editPayment.for_month_no && editPayment.payment_type !== 'Down Payment'));
      setReceiptNo(editPayment.receipt_no || '');
      setPaymentMethod(editPayment.payment_method || 'Cash');
      setRemarks(editPayment.remarks || '');
    } else {
      const selectedAcc = accounts.find(a => String(a.account_id) === String(defaultAccountId)) || accounts[0];
      const accId = selectedAcc ? String(selectedAcc.account_id) : '';
      setAccountId(accId);

      const pType = defaultPaymentType || 'Monthly Amortization';
      setPaymentType(pType);
      setPaymentDate(toISODateString(new Date()));
      setReceiptNo('');
      setPaymentMethod('Cash');
      setIsCustomMonth(false);

      if (selectedAcc) {
        const sched = selectedAcc.schedule || [];
        const defMonth = findDefaultMonth(sched);

        let mNo = '';
        let mCovered = '';
        if (pType === 'Down Payment') {
          mCovered = 'Down Payment';
        } else if (defMonth) {
          mNo = String(defMonth.month_no);
          mCovered = `Month ${defMonth.month_no} (${formatMonthCovered(defMonth.due_date)})`;
        }
        setForMonthNo(mNo);
        setMonthCovered(mCovered);

        const monthlyAmort = Number(selectedAcc.monthly_amortization) || 0;
        const penBal = Number(selectedAcc.penalties_balance) || 0;
        const defaultPen = penBal > 0 ? penBal : Number((monthlyAmort * 0.1).toFixed(2));

        if (pType === 'Down Payment') {
          const agreedDp = Number(selectedAcc.down_payment) || 0;
          const paidDp = Number(selectedAcc.total_dp_paid) || 0;
          const unpaidDp = Math.max(0, agreedDp - paidDp);
          const initDp = unpaidDp > 0 ? unpaidDp : (agreedDp > 0 ? agreedDp : '');
          setAmountPaid(String(initDp));
          setAmortizationAmount(String(initDp));
          setPenaltyAmount('0');
          setRemarks('Down Payment');
        } else if (pType === 'Penalty') {
          setAmountPaid(String(defaultPen));
          setAmortizationAmount('0');
          setPenaltyAmount(String(defaultPen));
          setRemarks('Penalty Settlement');
        } else if (pType === 'Amortization + Penalty') {
          const total = monthlyAmort + defaultPen;
          setAmortizationAmount(String(monthlyAmort));
          setPenaltyAmount(String(defaultPen));
          setAmountPaid(String(total));
          setRemarks('Monthly Amortization + Penalty');
        } else {
          // Regular Monthly Amortization or Installment
          const initAmount = defaultAmount !== null ? defaultAmount : monthlyAmort;
          setAmountPaid(String(initAmount || ''));
          setAmortizationAmount(String(initAmount || ''));
          setPenaltyAmount('0');
          setRemarks('');
        }
      } else {
        setAmountPaid(defaultAmount !== null ? String(defaultAmount) : '');
        setAmortizationAmount(defaultAmount !== null ? String(defaultAmount) : '');
        setPenaltyAmount('0');
        setForMonthNo('');
        setMonthCovered('');
        setRemarks('');
      }
    }
    setError('');
  }, [editPayment, defaultAccountId, accounts, isOpen, defaultPaymentType, defaultAmount]);

  const handleAccountChange = (newAccId) => {
    setAccountId(newAccId);
    const selectedAcc = accounts.find(a => String(a.account_id) === String(newAccId));
    if (!selectedAcc) return;

    const sched = selectedAcc.schedule || [];
    const defMonth = findDefaultMonth(sched);

    if (paymentType === 'Down Payment') {
      const agreedDp = Number(selectedAcc.down_payment) || 0;
      const paidDp = Number(selectedAcc.total_dp_paid) || 0;
      const unpaidDp = Math.max(0, agreedDp - paidDp);
      const initDp = unpaidDp > 0 ? unpaidDp : (agreedDp > 0 ? agreedDp : '');
      setAmountPaid(String(initDp));
      setAmortizationAmount(String(initDp));
      setPenaltyAmount('0');
      setForMonthNo('');
      setMonthCovered('Down Payment');
    } else {
      let mNo = '';
      let mCovered = '';
      if (defMonth) {
        mNo = String(defMonth.month_no);
        mCovered = `Month ${defMonth.month_no} (${formatMonthCovered(defMonth.due_date)})`;
      }
      setForMonthNo(mNo);
      setMonthCovered(mCovered);
      setIsCustomMonth(false);

      const monthlyAmort = Number(selectedAcc.monthly_amortization) || 0;
      const penBal = Number(selectedAcc.penalties_balance) || 0;
      const defaultPen = penBal > 0 ? penBal : Number((monthlyAmort * 0.1).toFixed(2));

      if (paymentType === 'Penalty') {
        setAmountPaid(String(defaultPen));
        setAmortizationAmount('0');
        setPenaltyAmount(String(defaultPen));
      } else if (paymentType === 'Amortization + Penalty') {
        setAmortizationAmount(String(monthlyAmort));
        setPenaltyAmount(String(defaultPen));
        setAmountPaid(String(monthlyAmort + defaultPen));
      } else {
        setAmountPaid(String(monthlyAmort || ''));
        setAmortizationAmount(String(monthlyAmort || ''));
        setPenaltyAmount('0');
      }
    }
  };

  const handlePaymentTypeChange = (newType) => {
    setPaymentType(newType);
    if (!currentAccount) return;

    const monthlyAmort = Number(currentAccount.monthly_amortization) || 0;
    const penBal = Number(currentAccount.penalties_balance) || 0;
    const defaultPen = penBal > 0 ? penBal : Number((monthlyAmort * 0.1).toFixed(2));

    if (newType === 'Down Payment') {
      const agreedDp = Number(currentAccount.down_payment) || 0;
      const paidDp = Number(currentAccount.total_dp_paid) || 0;
      const unpaidDp = Math.max(0, agreedDp - paidDp);
      const initDp = unpaidDp > 0 ? unpaidDp : (agreedDp > 0 ? agreedDp : '');
      setAmountPaid(String(initDp));
      setAmortizationAmount(String(initDp));
      setPenaltyAmount('0');
      setForMonthNo('');
      setMonthCovered('Down Payment');
      setIsCustomMonth(false);
      if (!remarks) setRemarks('Down Payment');
    } else if (newType === 'Penalty') {
      setAmountPaid(String(defaultPen));
      setAmortizationAmount('0');
      setPenaltyAmount(String(defaultPen));
      if (!remarks || remarks === 'Down Payment') setRemarks('Penalty Payment');
    } else if (newType === 'Amortization + Penalty') {
      setAmortizationAmount(String(monthlyAmort));
      setPenaltyAmount(String(defaultPen));
      setAmountPaid(String(monthlyAmort + defaultPen));
      if (!remarks || remarks === 'Down Payment') setRemarks('Monthly Amortization + Penalty');
    } else {
      // Monthly Amortization or Installment or Other
      setAmountPaid(String(monthlyAmort));
      setAmortizationAmount(String(monthlyAmort));
      setPenaltyAmount('0');
      if (remarks === 'Down Payment' || remarks === 'Penalty Payment') setRemarks('');
    }
  };

  const handleMonthSelect = (val) => {
    if (val === 'CUSTOM') {
      setIsCustomMonth(true);
      setForMonthNo('');
      setMonthCovered('');
    } else if (val === '') {
      setIsCustomMonth(false);
      setForMonthNo('');
      setMonthCovered('');
    } else {
      setIsCustomMonth(false);
      const mNo = Number(val);
      setForMonthNo(String(mNo));
      const sItem = schedule.find(s => s.month_no === mNo);
      if (sItem) {
        setMonthCovered(`Month ${sItem.month_no} (${formatMonthCovered(sItem.due_date)})`);
      } else {
        setMonthCovered(`Month ${mNo}`);
      }
    }
  };

  // Handlers for split amounts
  const handleAmortizationAmountChange = (val) => {
    setAmortizationAmount(val);
    const total = (Number(val) || 0) + (Number(penaltyAmount) || 0);
    setAmountPaid(total > 0 ? String(total) : '');
  };

  const handlePenaltyAmountChange = (val) => {
    setPenaltyAmount(val);
    const total = (Number(amortizationAmount) || 0) + (Number(val) || 0);
    setAmountPaid(total > 0 ? String(total) : '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!accountId) {
      setError('Please select an account');
      return;
    }

    let finalTotal = 0;
    let finalAmort = 0;
    let finalPen = 0;

    if (paymentType === 'Amortization + Penalty') {
      finalAmort = Number(amortizationAmount) || 0;
      finalPen = Number(penaltyAmount) || 0;
      finalTotal = finalAmort + finalPen;
      if (finalTotal <= 0) {
        setError('Combined payment amount must be greater than zero');
        return;
      }
    } else if (paymentType === 'Penalty') {
      finalPen = Number(penaltyAmount || amountPaid) || 0;
      finalTotal = finalPen;
      finalAmort = 0;
      if (finalTotal <= 0) {
        setError('Penalty payment amount must be greater than zero');
        return;
      }
    } else {
      finalTotal = Number(amountPaid) || 0;
      finalAmort = finalTotal;
      finalPen = 0;
      if (finalTotal <= 0) {
        setError('Payment amount must be greater than zero');
        return;
      }
    }

    if (!paymentDate) {
      setError('Payment date is required');
      return;
    }

    const payload = {
      payment_id: editPayment ? editPayment.payment_id : null,
      account_id: accountId,
      payment_date: paymentDate,
      payment_type: paymentType,
      amount_paid: finalTotal,
      amortization_amount: finalAmort,
      penalty_amount: finalPen,
      for_month_no: forMonthNo ? Number(forMonthNo) : null,
      month_covered: monthCovered || (forMonthNo ? `Month ${forMonthNo}` : null),
      receipt_no: receiptNo.trim() || null,
      payment_method: paymentMethod || 'Cash',
      remarks: remarks.trim() || null
    };

    onSave(payload);
    onClose();
  };

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

        {/* Account Selector */}
        <div className="form-group">
          <label className="form-label">Buyer / Account *</label>
          <select
            className="form-select"
            value={accountId}
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

        {/* Account Status Card & Penalty Banner */}
        {currentAccount && (
          <div style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 14,
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Balance: <strong style={{ color: 'var(--text-primary)' }}>₱{Number(currentAccount.outstanding_balance).toLocaleString()}</strong></span>
              <span>Next Due: <strong style={{ color: 'var(--text-primary)' }}>{currentAccount.next_due_date || 'N/A'}</strong></span>
            </div>

            {Number(currentAccount.penalties_balance) > 0 && (
              <div style={{
                marginTop: 4,
                padding: '6px 10px',
                borderRadius: 6,
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 600
              }}>
                <span>⚠️ Unpaid Penalty Balance:</span>
                <span className="mono">₱{formatNumber(currentAccount.penalties_balance, 2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Date and Payment Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label className="form-label">Payment Date *</label>
            <input
              type="date"
              className="form-input"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Type *</label>
            <select
              className="form-select"
              value={paymentType}
              onChange={e => handlePaymentTypeChange(e.target.value)}
            >
              {PAYMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* For the month of..... Selector */}
        {paymentType !== 'Down Payment' ? (
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>For the month of..... *</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Select schedule month
              </span>
            </label>
            <select
              className="form-select"
              value={isCustomMonth ? 'CUSTOM' : (forMonthNo || '')}
              onChange={e => handleMonthSelect(e.target.value)}
            >
              <option value="">-- General / Not Month-Specific --</option>
              {schedule.map(s => {
                const isOverdue = s.status === 'OVERDUE' || s.status === 'PENALTY';
                const statusTag = isOverdue ? ' [OVERDUE]' : s.status === 'PAID' ? ' [PAID]' : s.status === 'PARTIAL' ? ' [PARTIAL]' : '';
                return (
                  <option key={s.month_no} value={s.month_no}>
                    Month {s.month_no} — {formatMonthCovered(s.due_date)} (Due: {formatDate(s.due_date)}){statusTag}
                  </option>
                );
              })}
              <option value="CUSTOM">Custom Month / Description...</option>
            </select>

            {isCustomMonth && (
              <input
                type="text"
                className="form-input"
                style={{ marginTop: 8 }}
                placeholder="e.g. October 2026 or Month 1 - 2"
                value={monthCovered}
                onChange={e => setMonthCovered(e.target.value)}
                autoFocus
              />
            )}
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">For the month of</label>
            <input
              type="text"
              className="form-input"
              value="Down Payment"
              disabled
              style={{ background: 'var(--bg-input-disabled, rgba(255,255,255,0.05))' }}
            />
          </div>
        )}

        {/* Down payment info banner */}
        {paymentType === 'Down Payment' && (
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
            ℹ️ <strong>Down Payment:</strong> Credited to principal and automatically recomputes and reduces the monthly amortization for this account.
          </div>
        )}

        {/* Amount Section: Split inputs for Amortization + Penalty */}
        {paymentType === 'Amortization + Penalty' ? (
          <div style={{
            background: 'rgba(99, 102, 241, 0.06)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 8,
            padding: '12px',
            marginBottom: 14
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: 8 }}>
              Split Payment Breakdown
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Monthly Amortization (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input mono"
                  placeholder="0.00"
                  value={amortizationAmount}
                  onChange={e => handleAmortizationAmountChange(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Penalty Portion (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input mono"
                  placeholder="0.00"
                  value={penaltyAmount}
                  onChange={e => handlePenaltyAmountChange(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px dashed rgba(99, 102, 241, 0.25)',
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              <span>Total Payment Amount:</span>
              <span className="mono" style={{ color: 'var(--accent-indigo)', fontSize: '1rem' }}>
                ₱{formatNumber(Number(amountPaid) || 0, 2)}
              </span>
            </div>
          </div>
        ) : paymentType === 'Penalty' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Penalty Amount to Settle (₱) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input mono"
                placeholder="0.00"
                value={penaltyAmount || amountPaid}
                onChange={e => {
                  setPenaltyAmount(e.target.value);
                  setAmountPaid(e.target.value);
                }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Receipt / OR #</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. OR-1002"
                value={receiptNo}
                onChange={e => setReceiptNo(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Amount Paid (₱) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input mono"
                placeholder="0.00"
                value={amountPaid}
                onChange={e => {
                  setAmountPaid(e.target.value);
                  setAmortizationAmount(e.target.value);
                }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Receipt / OR #</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. OR-1002"
                value={receiptNo}
                onChange={e => setReceiptNo(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* If Amortization + Penalty, put Receipt in a separate row */}
        {paymentType === 'Amortization + Penalty' && (
          <div className="form-group">
            <label className="form-label">Receipt / OR #</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. OR-1002"
              value={receiptNo}
              onChange={e => setReceiptNo(e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Payment Method</label>
          <select
            className="form-select"
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
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
            placeholder="Reference notes, check no., month details..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
