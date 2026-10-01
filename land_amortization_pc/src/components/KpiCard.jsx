import React from 'react';

export function KpiCard({ title, value, subtext, color = 'emerald', icon: Icon }) {
  return (
    <div className={`kpi-card ${color}`}>
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        {Icon && (
          <div className={`kpi-icon-box ${color}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {subtext && <div className="kpi-sub">{subtext}</div>}
    </div>
  );
}
