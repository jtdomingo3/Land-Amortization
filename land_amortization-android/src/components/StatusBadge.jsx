import React from 'react';

export function StatusBadge({ status }) {
  if (!status) return null;

  let badgeClass = 'ACTIVE';
  let label = status;

  const upper = String(status).toUpperCase();

  if (upper.includes('PENALTY') || upper.includes('MISSED')) {
    badgeClass = 'PENALTY';
    label = '10% Penalty';
  } else if (upper.includes('DOWN PAYMENT') || upper.includes('DP')) {
    badgeClass = 'DP_OVERDUE';
    label = 'DP Overdue';
  } else if (upper === 'OVERDUE' || (upper.includes('OVERDUE') && !upper.includes('DP'))) {
    badgeClass = 'OVERDUE';
    label = 'Overdue';
  } else if (upper === 'PAID' || upper.includes('PAID')) {
    badgeClass = 'PAID';
    label = 'Paid';
  } else if (upper === 'PARTIAL') {
    badgeClass = 'PARTIAL';
    label = 'Partial';
  } else if (upper === 'DUE') {
    badgeClass = 'DUE';
    label = 'Due';
  } else if (upper === 'ACTIVE') {
    badgeClass = 'ACTIVE';
    label = 'Active';
  }

  return (
    <span className={`status-badge ${badgeClass}`}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          flexShrink: 0
        }}
      />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </span>
  );
}
