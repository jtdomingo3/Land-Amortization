import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters.js';
import { PieChart, BarChart3 } from 'lucide-react';

export function FinancialDonutChart({ dashboard }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const collected = dashboard.totalCollected || 0;
  const penalties = dashboard.totalPenalties || 0;
  const baseBalance = Math.max(0, (dashboard.totalContractAmount || 0) - collected);
  const total = collected + baseBalance + penalties;

  if (total <= 0) return null;

  const data = [
    {
      label: 'Collected',
      value: collected,
      color: 'var(--accent-emerald)',
      lightColor: '#10b981',
      percent: ((collected / total) * 100).toFixed(1)
    },
    {
      label: 'Remaining Base',
      value: baseBalance,
      color: 'var(--accent-cyan)',
      lightColor: '#0ea5e9',
      percent: ((baseBalance / total) * 100).toFixed(1)
    },
    {
      label: 'Penalties Due',
      value: penalties,
      color: 'var(--accent-rose)',
      lightColor: '#f43f5e',
      percent: ((penalties / total) * 100).toFixed(1)
    }
  ].filter(d => d.value > 0);

  // Calculate SVG donut slices using stroke-dasharray
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="glass-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PieChart size={17} color="var(--accent-emerald)" />
          <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Portfolio Financial Breakdown
          </h3>
        </div>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          {data.length} segments
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--bg-surface)"
              strokeWidth={strokeWidth}
            />
            {data.map((item, idx) => {
              const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += item.value / total;

              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.lightColor}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    filter: isHovered ? `drop-shadow(0 0 6px ${item.lightColor})` : 'none'
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Info */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              {hoveredIdx !== null ? data[hoveredIdx].label : 'Collection'}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: hoveredIdx !== null ? '0.85rem' : '1.1rem',
              color: hoveredIdx !== null ? data[hoveredIdx].lightColor : 'var(--text-primary)'
            }}>
              {hoveredIdx !== null ? `${data[hoveredIdx].percent}%` : `${(dashboard.collectionRate || 0).toFixed(0)}%`}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
          {data.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: isHovered ? 'var(--bg-surface)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: item.lightColor,
                    boxShadow: `0 0 8px ${item.lightColor}40`
                  }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    {formatCurrency(item.value)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                    ({item.percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MonthlyCollectionsChart({ payments }) {
  // Aggregate payments by Month Covered
  const monthMap = {};
  for (const p of payments) {
    const key = p.month_covered || 'Other';
    monthMap[key] = (monthMap[key] || 0) + (Number(p.amount_paid) || 0);
  }

  const entries = Object.entries(monthMap);
  if (entries.length === 0) return null;

  const maxVal = Math.max(...entries.map(([, val]) => val), 1);

  return (
    <div className="glass-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart3 size={17} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Collections by Month
          </h3>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {entries.length} months logged
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map(([month, val], idx) => {
          const barPercent = Math.min(100, Math.max(12, (val / maxVal) * 100));
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{month}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  {formatCurrency(val)}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: 'var(--bg-surface)',
                borderRadius: 99,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${barPercent}%`,
                  background: 'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))',
                  borderRadius: 99,
                  transition: 'width 0.6s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
