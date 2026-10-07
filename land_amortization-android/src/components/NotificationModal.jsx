import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Settings,
  Send,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  openSystemNotificationSettings,
  sendLocalNotification,
  evaluateNotifications,
  getNotificationPreferences,
  saveNotificationPreferences
} from '../services/notificationService.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export function NotificationModal({ isOpen, onClose }) {
  const { accounts, setSelectedAccountId, setActiveTab, showToast } = useApp();
  const [activeTab, setActiveTabState] = useState('all'); // 'all', 'overdue', 'due'
  const [permStatus, setPermStatus] = useState({ granted: false });
  const [prefs, setPrefs] = useState(getNotificationPreferences());
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkNotificationPermission().then(setPermStatus);
      setPrefs(getNotificationPreferences());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { overdueList, dpOverdueList, dueTodayList, upcomingList, totalAlerts } = evaluateNotifications(accounts);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const res = await requestNotificationPermission();
      const updated = await checkNotificationPermission();
      setPermStatus(updated);
      if (res.granted || updated.granted) {
        showToast('Notification permission granted!', 'success');
        // Fire a welcome test notification
        await sendLocalNotification({
          title: '✅ Notification Access Enabled',
          message: 'You will receive reminders for missed, overdue, and due amortizations.',
          type: 'general'
        });
      } else {
        showToast('Permission not granted. Opening phone notification settings...', 'warning');
        await openSystemNotificationSettings();
      }
    } catch (err) {
      console.warn('Permission error:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const perm = await checkNotificationPermission();
      if (!perm.granted) {
        await requestNotificationPermission();
      }
      const res = await sendLocalNotification({
        title: '🔔 Test Notification: Land Amortization',
        message: 'Overdue alerts and payment due reminders are active on your device!',
        type: 'overdue'
      });
      if (res && res.success) {
        showToast('Test notification sent to phone!', 'success');
      } else {
        showToast('Could not send notification. Check phone notification permissions.', 'warning');
      }
    } catch (err) {
      showToast('Notification test failed: ' + err.message, 'danger');
    }
  };

  const handleTogglePref = (key) => {
    const updated = saveNotificationPreferences({ [key]: !prefs[key] });
    setPrefs(updated);
  };

  const handleSelectAccount = (accountId) => {
    setSelectedAccountId(accountId);
    setActiveTab('accounts');
    onClose();
  };

  return (
    <div
      className="modal-popup-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        className="glass-card modal-popup-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 460,
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border-subtle)',
          animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(244, 63, 94, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-rose)'
            }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Payment Notifications
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                {totalAlerts} active alerts ({overdueList.length + dpOverdueList.length} overdue, {dueTodayList.length} due today)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ width: 32, height: 32, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Permission Banner if not enabled */}
        {!permStatus.granted && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.12), rgba(244, 63, 94, 0.12))',
            borderBottom: '1px solid rgba(234, 88, 12, 0.25)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={20} color="#ea580c" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ea580c' }}>
                  Phone Notification Access Required
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Enable Android notifications to get alerts when payments are due or missed.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                className="btn btn-primary btn-sm"
                style={{
                  background: '#ea580c',
                  borderColor: '#ea580c',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  padding: '6px 12px'
                }}
                onClick={handleRequestPermission}
                disabled={isRequesting}
              >
                {isRequesting ? 'Enabling...' : 'Enable Access'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.74rem',
                  padding: '6px 8px'
                }}
                onClick={openSystemNotificationSettings}
                title="Open Phone Settings"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Tab Filter Pills */}
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-card-subtle)'
        }}>
          <button
            onClick={() => setActiveTabState('all')}
            className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 20 }}
          >
            All Alerts ({totalAlerts})
          </button>
          <button
            onClick={() => setActiveTabState('overdue')}
            className={`btn btn-sm ${activeTab === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 20 }}
          >
            Overdue ({overdueList.length + dpOverdueList.length})
          </button>
          <button
            onClick={() => setActiveTabState('due')}
            className={`btn btn-sm ${activeTab === 'due' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 20 }}
          >
            Due Today / Soon ({dueTodayList.length + upcomingList.length})
          </button>
        </div>

        {/* Alert Items List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {totalAlerts === 0 && upcomingList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={40} color="var(--accent-emerald)" style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                All Collections Up to Date!
              </div>
              <div style={{ fontSize: '0.76rem', marginTop: 4 }}>
                No missed or overdue accounts found. Current payments are on track.
              </div>
            </div>
          ) : (
            <>
              {/* Overdue / Delinquent Items */}
              {(activeTab === 'all' || activeTab === 'overdue') && (
                <>
                  {overdueList.map(item => (
                    <div
                      key={`overdue_${item.account.account_id}`}
                      onClick={() => handleSelectAccount(item.account.account_id)}
                      style={{
                        background: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(244, 63, 94, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-rose)',
                          flexShrink: 0
                        }}>
                          <ShieldAlert size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {item.account.name}
                            </span>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: '#fb7185',
                              color: '#fff'
                            }}>
                              {item.daysOverdue}d Overdue
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {item.missedCount} Missed Month(s) • Monthly: {formatCurrency(item.amount)}
                          </div>
                          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-rose)', marginTop: 2 }}>
                            Total Due: {formatCurrency(item.totalDue)}
                          </div>
                        </div>
                      </div>

                      <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </div>
                  ))}

                  {dpOverdueList.map(item => (
                    <div
                      key={`dp_${item.account.account_id}`}
                      onClick={() => handleSelectAccount(item.account.account_id)}
                      style={{
                        background: 'rgba(234, 88, 12, 0.08)',
                        border: '1px solid rgba(234, 88, 12, 0.25)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(234, 88, 12, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ea580c',
                          flexShrink: 0
                        }}>
                          <AlertTriangle size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {item.account.name}
                            </span>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: '#fb923c',
                              color: '#fff'
                            }}>
                              DP Overdue
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            Down Payment Unpaid: <strong style={{ color: '#ea580c' }}>{formatCurrency(item.amount)}</strong>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            1% DP Penalty: {formatCurrency(item.penalty)}
                          </div>
                        </div>
                      </div>

                      <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </div>
                  ))}
                </>
              )}

              {/* Due Today Items */}
              {(activeTab === 'all' || activeTab === 'due') && (
                <>
                  {dueTodayList.map(item => (
                    <div
                      key={`today_${item.account.account_id}`}
                      onClick={() => handleSelectAccount(item.account.account_id)}
                      style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(16, 185, 129, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-emerald)',
                          flexShrink: 0
                        }}>
                          <Clock size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {item.account.name}
                            </span>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: 'var(--accent-emerald)',
                              color: '#fff'
                            }}>
                              Due Today
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            Monthly Amortization: <strong style={{ color: 'var(--accent-emerald-light)' }}>{formatCurrency(item.amount)}</strong>
                          </div>
                        </div>
                      </div>

                      <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </div>
                  ))}

                  {upcomingList.map(item => (
                    <div
                      key={`upcoming_${item.account.account_id}`}
                      onClick={() => handleSelectAccount(item.account.account_id)}
                      style={{
                        background: 'rgba(2, 132, 199, 0.08)',
                        border: '1px solid rgba(2, 132, 199, 0.25)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(2, 132, 199, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-cyan)',
                          flexShrink: 0
                        }}>
                          <Calendar size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {item.account.name}
                            </span>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: 'var(--accent-cyan)',
                              color: '#fff'
                            }}>
                              Due in {item.daysUntil}d
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            Due Date: {formatDate(item.dueDate)} • {formatCurrency(item.amount)}
                          </div>
                        </div>
                      </div>

                      <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleTestNotification}
              style={{ fontSize: '0.74rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={13} />
              <span>Test Notification</span>
            </button>

            {!permStatus.granted && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={openSystemNotificationSettings}
                style={{ fontSize: '0.74rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Settings size={13} />
                <span>Phone Settings</span>
              </button>
            )}
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={onClose}
            style={{ fontSize: '0.76rem', padding: '6px 16px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
export default NotificationModal;
