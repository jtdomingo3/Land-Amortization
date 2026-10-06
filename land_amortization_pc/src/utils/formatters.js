/**
 * Format numeric value as Philippine Peso currency
 * @param {number|string} val 
 * @param {boolean} showSymbol 
 * @returns {string}
 */
export function formatCurrency(val, showSymbol = true) {
  const num = Number(val) || 0;
  const formatted = num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return showSymbol ? `₱${formatted}` : formatted;
}

/**
 * Format number with comma thousands separators
 * @param {number|string} val 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatNumber(val, decimals = 0) {
  const num = Number(val) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format date string (YYYY-MM-DD or ISO) to MM/DD/YYYY format
 * @param {string|Date} dateVal 
 * @returns {string} MM/DD/YYYY
 */
export function formatDate(dateVal) {
  if (!dateVal) return '-';
  try {
    if (typeof dateVal === 'string') {
      const match = dateVal.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (match) {
        const y = match[1];
        const m = match[2].padStart(2, '0');
        const d = match[3].padStart(2, '0');
        return `${m}/${d}/${y}`;
      }
    }
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return String(dateVal);
  }
}

/**
 * Format date to Month Year (e.g. October 2026) for Month Covered column
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export function formatMonthCovered(dateVal) {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  } catch {
    return '-';
  }
}

/**
 * Return ISO date string YYYY-MM-DD
 * @param {Date|string} dateVal 
 * @returns {string}
 */
export function toISODateString(dateVal) {
  if (!dateVal) return '';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format timestamp for Last Synced display showing both date and time
 * (e.g., "Today, 11:22 AM" or "Oct 2, 2026, 11:22 AM")
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export function formatLastSync(dateVal) {
  if (!dateVal) return 'Never synced';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return 'Never synced';

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) {
    return `Today, ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${timeStr}`;
  }

  const isThisYear = d.getFullYear() === now.getFullYear();
  const dateStr = d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    ...(isThisYear ? {} : { year: 'numeric' })
  });

  return `${dateStr}, ${timeStr}`;
}

