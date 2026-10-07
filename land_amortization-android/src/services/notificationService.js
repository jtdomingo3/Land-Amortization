import { toISODateString, formatCurrency, formatNumber, formatDate } from '../utils/formatters.js';
import { daysDifference } from '../utils/dateUtils.js';

const NOTIF_PREFS_KEY = 'land_amortization_notif_prefs';
const NOTIF_LAST_TRIGGERED_KEY = 'land_amortization_notif_last_triggered';

/**
 * Check if app is running in Cordova Android environment
 */
export function isCordovaEnvironment() {
  return typeof window !== 'undefined' && Boolean(window.cordova && window.cordova.exec);
}

/**
 * Wait for Cordova deviceready event if in hybrid Android environment
 */
export async function waitForCordova(timeoutMs = 2000) {
  if (typeof window === 'undefined') return false;
  if (window.cordova && window.cordova.exec) return true;

  return new Promise((resolve) => {
    let resolved = false;

    const onDeviceReady = () => {
      if (resolved) return;
      resolved = true;
      document.removeEventListener('deviceready', onDeviceReady);
      resolve(Boolean(window.cordova && window.cordova.exec));
    };

    document.addEventListener('deviceready', onDeviceReady);

    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      document.removeEventListener('deviceready', onDeviceReady);
      resolve(Boolean(window.cordova && window.cordova.exec));
    }, timeoutMs);
  });
}

/**
 * Get saved notification preferences
 */
export function getNotificationPreferences() {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}

  return {
    enabled: true,
    overdueAlerts: true,
    dueTodayAlerts: true,
    upcomingAlerts: true,
    minDaysOverdue: 1
  };
}

/**
 * Save notification preferences
 */
export function saveNotificationPreferences(prefs) {
  try {
    const current = getNotificationPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save notification preferences:', err);
    return prefs;
  }
}

/**
 * Check notification permissions on device
 */
export async function checkNotificationPermission() {
  await waitForCordova();

  if (isCordovaEnvironment()) {
    return new Promise((resolve) => {
      window.cordova.exec(
        (res) => resolve(res || { granted: false }),
        (err) => {
          console.warn('Cordova checkPermission error:', err);
          resolve({ granted: false, error: err });
        },
        'NotificationPlugin',
        'checkPermission',
        []
      );
    });
  }

  // Web fallback (Browser / Electron / PWA)
  if (typeof window !== 'undefined' && 'Notification' in window) {
    const perm = window.Notification.permission;
    return {
      granted: perm === 'granted',
      canRequest: perm === 'default',
      areEnabled: perm === 'granted'
    };
  }

  return { granted: false, canRequest: false, areEnabled: false };
}

/**
 * Request notification permissions on device
 */
export async function requestNotificationPermission() {
  await waitForCordova();

  if (isCordovaEnvironment()) {
    return new Promise((resolve) => {
      window.cordova.exec(
        (res) => resolve(res || { granted: false }),
        (err) => {
          console.warn('Cordova requestPermission error:', err);
          resolve({ granted: false, error: err });
        },
        'NotificationPlugin',
        'requestPermission',
        []
      );
    });
  }

  // Web fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const res = await window.Notification.requestPermission();
      return { granted: res === 'granted' };
    } catch (e) {
      return { granted: false, error: e.message };
    }
  }

  return { granted: false };
}

/**
 * Open native system notification settings for this app
 */
export async function openSystemNotificationSettings() {
  await waitForCordova();

  if (isCordovaEnvironment()) {
    return new Promise((resolve) => {
      window.cordova.exec(
        (res) => resolve(res),
        (err) => resolve(err),
        'NotificationPlugin',
        'openSettings',
        []
      );
    });
  }
}

/**
 * Post a notification to phone status bar / lock screen
 */
