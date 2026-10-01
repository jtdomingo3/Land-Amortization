import React from 'react';

export function KpiCard({ title, value, subtext, color = 'emerald', icon: Icon }) {
  return (
    <div className={`kpi-card ${color}`}>
      <div className="kpi-header">
        <span>{title}</span>
        {Icon && <Icon size={16} style={{ opacity: 0.8 }} />}
      </div>
      <div className="kpi-value">{value}</div>
      {subtext && <div className="kpi-sub">{subtext}</div>}
    </div>
  );
}
