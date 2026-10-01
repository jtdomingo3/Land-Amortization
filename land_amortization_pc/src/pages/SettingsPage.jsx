import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  getCompanySettings,
  saveCompanySettings,
  loadSampleCompany,
  fileToBase64,
  DEFAULT_COMPANY
} from '../print/companyConfig.js';
import {
  Building2,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Image as ImageIcon,
  PenTool,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Terminal,
  Cloud
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncWithSupabase,
  SUPABASE_SQL_SCHEMA
} from '../services/supabaseSync.js';

export function SettingsPage() {
  const { resetSample, clearAll, refreshData, setActiveTab } = useApp();

  const [form, setForm] = useState(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success'|'error', message: '' }
  const [isDataActionLoading, setIsDataActionLoading] = useState(false);

  // Supabase Cloud Sync State
  const [sbConfig, setSbConfig] = useState(getSupabaseConfig);
  const [sbNotice, setSbNotice] = useState(null);
  const [isTestingSb, setIsTestingSb] = useState(false);
  const [isSyncingSb, setIsSyncingSb] = useState(false);
  const [showSbKey, setShowSbKey] = useState(false);
  const [showSbUrl, setShowSbUrl] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

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
    if (confirm('Load default company details from environment configuration? Any unsaved edits will be replaced.')) {
      try {
        const sample = await loadSampleCompany(true);
        setForm(sample);
        setSaveStatus({ type: 'success', message: 'Default company data loaded successfully!' });
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

  const handleSaveSbConfig = () => {
    saveSupabaseConfig(sbConfig);
    setSbNotice({ type: 'success', message: 'Supabase credentials saved successfully!' });
    setTimeout(() => setSbNotice(null), 4000);
  };

  const handleTestSb = async () => {
    saveSupabaseConfig(sbConfig);
    setIsTestingSb(true);
    setSbNotice(null);
    try {
      const res = await testSupabaseConnection();
      if (res.success) {
        setSbNotice({ type: 'success', message: 'Connection test passed! Supabase is reachable and ready.' });
      } else {
        setSbNotice({ type: 'error', message: res.message });
        if (res.needsMigration) setShowSchema(true);
      }
    } catch (e) {
      setSbNotice({ type: 'error', message: e.message });
    } finally {
      setIsTestingSb(false);
    }
  };

  const handleSyncSb = async () => {
    saveSupabaseConfig(sbConfig);
    setIsSyncingSb(true);
    setSbNotice(null);
    try {
      const res = await syncWithSupabase();
      if (res.success) {
        setSbNotice({ type: 'success', message: res.message });
        setSbConfig(getSupabaseConfig());
        await refreshData();
      } else {
        setSbNotice({ type: 'error', message: res.message });
      }
    } catch (e) {
      setSbNotice({ type: 'error', message: e.message });
    } finally {
      setIsSyncingSb(false);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
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
          title="Reset to default company configuration"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Sparkles size={14} color="var(--accent-cyan)" />
          <span>Load Default</span>
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
              placeholder="e.g. Acme Land Development & Realty"
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
              placeholder="e.g. 123 Business Avenue, Suite 400, Metro City"
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
                placeholder="e.g. (02) 8123-4567 / 0917-000-0000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={form.company_email}
                onChange={e => handleChange('company_email', e.target.value)}
                placeholder="e.g. info@company.com"
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
                placeholder="e.g. Juan Dela Cruz, CPA"
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

      {/* 3.5 Supabase Cloud Synchronization */}
      <div className="glass-card" style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cloud size={22} color="var(--accent-emerald)" />
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em'
              }}>
                Supabase Cloud Database & Mobile Sync
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Connect this PC application to Supabase PostgreSQL so your mobile Android app stays synchronized.
              </p>
            </div>
          </div>
          {sbConfig.lastSyncedAt && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '3px 8px', borderRadius: 6 }}>
              Last Synced: {new Date(sbConfig.lastSyncedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {sbNotice && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 14,
            fontSize: '0.8rem',
            fontWeight: 500,
            background: sbNotice.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            color: sbNotice.type === 'success' ? 'var(--accent-emerald)' : '#fb7185',
            border: `1px solid ${sbNotice.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`
          }}>
            {sbNotice.message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.76rem' }}>Supabase Project URL</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showSbUrl ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: 36 }}
                placeholder="https://your-project-id.supabase.co"
                value={sbConfig.url}
                onChange={e => setSbConfig(prev => ({ ...prev, url: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowSbUrl(!showSbUrl)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                title={showSbUrl ? 'Hide Project URL' : 'Show Project URL'}
              >
                {showSbUrl ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.76rem' }}>Supabase API Key</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showSbKey ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: 36 }}
                placeholder="sb_publishable_... or API key"
                value={sbConfig.key}
                onChange={e => setSbConfig(prev => ({ ...prev, key: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowSbKey(!showSbKey)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                title={showSbKey ? 'Hide API Key' : 'Show API Key'}
              >
                {showSbKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSaveSbConfig}
            >
              <Save size={14} />
              <span>Save Credentials</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleTestSb}
              disabled={isTestingSb}
            >
              <CheckCircle2 size={14} color="var(--accent-emerald)" />
              <span>{isTestingSb ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSyncSb}
              disabled={isSyncingSb}
            >
              <RefreshCw size={14} className={isSyncingSb ? 'animate-spin' : ''} />
              <span>{isSyncingSb ? 'Syncing...' : 'Sync Database Now'}</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSchema(!showSchema)}
          >
            <Terminal size={14} />
            <span>{showSchema ? 'Hide SQL Schema' : 'Supabase SQL Schema'}</span>
          </button>
        </div>

        {showSchema && (
          <div style={{
            marginTop: 14,
            padding: 12,
            background: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Run this in your Supabase SQL Editor to initialize tables:
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopySchema}
                style={{ fontSize: '0.72rem', padding: '3px 8px' }}
              >
                <Copy size={13} />
                <span>{copiedSchema ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              background: '#090d16',
              color: '#34d399',
              padding: 12,
              borderRadius: 6,
              overflowX: 'auto',
              maxHeight: 220
            }}>
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        )}
      </div>

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

      {/* 5. User Guide Quick Link Banner */}
      <div className="glass-card" style={{
        marginTop: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0
          }}>
            <HelpCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Looking for System Usage & Calculation Rules?
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Detailed waterfall calculation logic, penalty rules, official usage instructions, and print guides are located in the User Guide tab.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setActiveTab('help')}
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>Open User Guide</span>
        </button>
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
