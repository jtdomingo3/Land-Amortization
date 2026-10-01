import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import logoImg from '../assets/logo.png';
import { ShieldCheck, Zap, FileSpreadsheet, CloudUpload, Check } from 'lucide-react';

export function WelcomeModal({ isOpenManual, onCloseManual }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpenManual !== undefined) {
      setIsOpen(isOpenManual);
      return;
    }
    // Check if user previously opted to hide welcome modal
    try {
      const hide = localStorage.getItem('land_amortization_hide_welcome');
      if (hide !== 'true') {
        setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    }
  }, [isOpenManual]);

  const handleClose = () => {
    try {
      localStorage.setItem('land_amortization_hide_welcome', 'true');
    } catch (e) {
      console.warn('Could not save preference', e);
    }
    setIsOpen(false);
    if (onCloseManual) onCloseManual();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Welcome to Land Amortization Tracker"
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={handleClose}
          style={{ padding: '12px', fontSize: '0.94rem' }}
        >
          Get Started
        </button>
      }
    >
      <div style={{ textAlign: 'center', padding: '6px 0 12px 0' }}>
        <img
          src={logoImg}
          alt="Land Amortization Tracker Logo"
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            objectFit: 'contain',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)',
            marginBottom: 12
          }}
        />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
          Welcome to Land Amortization Tracker
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 16 }}>
          Your offline land installment manager and Excel tracker companion.
        </p>

        {/* Feature Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 10, background: 'var(--bg-card-subtle)', padding: '10px 12px', borderRadius: 8 }}>
            <ShieldCheck size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>100% Offline Storage</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                All accounts, payments, and schedules are stored securely on your device. No internet required.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, background: 'var(--bg-card-subtle)', padding: '10px 12px', borderRadius: 8 }}>
            <Zap size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Advance Payment Waterfall</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Automatically applies payments to earliest due months, tracks missed months, and calculates penalties.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, background: 'var(--bg-card-subtle)', padding: '10px 12px', borderRadius: 8 }}>
            <CloudUpload size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Share to Google Drive</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Export 5-sheet tabular `.xlsx` files and upload directly to Google Sheets using Android's native share.
              </div>
            </div>
          </div>
        </div>

        {/* Checkbox: Don't show again */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          userSelect: 'none',
          marginBottom: 10
        }}>
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={e => setDontShowAgain(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
          />
          <span>Don't show this welcome message again</span>
        </label>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Developed by <strong>Gezyne-Jamir Software Tech</strong>
        </div>
      </div>
    </Modal>
  );
}
