import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  getCompanySettings,
  saveCompanySettings,
  loadSampleCompany,
  fileToBase64,
  DEFAULT_COMPANY
} from '../print/companyConfig.js';
import { INSTRUCTIONS, PENALTY_RULES } from '../utils/constants.js';
import {
  Building2,
  FileCheck,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  WifiOff,
  Cloud,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Image as ImageIcon,
  PenTool
} from 'lucide-react';

export function SettingsPage({ defaultOpenHelp = false }) {
  const { resetSample, clearAll } = useApp();

  const [form, setForm] = useState(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success'|'error', message: '' }
  const [isHelpOpen, setIsHelpOpen] = useState(defaultOpenHelp);
  const [isDataActionLoading, setIsDataActionLoading] = useState(false);

  const logoInputRef = useRef(null);
  const esigInputRef = useRef(null);

  // Load existing settings
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getCompanySettings();
        if (isMounted) {
          setForm(data);
          setLoading(false);
        }
      } catch (e) {
        console.error('Error loading company settings:', e);
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setSaveStatus(null);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      await saveCompanySettings(form);
      setSaveStatus({ type: 'success', message: 'Settings saved successfully! Receipts and SOA will reflect these changes.' });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      setSaveStatus({ type: 'error', message: 'Failed to save settings: ' + err.message });
    }
  };

  const handleLoadSample = async () => {
    if (confirm('Load sample company details (Angeles Land Development Inc.)? Any unsaved edits will be replaced.')) {
      try {
        const sample = await loadSampleCompany(true);
        setForm(sample);
        setSaveStatus({ type: 'success', message: 'Sample company data loaded successfully!' });
        setTimeout(() => setSaveStatus(null), 4000);
      } catch (err) {
        setSaveStatus({ type: 'error', message: 'Failed to load sample: ' + err.message });
      }
    }
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image should be under 2MB.');
      return;
    }
    try {
      const b64 = await fileToBase64(file);
      handleChange('company_logo', b64);
    } catch (err) {
      alert('Failed to read logo image: ' + err.message);
    }
  };

  const handleEsigFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Signature image should be under 2MB.');
      return;
    }
    try {
      const b64 = await fileToBase64(file);
      handleChange('signatory_esig', b64);
    } catch (err) {
      alert('Failed to read signature image: ' + err.message);
    }
  };

  const handleResetSampleAccounts = async () => {
    if (confirm('Reset accounts and payments to demo sample data? This will overwrite existing accounts.')) {
      setIsDataActionLoading(true);
      try {
        await resetSample();
        setSaveStatus({ type: 'success', message: 'Demo sample accounts restored successfully.' });
      } catch (err) {
        alert('Reset failed: ' + err.message);
      } finally {
        setIsDataActionLoading(false);
      }
    }
  };

  const handleClearAllData = async () => {
    if (confirm('⚠️ WARNING: This will permanently delete ALL accounts and payments. Are you absolutely sure?')) {
      setIsDataActionLoading(true);
      try {
        await clearAll();
        setSaveStatus({ type: 'success', message: 'All database accounts and payments cleared.' });
      } catch (err) {
        alert('Clear failed: ' + err.message);
      } finally {
        setIsDataActionLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div className="settings-page" style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Page Header */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(2,132,199,0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-emerald)'
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>App & Company Settings</h2>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Configure company information for Receipts and Statement of Account (SOA)
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleLoadSample}
          title="Populate with sample Angeles Land Development details"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Sparkles size={14} color="var(--accent-cyan)" />
          <span>Load Sample</span>
        </button>
      </div>

      {/* Notification Toast */}
      {saveStatus && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: saveStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${saveStatus.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
          color: saveStatus.type === 'success' ? 'var(--accent-emerald-light)' : '#fb7185',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'fadeIn 0.2s ease'
        }}>
          {saveStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* 1. Company Information */}
        <div className="glass-card">
          <h3 style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            marginBottom: 12,
            color: 'var(--accent-emerald-light)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Company Information
          </h3>

          <div className="form-group">
            <label className="form-label">Company / Developer Name *</label>
            <input
              type="text"
              className="form-input"
              value={form.company_name}
              onChange={e => handleChange('company_name', e.target.value)}
              placeholder="e.g. Angeles Land Development Inc."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Office Address</label>
            <input
              type="text"
              className="form-input"
              value={form.company_address}
              onChange={e => handleChange('company_address', e.target.value)}
              placeholder="e.g. Sta Elena, Camarines Norte"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                className="form-input"
                value={form.company_contact}
                onChange={e => handleChange('company_contact', e.target.value)}
                placeholder="e.g. (043) 555-1234"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={form.company_email}
                onChange={e => handleChange('company_email', e.target.value)}
                placeholder="e.g. info@angelesland.ph"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tax Identification No. (TIN)</label>
            <input
              type="text"
              className="form-input mono"
              value={form.company_tin}
              onChange={e => handleChange('company_tin', e.target.value)}
              placeholder="e.g. 123-456-789-000"
            />
          </div>
        </div>

        {/* 2. Branding (Company Logo) */}
        <div className="glass-card">
          <h3 style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            marginBottom: 12,
            color: 'var(--accent-cyan)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Company Branding (Logo)
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Logo Preview */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 'var(--radius-md)',
              border: '2px dashed var(--border-subtle)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {form.company_logo ? (
                <img
                  src={form.company_logo}
                  alt="Company Logo Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <ImageIcon size={28} color="var(--text-muted)" />
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="file"
                ref={logoInputRef}
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={handleLogoFileChange}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => logoInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Upload size={14} />
                  <span>{form.company_logo ? 'Change Logo' : 'Upload Logo'}</span>
                </button>
                {form.company_logo && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleChange('company_logo', '')}
                    title="Remove Logo"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Displayed at the top header of Official Receipts and Statement of Account.
              </span>
            </div>
          </div>
        </div>

        {/* 3. Signatory & E-Signature */}
        <div className="glass-card">
          <h3 style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            marginBottom: 12,
            color: 'var(--accent-amber)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Authorized Signatory
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Signatory Full Name</label>
              <input
                type="text"
                className="form-input"
                value={form.signatory_name}
                onChange={e => handleChange('signatory_name', e.target.value)}
                placeholder="e.g. Engr. Roberto Angeles"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Position / Designation</label>
              <input
                type="text"
                className="form-input"
                value={form.signatory_title}
                onChange={e => handleChange('signatory_title', e.target.value)}
                placeholder="e.g. Authorized Managing Officer"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Signature Preview */}
            <div style={{
              width: 130,
              height: 56,
              borderRadius: 'var(--radius-sm)',
              border: '2px dashed var(--border-subtle)',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {form.signatory_esig ? (
                <img
                  src={form.signatory_esig}
                  alt="E-Signature Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  No E-Signature
                </span>
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="file"
                ref={esigInputRef}
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={handleEsigFileChange}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => esigInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <PenTool size={14} />
                  <span>{form.signatory_esig ? 'Change Signature' : 'Upload Signature'}</span>
                </button>
                {form.signatory_esig && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleChange('signatory_esig', '')}
                    title="Remove Signature"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Optional transparent PNG signature image to print above signatory name.
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="btn btn-primary btn-block"
          style={{
            padding: '12px 18px',
            fontSize: '0.94rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
          }}
        >
          <Save size={18} />
          <span>Save Company Settings</span>
        </button>
      </form>

      {/* 4. Data Management Section */}
      <div className="glass-card" style={{ marginTop: 8 }}>
        <h3 style={{
          fontSize: '0.88rem',
          fontWeight: 700,
          marginBottom: 10,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          Database & Demo Management
        </h3>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          Manage local SQLite accounts and payment records on this device.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetSampleAccounts}
            disabled={isDataActionLoading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <RotateCcw size={14} />
            <span>Reset Demo Data</span>
          </button>

          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleClearAllData}
            disabled={isDataActionLoading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Trash2 size={14} />
            <span>Clear All Data</span>
          </button>
        </div>

        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Welcome onboarding popup</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
            onClick={() => {
              localStorage.removeItem('land_amortization_hide_welcome');
              alert('Welcome popup will show upon next reload.');
            }}
          >
            Reset Welcome Popup
          </button>
        </div>
      </div>

      {/* 5. Collapsible Instructions & Usage Guide (Help) */}
      <div className="glass-card">
        <button
          type="button"
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={18} color="var(--accent-emerald)" />
            <div>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Instructions & System Guide
              </span>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Offline architecture, waterfall calculation rules & penalties
              </div>
            </div>
          </div>
          {isHelpOpen ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
        </button>

        {isHelpOpen && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Offline Callout */}
            <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--accent-emerald)' }}>
              <div style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <WifiOff size={16} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>100% Offline SQLite: </strong>
                  Accounts and payments are saved securely in local storage. All waterfall amortization math computes on-device without internet.
                </div>
              </div>
            </div>

            {/* Official Usage Instructions */}
            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 8, textTransform: 'uppercase' }}>
                Usage Instructions
              </h4>
              <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {INSTRUCTIONS.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {item.replace(/^\d+\.\s*/, '')}
                  </li>
                ))}
              </ol>
            </div>

            {/* Penalty Rules */}
            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: 8, textTransform: 'uppercase' }}>
                Penalty Rules
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PENALTY_RULES.map((rule, idx) => (
                  <li key={idx} style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-card-subtle)',
                    padding: '6px 10px',
                    borderRadius: 6,
                    borderLeft: '3px solid var(--accent-rose)',
                    lineHeight: 1.4
                  }}>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}
      </div>

      {/* 6. App Info & Author Footer */}
      <div style={{
        textAlign: 'center',
        padding: '12px 16px',
        fontSize: '0.76rem',
        color: 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        <div>Land Amortization Tracker • Version 1.0.0</div>
        <div>Developed by <strong style={{ color: 'var(--text-secondary)' }}>Gezyne-Jamir Software Tech</strong></div>
      </div>

    </div>
  );
}
export default SettingsPage;