export async function sendLocalNotification({ id, title, message, type = 'overdue', subText = 'Land Amortization' }) {
  await waitForCordova();
  const notifId = id || Math.floor(Math.random() * 900000) + 100000;

  if (isCordovaEnvironment()) {
    return new Promise((resolve) => {
      window.cordova.exec(
        (res) => resolve(res),
        (err) => {
          console.warn('Failed to send native notification:', err);
          resolve({ success: false, error: err });
        },
        'NotificationPlugin',
        'sendNotification',
        [{ id: notifId, title, message, type, subText }]
      );
    });
  }

  // Web fallback
  if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
    try {
      new window.Notification(title, {
        body: message,
        icon: './public/logo.png',
        tag: `land_${notifId}`
      });
      return { success: true, id: notifId };
    } catch (_) {}
  }

  return { success: false, reason: 'unsupported' };
}

/**
 * Scan accounts and compute all overdue, delinquent, and due today notifications
 */
export function evaluateNotifications(accounts = [], todayRef = new Date()) {
  const todayStr = toISODateString(todayRef);

  const overdueList = [];
  const dpOverdueList = [];
  const dueTodayList = [];
  const upcomingList = [];

  for (const acc of accounts) {
    if (!acc || acc.outstanding_balance <= 0) continue;

    const daysOverdue = Number(acc.days_overdue) || 0;
    const isDpOverdue = acc.status === 'DOWN PAYMENT OVERDUE' || (acc.dp_penalty && acc.dp_penalty > 0);
    const isDelinquent = acc.status === 'PENALTY' || (acc.consecutive_missed && acc.consecutive_missed >= 2);
    const isRegularOverdue = acc.status === 'OVERDUE' || daysOverdue > 0;

    // 1. Down Payment Overdue
    if (isDpOverdue && !acc.is_dp_paid) {
      dpOverdueList.push({
        account: acc,
        type: 'dp_overdue',
        severity: 'danger',
        title: `Down Payment Overdue: ${acc.name}`,
        message: `Account #${acc.account_id} has an unpaid down payment of ${formatCurrency(acc.down_payment)} with 1% penalty applied (${formatCurrency(acc.dp_penalty)}).`,
        amount: Number(acc.down_payment) || 0,
        penalty: Number(acc.dp_penalty) || 0,
        daysOverdue
      });
    }

    // 2. Delinquent / Missed Amortizations
    if (isDelinquent || isRegularOverdue) {
      const missedCount = acc.consecutive_missed || (daysOverdue > 30 ? Math.ceil(daysOverdue / 30) : 1);
      const isSevere = missedCount >= 2;
      overdueList.push({
        account: acc,
        type: isSevere ? 'delinquent' : 'overdue',
        severity: isSevere ? 'danger' : 'warning',
        title: isSevere ? `⚠️ Delinquent (10% Penalty): ${acc.name}` : `Overdue Amortization: ${acc.name}`,
        message: `Account #${acc.account_id} has ${missedCount} consecutive missed monthly payment(s) (${daysOverdue} days overdue). Monthly amortization: ${formatCurrency(acc.monthly_amortization)}.`,
        amount: Number(acc.monthly_amortization) || 0,
        totalDue: Number(acc.total_amount_due || acc.outstanding_balance) || 0,
        penalties: Number(acc.total_penalties) || 0,
        daysOverdue,
        missedCount
      });
    }

    // 3. Payment Due Today
    if (acc.next_due_date === todayStr) {
      dueTodayList.push({
        account: acc,
        type: 'due_today',
        severity: 'primary',
        title: `Payment Due Today: ${acc.name}`,
        message: `Account #${acc.account_id} monthly amortization of ${formatCurrency(acc.monthly_amortization)} is due today (${formatDate(acc.next_due_date)}).`,
        amount: Number(acc.monthly_amortization) || 0,
        dueDate: acc.next_due_date
      });
    } else if (acc.next_due_date && acc.next_due_date > todayStr) {
      const daysUntil = daysDifference(acc.next_due_date, todayRef);
      if (daysUntil >= 1 && daysUntil <= 5) {
        upcomingList.push({
          account: acc,
          type: 'upcoming',
          severity: 'info',
          title: `Upcoming Payment: ${acc.name}`,
          message: `Account #${acc.account_id} monthly amortization of ${formatCurrency(acc.monthly_amortization)} is due in ${daysUntil} day(s) on ${formatDate(acc.next_due_date)}.`,
          amount: Number(acc.monthly_amortization) || 0,
          dueDate: acc.next_due_date,
          daysUntil
        });
      }
    }
  }

  // Combined active alerts count
  const totalAlerts = overdueList.length + dpOverdueList.length + dueTodayList.length;

  return {
    overdueList,
    dpOverdueList,
    dueTodayList,
    upcomingList,
    totalAlerts,
    hasAlerts: totalAlerts > 0
  };
}

