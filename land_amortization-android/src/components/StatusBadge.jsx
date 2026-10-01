import React from 'react';

export function StatusBadge({ status }) {
  if (!status) return null;

  let badgeClass = 'ACTIVE';
  let label = status;

  if (status.includes('PENALTY')) {
    badgeClass = 'PENALTY';
  } else if (status.includes('DOWN PAYMENT OVERDUE')) {
    badgeClass = 'DP_OVERDUE';
  } else if (status === 'OVERDUE') {
    badgeClass = 'OVERDUE';
  } else if (status === 'PAID') {
    badgeClass = 'PAID';
  } else if (status === 'PARTIAL') {
    badgeClass = 'PARTIAL';
  } else if (status === 'DUE') {
    badgeClass = 'DUE';
  }

  return (
    <span className={`status-badge ${badgeClass}`}>
      <span className="dot" style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        backgroundColor: 'currentColor'
      }} />
      {label}
    </span>
  );
}
