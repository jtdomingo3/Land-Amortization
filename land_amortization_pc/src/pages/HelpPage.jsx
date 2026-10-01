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
  CheckCircle2,
  Calculator,
  FileText,
  Layers,
  ExternalLink,
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
    <div className="help-page" style={{ maxWidth: 1040, margin: '0 auto' }}>
      {/* Hero Header */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <BookOpen size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>User Guide & System Knowledge Base</h2>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Comprehensive manual for land amortization tracking, waterfall schedules, official receipts, and cloud backups
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('settings')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>Company & Cloud Settings</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Section Pill Filters */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 16,
          overflowX: 'auto',
          paddingBottom: 4,
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 12
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
                padding: '6px 14px',
                fontSize: '0.74rem',
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
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Database size={18} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Offline-First Architecture & Storage
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <div style={{
              background: 'var(--bg-card-subtle)',
              padding: 14,
              borderRadius: 10,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.82rem', marginBottom: 6 }}>
                <WifiOff size={16} />
                <span>100% Offline SQLite Engine</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your data is stored locally on this computer in a high-speed SQLite database (located in your system AppData). The application works with zero internet dependency and never freezes or requires an online login to record payments.
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card-subtle)',
              padding: 14,
              borderRadius: 10,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.82rem', marginBottom: 6 }}>
                <FileSpreadsheet size={16} />
                <span>Default Excel Backup Location</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                All generated 5-sheet Excel workbooks are automatically organized in:
                <br />
                <code style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                  My Documents &gt; Amortization Tracker &gt; ExcelFile
                </code>
                <br />
                You can open these directly in Microsoft Excel or drag them into Google Drive.
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card-subtle)',
              padding: 14,
              borderRadius: 10,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa', fontWeight: 700, fontSize: '0.82rem', marginBottom: 6 }}>
                <Cloud size={16} />
                <span>Supabase Multi-PC Sync</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                To synchronize records between different computers or staff members, configure your Supabase Project URL and API Key in <strong>Settings</strong>. When online, click <strong>Sync Database</strong> to keep all PCs updated.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Official Usage Instructions */}
      {(activeSection === 'all' || activeSection === 'instructions') && (
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BookOpen size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                    padding: '10px 14px',
                    borderRadius: 8,
                    borderLeft: '3px solid var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
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
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Calculator size={18} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Waterfall Schedule & Advance Allocation Logic
            </h3>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
            The tracker calculates monthly amortization according to the banking/real estate waterfall method:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--accent-emerald)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>1. Cascade Allocation</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                When an installment payment is received (e.g. ₱30,000 for a ₱10,000/mo contract), it is allocated to the earliest unpaid scheduled months first. This immediately clears Month 1, Month 2, and Month 3 as PAID.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--accent-gold)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>2. Partial Payments</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                If a buyer pays less than the full monthly amortization, the month is marked as <strong>PARTIAL</strong>. Any subsequent payment automatically satisfies the remaining balance for that month before moving to the next.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--accent-cyan)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>3. Down Payment Recalculation</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                When a Down Payment is recorded, the remaining balance is reduced, and future monthly amortization amounts are automatically recomputed based on the remaining term.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Penalty Rules */}
      {(activeSection === 'all' || activeSection === 'penalties') && (
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ShieldAlert size={18} color="var(--accent-rose)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Penalty Rules & Overdue Calculations
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {PENALTY_RULES.map((rule, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card-subtle)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  borderLeft: '3px solid var(--accent-rose)',
                  fontSize: '0.78rem',
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
            padding: 12,
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            lineHeight: 1.45
          }}>
            <strong style={{ color: '#fb7185' }}>Legal Note: </strong>
            Penalty calculations are tracking terms configured for this project. Ensure your signed contracts reflect these terms in accordance with Philippine real estate and Maceda Law (R.A. 6552) guidelines.
          </div>
        </div>
      )}

      {/* 5. Receipts & SOA Printing Guide */}
      {(activeSection === 'all' || activeSection === 'printing') && (
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Printer size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Printing Official Receipts & Statements of Account (SOA)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <div style={{ background: 'var(--bg-card-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={15} color="var(--accent-cyan)" />
                <span>Official Receipt (2 Slips per Sheet)</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Each receipt printout formats two identical slips: <strong>Original Customer Copy</strong> and <strong>Accounting File Copy</strong>. It automatically includes your company logo, official receipt number, buyer name, lot details, payment breakdown, words-in-words currency, and authorized signature.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={15} color="var(--accent-emerald)" />
                <span>Statement of Account (SOA)</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Generated from the Account Detail page. Displays contract summary, down payment status, amortized monthly installments, payment history, and running balance. You can filter by date range or specific period before printing.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={15} color="var(--accent-gold)" />
                <span>Built-in Desktop Print Preview</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Bypasses broken native Windows/Chromium print preview dialogs. Features interactive zoom (50% to 150%, Fit to Width, 100%), slip navigation, and a direct print trigger that immediately sends formatted documents to your physical printer or Microsoft Print to PDF.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* App Preferences & Welcome Dialog */}
      <div className="glass-card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: '0.86rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Startup Preferences
        </h3>
        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 10 }}>
          Re-enable the initial feature introduction popup if you wish to see the system overview again.
        </p>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            localStorage.removeItem('land_amortization_hide_welcome');
            alert('Welcome popup will appear the next time the app starts.');
          }}
        >
          Reset Welcome Popup
        </button>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '16px 20px',
        fontSize: '0.76rem',
        color: 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        <div>Land Amortization Tracker • Windows Desktop Edition v1.0.0</div>
        <div>Developed by <strong style={{ color: 'var(--text-secondary)' }}>Gezyne-Jamir Software Tech</strong></div>
      </div>
    </div>
  );
}
export default HelpPage;
