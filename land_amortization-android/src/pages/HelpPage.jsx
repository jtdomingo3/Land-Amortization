import React, { useState } from 'react';
import { INSTRUCTIONS, PENALTY_RULES } from '../utils/constants.js';
import {
  BookOpen,
  HelpCircle,
  WifiOff,
  Cloud,
  Database,
  Printer,
  FileSpreadsheet,
  ShieldAlert,
  Sparkles,
  Calculator,
  FileText,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export function HelpPage() {
  const { setActiveTab } = useApp();
  const [activeSection, setActiveSection] = useState('all');

  const sections = [
    { id: 'all', label: 'All Guides' },
    { id: 'instructions', label: 'Usage Rules', icon: BookOpen },
    { id: 'penalties', label: 'Penalty Logic', icon: ShieldAlert },
    { id: 'waterfall', label: 'Waterfall Math', icon: Calculator },
    { id: 'printing', label: 'Receipts & SOA', icon: Printer },
    { id: 'storage', label: 'Database & Sync', icon: Database }
  ];

  return (
    <div className="help-page" style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hero Header */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              flexShrink: 0
            }}>
              <BookOpen size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>System Guide & Knowledge Base</h2>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Handbook for land amortization tracking, waterfall schedules, official receipts, and cloud sync
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('settings')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>Company & Sync Settings</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Section Pill Filters */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 10
        }}>
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              style={{
                background: activeSection === sec.id ? 'var(--accent-emerald)' : 'var(--bg-card-subtle)',
                color: activeSection === sec.id ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 20,
                padding: '5px 12px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Offline Architecture & Data Safety */}
      {(activeSection === 'all' || activeSection === 'storage') && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Database size={18} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              Offline-First Architecture & Storage
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            <div style={{
              background: 'var(--bg-card-subtle)',
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.8rem', marginBottom: 6 }}>
                <WifiOff size={15} />
                <span>100% Offline SQLite Storage</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Your data is stored locally in native SQLite on your phone. You can record payments and manage accounts in the field without any internet or mobile signal.
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card-subtle)',
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.8rem', marginBottom: 6 }}>
                <Cloud size={15} />
                <span>Supabase Real-Time Cloud Sync</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Connect to Supabase PostgreSQL in <strong>Settings</strong>. When online, records automatically sync bidirectionally between your Android phone and PC.
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card-subtle)',
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60a5fa', fontWeight: 700, fontSize: '0.8rem', marginBottom: 6 }}>
                <FileSpreadsheet size={15} />
                <span>Google Drive & Excel Backup</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Export 5-sheet tabular Excel (.xlsx) files directly to <code>Documents/Amortization Tracker/</code> or share directly to your connected Google Drive folder.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Official Usage Instructions */}
      {(activeSection === 'all' || activeSection === 'instructions') && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BookOpen size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              Official Usage Instructions (1 to 10)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {INSTRUCTIONS.map((instruction, idx) => {
              const text = instruction.replace(/^\d+\.\s*/, '');
              const [title, ...descParts] = text.split(':');
              const hasTitle = descParts.length > 0;

              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-card-subtle)',
                    padding: '10px 12px',
                    borderRadius: 8,
                    borderLeft: '3px solid var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10
                  }}
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {hasTitle ? (
                      <>
                        <strong style={{ color: 'var(--text-primary)' }}>{title}: </strong>
                        {descParts.join(':')}
                      </>
                    ) : (
                      text
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Waterfall Calculation Math */}
      {(activeSection === 'all' || activeSection === 'waterfall') && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Calculator size={18} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              Waterfall Schedule & Payment Allocation
            </h3>
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 10 }}>
            Amortization calculations use the real estate waterfall cascade methodology:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--accent-emerald)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem', marginBottom: 4 }}>1. Cascade Allocation</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                When an installment payment is received (e.g. ₱30,000 for a ₱10,000/mo contract), it is allocated to the earliest unpaid scheduled months first, marking Months 1, 2, and 3 as PAID.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--accent-gold)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem', marginBottom: 4 }}>2. Partial Payments</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Paying less than the full monthly amount marks the month as <strong>PARTIAL</strong>. Subsequent collections satisfy the partial balance before cascading forward.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--accent-cyan)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem', marginBottom: 4 }}>3. Down Payment Recalculation</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Recording a Down Payment automatically reduces the net principal balance, updating projected monthly installments across the remaining term.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Penalty Rules */}
      {(activeSection === 'all' || activeSection === 'penalties') && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ShieldAlert size={18} color="var(--accent-rose)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              Penalty Rules & Delinquency Guidelines
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {PENALTY_RULES.map((rule, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card-subtle)',
                  padding: '10px 12px',
                  borderRadius: 8,
                  borderLeft: '3px solid var(--accent-rose)',
                  fontSize: '0.76rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45
                }}
              >
                {rule}
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: 8,
            padding: 10,
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            lineHeight: 1.45
          }}>
            <strong style={{ color: '#fb7185' }}>Legal Note: </strong>
            Ensure default penalty policies match your signed contracts in accordance with Philippine Maceda Law (R.A. 6552) regulations.
          </div>
        </div>
      )}

      {/* 5. Receipts & SOA Printing Guide */}
      {(activeSection === 'all' || activeSection === 'printing') && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Printer size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              Official Receipts & Statements of Account (SOA)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={15} color="var(--accent-cyan)" />
                <span>Official Receipt (2 Slips per Page)</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Generates <strong>Original Customer Copy</strong> and <strong>Accounting File Copy</strong> with company logo, breakdown, words-in-words currency, and e-signature.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={15} color="var(--accent-emerald)" />
                <span>Statement of Account (SOA)</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Full amortized breakdown with contract summary, down payment history, installment schedules, and period filters (YTD, Year, Custom).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '12px 16px',
        fontSize: '0.74rem',
        color: 'var(--text-muted)'
      }}>
        Land Amortization Tracker • Mobile Edition v1.0.0 • Gezyne-Jamir Software Tech
      </div>
    </div>
  );
}

export default HelpPage;
