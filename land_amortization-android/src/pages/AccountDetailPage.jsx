import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { AccountFormModal } from './AccountFormModal.jsx';
import { PaymentFormModal } from './PaymentFormModal.jsx';
import { ReceiptPreviewModal } from '../components/ReceiptPreviewModal.jsx';
import { SOAModal } from '../components/SOAModal.jsx';
import {
  ArrowLeft,
  CalendarRange,
  CreditCard,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Printer,
  MapPin,
  Clock,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

export function AccountDetailPage({ accountId, onBack }) {
  const {
    accounts,
    payments,
    rawPenalties = [],
    updateAccount,
    deleteAccount,
    addPayment,
    updatePayment,
    deletePayment,
    waivePenalty,
    setActiveTab,
    setSelectedAccountId,
    showConfirm,
    showAlert,
    showToast
  } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentModalConfig, setPaymentModalConfig] = useState({
    isOpen: false,
    defaultPaymentType: 'Monthly Amortization',
    defaultAmount: null
  });
  const [isSOAModalOpen, setIsSOAModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

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

  const unpaidDp = Math.max(0, (Number(account.down_payment) || 0) - (Number(account.total_dp_paid) || 0));

  const openPaymentModal = (type = 'Monthly Amortization', amount = null) => {
    setPaymentModalConfig({
      isOpen: true,
      defaultPaymentType: type,
      defaultAmount: amount
    });
  };

  const accountPayments = payments.filter(
    p => String(p.account_id) === String(account.account_id)
  );

  const accountPenalties = rawPenalties.filter(
    p => String(p.account_id) === String(account.account_id)
  );

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm({
      title: `Delete Account #${account.account_id}?`,
      message: `Are you sure you want to permanently delete ${account.name}'s account?`,
      details: 'This will remove all associated payments, ledger history, and cloud database records. This action cannot be undone.',
      confirmText: 'Delete Account',
      cancelText: 'Keep Account',
      type: 'danger'
    });
    if (confirmed) {
      await deleteAccount(account.account_id);
      showToast(`Account #${account.account_id} (${account.name}) deleted`, 'success');
      onBack();
    }
  };

  const handleDeletePayment = async (p) => {
    const confirmed = await showConfirm({
      title: 'Delete Payment Record?',
      message: `Delete payment #${p.receipt_no || p.payment_id} of ${formatCurrency(p.amount_paid)} paid on ${formatDate(p.payment_date)}?`,
      details: 'This will recompute the customer balance and remove the payment from both local SQLite and cloud ledger.',
      confirmText: 'Delete Payment',
      cancelText: 'Keep Payment',
      type: 'danger'
    });
    if (confirmed) {
      await deletePayment(p.payment_id);
      showToast(`Payment of ${formatCurrency(p.amount_paid)} deleted`, 'success');
    }
  };

  const handleWaiveAccountPenalties = async () => {
    const unpaidList = accountPenalties.filter(p => p.status === 'UNPAID');
    if (unpaidList.length === 0) {
      await showAlert({
        title: 'No Outstanding Penalties',
        message: 'No recorded penalty items to waive. Any automatic calculation penalty will clear once regular amortization is settled.',
        type: 'info'
      });
      return;
    }
    const confirmed = await showConfirm({
      title: 'Waive Outstanding Penalties?',
      message: `Waive ${unpaidList.length} outstanding penalty record${unpaidList.length > 1 ? 's' : ''} for ${account.name}?`,
      details: 'This will update penalty records to waived status in both local database and cloud ledger.',
      confirmText: 'Waive Penalties',
      cancelText: 'Cancel',
      type: 'warning'
    });
    if (confirmed) {
      for (const p of unpaidList) {
        await waivePenalty(p.penalty_id);
      }
      showToast(`Waived ${unpaidList.length} penalty record${unpaidList.length > 1 ? 's' : ''}`, 'success');
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
          <button className="btn btn-secondary btn-sm" onClick={() => setIsEditModalOpen(true)} title="Edit Account">
            <Edit2 size={14} />
            <span>Edit</span>
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

        {/* Financial Overview Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: 8, marginTop: 14 }}>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 8, minWidth: 0 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contract</span>
            <div style={{ fontSize: 'clamp(0.78rem, 3vw, 0.96rem)', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {formatCurrency(account.total_contract_amount)}
            </div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 8, minWidth: 0 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Paid</span>
            <div style={{ fontSize: 'clamp(0.78rem, 3vw, 0.96rem)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {formatCurrency(account.total_paid)}
            </div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 8, minWidth: 0 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance Due</span>
            <div style={{ fontSize: 'clamp(0.78rem, 3vw, 0.96rem)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: account.outstanding_balance > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {formatCurrency(account.outstanding_balance)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Amortization Progress</span>
            <span style={{ fontWeight: 600 }}>{progressPercent.toFixed(1)}%</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-indigo), var(--accent-emerald))', borderRadius: 3 }} />
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px' }}
          onClick={() => openPaymentModal('Monthly Amortization')}
        >
          <CreditCard size={16} />
          <span>Record Payment</span>
        </button>

        <button
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px' }}
          onClick={handleViewSchedule}
        >
          <CalendarRange size={16} />
          <span>View Schedule</span>
        </button>
      </div>

      {/* Statement of Account (SOA) Button */}
      <button
        className="btn btn-secondary btn-block"
        style={{
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.1), rgba(16, 185, 129, 0.1))',
          border: '1px solid rgba(2, 132, 199, 0.35)',
          color: 'var(--text-primary)',
          fontWeight: 700
        }}
        onClick={() => setIsSOAModalOpen(true)}
      >
        <FileSpreadsheet size={16} color="var(--accent-cyan)" />
        <span>Statement of Account (SOA)</span>
      </button>

      {/* Penalty Action Banner if Penalty Balance > 0 */}
      {Number(account.penalties_balance) > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 8,
          padding: '12px 14px',
          marginBottom: 14
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontWeight: 700, fontSize: '0.86rem' }}>
              <AlertCircle size={16} />
              <span>Unpaid Penalty Balance:</span>
            </div>
            <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f59e0b' }}>
              {formatCurrency(account.penalties_balance)}
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>
            Penalty remains active until explicitly paid or waived. It is preserved even when regular monthly amortization is paid.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ padding: '5px 10px', fontSize: '0.74rem' }}
              onClick={() => openPaymentModal('Penalty', account.penalties_balance)}
            >
              Pay Penalty Only ({formatCurrency(account.penalties_balance)})
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '5px 10px', fontSize: '0.74rem' }}
              onClick={() => openPaymentModal('Amortization + Penalty')}
            >
              Pay Amortization + Penalty
            </button>
            {accountPenalties.some(p => p.status === 'UNPAID') && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ padding: '5px 10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}
                onClick={handleWaiveAccountPenalties}
              >
                Waive Penalties
              </button>
            )}
          </div>
        </div>
      )}

      {/* Derived Calculation Breakdown (Calculations & Penalties) */}
      <div className="glass-card" style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: '0.86rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Calculations & Penalties
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, fontSize: '0.8rem' }}>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6, minWidth: 0 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Down Payment</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {formatCurrency(account.total_dp_paid ?? account.down_payment)}
            </div>
            {unpaidDp > 0 ? (
              <span style={{ fontSize: '0.64rem', color: '#ea580c', display: 'block', marginTop: 1, fontWeight: 700 }}>
                Unpaid: {formatCurrency(unpaidDp)}
              </span>
            ) : account.down_payment > 0 ? (
              <span style={{ fontSize: '0.64rem', color: 'var(--accent-emerald)', display: 'block', marginTop: 1, fontWeight: 600 }}>
                ✓ Fully Paid
              </span>
            ) : null}
          </div>

          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Amortization Paid</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2 }}>
              {formatCurrency(account.installments_paid)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Monthly Amortization</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2 }}>
              {formatCurrency(account.monthly_amortization)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Number of Months</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2 }}>
              {account.num_of_months || 120} mos
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-subtle)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>DP Penalty (1%)</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2, color: account.dp_penalty > 0 ? 'var(--accent-rose)' : 'inherit' }}>
              {formatCurrency(account.dp_penalty)}
            </div>
            {account.dp_penalty > 0 && (
              <span style={{ fontSize: '0.64rem', color: 'var(--accent-rose)', display: 'block', marginTop: 1 }}>
                1% of contract ({formatCurrency(account.total_contract_amount)})
              </span>
            )}
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
            {account.ten_percent_penalty > 0 && (
              <span style={{ fontSize: '0.64rem', color: 'var(--accent-rose)', display: 'block', marginTop: 1 }}>
                10% of {formatCurrency(account.delayed_months_amount)} delayed
              </span>
            )}
          </div>

          <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244,63,94,0.2)', padding: 8, borderRadius: 6 }}>
            <span style={{ color: '#fb7185', fontSize: '0.72rem' }}>Outstanding Penalty</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: 2, color: '#fb7185' }}>
              {formatCurrency(account.penalties_balance !== undefined ? account.penalties_balance : account.total_penalties)}
            </div>
            {account.penalties_paid > 0 && (
              <span style={{ fontSize: '0.64rem', color: 'var(--accent-emerald)', display: 'block', marginTop: 1 }}>
                Paid: {formatCurrency(account.penalties_paid)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contract Details */}
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
      <div className="glass-card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Payment History ({accountPayments.length})
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={() => openPaymentModal('Monthly Amortization')}>
            + Add Payment
          </button>
        </div>

        {accountPayments.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            No payments recorded yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {accountPayments.map(p => {
              const hasSplit = Number(p.penalty_amount) > 0 && Number(p.amortization_amount) > 0;
              return (
                <div
                  key={p.payment_id}
                  style={{
                    background: 'var(--bg-card-subtle)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                        {formatCurrency(p.amount_paid)}
                      </span>
                      <span className="payment-type-badge" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        {p.payment_type}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      {formatDate(p.payment_date)} • {p.payment_method || 'Cash'}
                      {p.month_covered && (
                        <span style={{ marginLeft: 6, color: 'var(--accent-indigo)', fontWeight: 600 }}>
                          • For: {p.month_covered}
                        </span>
                      )}
                    </div>

                    {hasSplit && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Amort: {formatCurrency(p.amortization_amount)} | Penalty: {formatCurrency(p.penalty_amount)}
                      </div>
                    )}
                    {p.remarks && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 1 }}>
                        {p.remarks}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right', marginRight: 4 }}>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                        {p.receipt_no || `REC-${p.payment_id}`}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-xs"
                      style={{ padding: '5px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={() => setSelectedReceiptPayment(p)}
                      title="Print / Share Receipt"
                    >
                      <Printer size={12} color="var(--accent-emerald)" />
                      <span>Receipt</span>
                    </button>

                    <button
                      className="btn btn-secondary btn-xs action-icon-btn"
                      style={{ padding: '5px 7px' }}
                      onClick={() => setEditingPayment(p)}
                      title="Edit Payment"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Record Danger / Management Card Removed for Mobile */}

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
        isOpen={paymentModalConfig.isOpen}
        onClose={() => setPaymentModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSave={addPayment}
        accounts={accounts}
        defaultAccountId={account.account_id}
        defaultPaymentType={paymentModalConfig.defaultPaymentType}
        defaultAmount={paymentModalConfig.defaultAmount}
      />

      {/* Edit Payment Modal */}
      {editingPayment && (
        <PaymentFormModal
          isOpen={Boolean(editingPayment)}
          onClose={() => setEditingPayment(null)}
          onSave={updatePayment}
          editPayment={editingPayment}
          accounts={accounts}
          defaultAccountId={account.account_id}
        />
      )}

      {/* Statement of Account (SOA) Modal */}
      {isSOAModalOpen && (
        <SOAModal
          isOpen={isSOAModalOpen}
          onClose={() => setIsSOAModalOpen(false)}
          account={account}
          payments={payments}
        />
      )}

      {/* Receipt Preview & Share Modal */}
      {selectedReceiptPayment && (
        <ReceiptPreviewModal
          isOpen={Boolean(selectedReceiptPayment)}
          onClose={() => setSelectedReceiptPayment(null)}
          payment={selectedReceiptPayment}
          account={account}
          allPayments={payments}
        />
      )}
    </div>
  );
}