/**
 * Trigger real phone status bar notifications for overdue or due accounts
 * @param {Array} accounts
 * @param {Object} options { force: boolean }
 */
export async function triggerNotificationAlerts(accounts = [], options = {}) {
  const prefs = getNotificationPreferences();
  if (!prefs.enabled && !options.force) {
    return { sent: 0, reason: 'disabled' };
  }

  const perm = await checkNotificationPermission();
  if (!perm.granted && !options.force) {
    return { sent: 0, reason: 'permission_not_granted' };
  }

  // Check anti-spam throttle: do not re-alert phone within 4 hours unless force === true
  const now = Date.now();
  if (!options.force) {
    try {
      const lastTriggered = Number(localStorage.getItem(NOTIF_LAST_TRIGGERED_KEY)) || 0;
      const fourHours = 4 * 60 * 60 * 1000;
      if (now - lastTriggered < fourHours) {
        return { sent: 0, reason: 'throttled' };
      }
    } catch (_) {}
  }

  const { overdueList, dpOverdueList, dueTodayList } = evaluateNotifications(accounts);
  let sentCount = 0;

  // 1. Overdue & Delinquent Notifications
  if (prefs.overdueAlerts && (overdueList.length > 0 || dpOverdueList.length > 0)) {
    if (overdueList.length === 1) {
      const item = overdueList[0];
      await sendLocalNotification({
        id: 101,
        title: item.title,
        message: item.message,
        type: 'overdue',
        subText: 'Overdue Collection'
      });
      sentCount++;
    } else if (overdueList.length > 1) {
      const names = overdueList.slice(0, 3).map(i => i.account.name).join(', ');
      const more = overdueList.length > 3 ? ` and ${overdueList.length - 3} more` : '';
      await sendLocalNotification({
        id: 101,
        title: `⚠️ ${overdueList.length} Overdue Amortizations`,
        message: `Accounts requiring follow-up: ${names}${more}. Check dashboard for delinquency details.`,
        type: 'overdue',
        subText: 'Overdue Summary'
      });
      sentCount++;
    }

    if (dpOverdueList.length > 0) {
      const dpItem = dpOverdueList[0];
      await sendLocalNotification({
        id: 102,
        title: dpItem.title,
        message: dpItem.message,
        type: 'overdue',
        subText: 'DP Overdue'
      });
      sentCount++;
    }
  }

  // 2. Due Today Notifications
  if (prefs.dueTodayAlerts && dueTodayList.length > 0) {
    if (dueTodayList.length === 1) {
      const item = dueTodayList[0];
      await sendLocalNotification({
        id: 201,
        title: item.title,
        message: item.message,
        type: 'due',
        subText: 'Due Today'
      });
      sentCount++;
    } else {
      const names = dueTodayList.map(i => i.account.name).join(', ');
      await sendLocalNotification({
        id: 201,
        title: `🔔 ${dueTodayList.length} Payments Due Today`,
        message: `Amortizations due today for: ${names}.`,
        type: 'due',
        subText: 'Due Today'
      });
      sentCount++;
    }
  }

  try {
    localStorage.setItem(NOTIF_LAST_TRIGGERED_KEY, String(now));
  } catch (_) {}

  return { sent: sentCount };
}
