import React from 'react';
import { INSTRUCTIONS, PENALTY_RULES } from '../utils/constants.js';
import { HelpCircle, Shield, WifiOff, Cloud, CheckCircle } from 'lucide-react';

export function HelpPage() {
  return (
    <div className="help-page">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-emerald)'
          }}>
            <HelpCircle size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Instructions & Guide</h2>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              How to use the Land Amortization Tracker
            </div>
          </div>
        </div>
      </div>

      {/* Offline & Architecture Callout */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 10, color: 'var(--accent-emerald-light)', textTransform: 'uppercase' }}>
          Offline-First Architecture
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <WifiOff size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>100% Offline Database: </strong>
              All land accounts, payment records, and amortization waterfall schedules are stored locally in an embedded SQLite database on your device. You can record payments and manage accounts anywhere without internet.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Cloud size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Google Drive Upload: </strong>
              When online, tap "Share to Google Drive" on the Export tab to upload your full 5-sheet `.xlsx` file directly to Google Drive, where it automatically opens and converts into a Google Sheet.
            </div>
          </div>
        </div>
      </div>

      {/* Official 10 Instructions */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 12, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
          Official Usage Instructions
        </h3>

        <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {INSTRUCTIONS.map((instruction, idx) => {
            // Strip leading number since <ol> formats it
            const text = instruction.replace(/^\d+\.\s*/, '');
            return (
              <li key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {text}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Penalty Rules */}
      <div className="glass-card">
        <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 10, color: 'var(--accent-rose)', textTransform: 'uppercase' }}>
          Penalty Rules
        </h3>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PENALTY_RULES.map((rule, idx) => (
            <li key={idx} style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-card-subtle)',
              padding: '8px 12px',
              borderRadius: 6,
              borderLeft: '3px solid var(--accent-rose)',
              lineHeight: 1.4
            }}>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {/* App Preferences & Welcome Dialog */}
      <div className="glass-card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          App Preferences
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          You can re-enable the initial welcome message or view the feature overview again.
        </p>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            localStorage.removeItem('land_amortization_hide_welcome');
            window.location.reload();
          }}
        >
          Reset & Show Welcome Popup on Startup
        </button>
      </div>
    </div>
  );
}
