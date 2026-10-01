import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { KpiCard } from '../components/KpiCard.jsx';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import { PENALTY_RULES } from '../utils/constants.js';
import { AccountFormModal } from './AccountFormModal.jsx';
import { PaymentFormModal } from './PaymentFormModal.jsx';
import { GoogleDriveShareModal } from '../components/GoogleDriveShareModal.jsx';
import { FinancialDonutChart, MonthlyCollectionsChart } from '../components/DashboardCharts.jsx';
import { toISODateString } from '../utils/formatters.js';
import {
  Users,
  Wallet,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  PlusCircle,
  CreditCard,
  CloudUpload,
  TrendingUp,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export function DashboardPage() {
  const { dashboard, accounts, payments, setActiveTab, setSelectedAccountId, addAccount, addPayment, shareDrive, exportExcel, resetSample } = useApp();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [paymentModalConfig, setPaymentModalConfig] = useState({
    isOpen: false,
    defaultAccountId: null,
    defaultPaymentType: 'Installment',
    defaultAmount: null
  });
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const pendingDpAccounts = accounts.filter(
    a => Number(a.down_payment) > 0 && ((Number(a.total_dp_paid) || 0) < Number(a.down_payment))
  );

  const openPaymentModal = (accountId = null, type = 'Installment', amount = null) => {
    setPaymentModalConfig({
      isOpen: true,
      defaultAccountId: accountId,
      defaultPaymentType: type,
      defaultAmount: amount
    });
  };

  const handleShareClick = async () => {
    if (window.cordova || (window.plugins && window.plugins.socialsharing)) {
      try {
        setIsSharing(true);
        await shareDrive();
      } catch (err) {
        console.warn('Native share notice:', err);
      } finally {
        setIsSharing(false);
      }
    } else {
      // In web browser preview, open the Google Drive modal
      setIsDriveModalOpen(true);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Top Banner Quick Actions */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        <button
          className="btn btn-primary btn-sm"
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setIsAccountModalOpen(true)}
        >
          <PlusCircle size={15} />
          New Account
        </button>

        <button
          className="btn btn-secondary btn-sm"
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => openPaymentModal()}
        >
          <CreditCard size={15} />
          Record Payment
        </button>

        <button
          className="btn btn-drive btn-sm"
          style={{ whiteSpace: 'nowrap' }}
          onClick={handleShareClick}
          disabled={isSharing}
        >
          <CloudUpload size={15} />
          {isSharing ? 'Saving...' : 'Save to Drive'}
        </button>
      </div>

      {/* Empty State Banner if 0 Accounts */}
      {accounts.length === 0 && (
        <div className="glass-card" style={{
          textAlign: 'center',
          padding: '24px 16px',
          marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 14
        }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: 12
          }}>
            <Sparkles size={24} />
          </div>
          <h3 style={{ fontSize: '1.08rem', fontWeight: 800, marginBottom: 6 }}>
            Ready to Track Land Amortizations
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 360, margin: '0 auto 16px auto', lineHeight: 1.45 }}>
            Your database is fresh and empty. Start creating your buyer accounts, or load the sample demo data to see amortization waterfalls and penalty calculations in action.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsAccountModalOpen(true)}
              style={{ padding: '8px 16px' }}
            >
              <PlusCircle size={15} />
              Create First Account
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={resetSample}
              style={{ padding: '8px 16px' }}
            >
              <FileSpreadsheet size={15} color="var(--accent-emerald)" />
              Load Sample Demo Data
            </button>
          </div>
        </div>
      )}

      {/* Main Collection Progress Bar */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Collection Progress
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald-light)' }}>
            {(dashboard.collectionRate || 0).toFixed(1)}%
          </span>
        </div>

        <div style={{
          width: '100%',
          height: 10,
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 99,
          overflow: 'hidden',
          marginBottom: 10
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, dashboard.collectionRate || 0)}%`,
            background: 'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))',
            borderRadius: 99,
            transition: 'width 0.8s ease'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Collected: </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(dashboard.totalCollected)}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Target: </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(dashboard.totalContractAmount)}</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (4 core financial cards) */}
      <div className="kpi-grid">
        <KpiCard
          title="Total Accounts"
          value={dashboard.totalAccounts || 0}
          subtext="Active buyers in DB"
          color="emerald"
          icon={Users}
        />
        <KpiCard
          title="Total Contract"
          value={formatCurrency(dashboard.totalContractAmount)}
          subtext="Agreed total amount"
          color="cyan"
          icon={FileSpreadsheet}
        />
        <KpiCard
          title="Total Collected"
          value={formatCurrency(dashboard.totalCollected)}
          subtext={`DP: ${formatCurrency(dashboard.totalDownPayments)}`}
          color="emerald"
          icon={Wallet}
        />
        <KpiCard
          title="Outstanding Due"
          value={formatCurrency(dashboard.outstandingBalance)}
          subtext="Base + Penalties"
          color="rose"
          icon={AlertTriangle}
        />
      </div>

      {/* Portfolio Financial Donut Chart */}
      <FinancialDonutChart dashboard={dashboard} />

      {/* Account Status Breakdown Grid */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Account Status Distribution
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <div
            onClick={() => setActiveTab('accounts')}
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-emerald-light)' }}>
              {dashboard.activeAccounts || 0}
            </span>
          </div>

          <div
            onClick={() => setActiveTab('accounts')}
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="var(--accent-amber)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Overdue</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-amber)' }}>
              {dashboard.overdueAccounts || 0}
            </span>
          </div>

          <div
            onClick={() => setActiveTab('accounts')}
            style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={16} color="var(--accent-rose)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>2+ Missed (10%)</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-rose)' }}>
              {dashboard.twoPlusMissed || 0}
            </span>
          </div>

          <div
            onClick={() => setActiveTab('accounts')}
            style={{
              background: 'rgba(234, 88, 12, 0.08)',
              border: '1px solid rgba(234, 88, 12, 0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="#fb923c" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>DP Overdue</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: '#fb923c' }}>
              {dashboard.downPaymentsOverdue || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Down Payments Quick Action Section */}
      {pendingDpAccounts.length > 0 && (
        <div className="glass-card" style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08), rgba(245, 158, 11, 0.08))',
          border: '1px solid rgba(234, 88, 12, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} color="#ea580c" />
              <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', margin: 0 }}>
                Pending Down Payments ({pendingDpAccounts.length})
              </h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Paying DP recomputes & lowers monthly amortization
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingDpAccounts.map(acc => {
              const unpaid = Math.max(0, (Number(acc.down_payment) || 0) - (Number(acc.total_dp_paid) || 0));
              const reducedAmort = Number((Math.max(0, Number(acc.total_contract_amount || 0) - (Number(acc.total_dp_paid || 0) + unpaid)) / (Number(acc.num_of_months) || 120)).toFixed(2));
              return (
                <div
                  key={acc.account_id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                      #{acc.account_id} • {acc.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      DP Unpaid: <strong style={{ color: '#ea580c' }}>{formatCurrency(unpaid)}</strong> • Monthly will drop from ₱{Number(acc.monthly_amortization).toLocaleString()} to <strong style={{ color: 'var(--accent-emerald-light)' }}>₱{reducedAmort.toLocaleString()}</strong>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    style={{
                      background: '#ea580c',
                      borderColor: '#ea580c',
                      whiteSpace: 'nowrap',
                      padding: '5px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}
                    onClick={() => openPaymentModal(acc.account_id, 'Down Payment', unpaid)}
                  >
                    Pay DP ({formatCurrency(unpaid)})
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Collections Timeline Bar Chart */}
      <MonthlyCollectionsChart payments={payments} />

      {/* Penalties Summary Box */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Penalties Breakdown
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DP Penalty (1%)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: 4 }}>
              {formatCurrency(dashboard.dpPenalties)}
            </div>
          </div>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>10% Penalties</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: 4 }}>
              {formatCurrency(dashboard.tenPercentPenalties)}
            </div>
          </div>
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: 10, borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: '#fb7185' }}>Total Penalties</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: '#fb7185', marginTop: 4 }}>
              {formatCurrency(dashboard.totalPenalties)}
            </div>
          </div>
        </div>
      </div>

      {/* Rules Notice (Light & Dark mode responsive) */}
      <div className="glass-card rules-card" style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 8, textTransform: 'uppercase' }}>
          Penalty & Payment Rules
        </h4>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PENALTY_RULES.map((rule, idx) => (
            <li key={idx} style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* Modals */}
      <AccountFormModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={addAccount}
        existingAccounts={accounts}
      />

      <PaymentFormModal
        isOpen={paymentModalConfig.isOpen}
        onClose={() => setPaymentModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSave={addPayment}
        accounts={accounts}
        defaultAccountId={paymentModalConfig.defaultAccountId}
        defaultPaymentType={paymentModalConfig.defaultPaymentType}
        defaultAmount={paymentModalConfig.defaultAmount}
      />

      {/* Google Drive Connection & Share Modal */}
      <GoogleDriveShareModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        fileName={`Land_Amortization_Tracker_${toISODateString(new Date())}.xlsx`}
        onDirectDownload={() => exportExcel(`Land_Amortization_Tracker_${toISODateString(new Date())}.xlsx`)}
        onShareNative={() => shareDrive()}
        isCordova={Boolean(window.cordova || (window.plugins && window.plugins.socialsharing) || /android|iphone|ipad/i.test(navigator.userAgent))}
      />
    </div>
  );
}
