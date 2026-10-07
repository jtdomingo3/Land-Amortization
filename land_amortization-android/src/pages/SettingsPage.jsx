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
  PenTool,
  Eye,
  EyeOff,
  Terminal,
  Copy,
  RefreshCw,
  Bell,
  BellRing,
  BellOff
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncWithSupabase,
  SUPABASE_SQL_SCHEMA
} from '../services/supabaseSync.js';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  openSystemNotificationSettings,
  sendLocalNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  triggerNotificationAlerts
} from '../services/notificationService.js';
import { formatLastSync } from '../utils/formatters.js';

export function SettingsPage({ defaultOpenHelp = false }) {
  const { resetSample, clearAll, refreshData, showConfirm, showAlert, showToast, accounts } = useApp();

  const [form, setForm] = useState(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success'|'error', message: '' }
  const [isHelpOpen, setIsHelpOpen] = useState(defaultOpenHelp);
  const [isDataActionLoading, setIsDataActionLoading] = useState(false);

  // Supabase Configuration State
  const [sbConfig, setSbConfig] = useState(getSupabaseConfig);
  const [sbNotice, setSbNotice] = useState(null);
  const [isTestingSb, setIsTestingSb] = useState(false);
  const [isSyncingSb, setIsSyncingSb] = useState(false);
  const [showSbKey, setShowSbKey] = useState(false);
  const [showSbUrl, setShowSbUrl] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Notification Settings State
  const [notifPerm, setNotifPerm] = useState({ granted: false });
  const [notifPrefs, setNotifPrefs] = useState(getNotificationPreferences);
  const [isTestingNotif, setIsTestingNotif] = useState(false);
  const [isTriggeringNotif, setIsTriggeringNotif] = useState(false);
  const [notifNotice, setNotifNotice] = useState(null);

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
    const confirmed = await showConfirm({
      title: 'Load Default Company Details?',
      message: 'Load default company details from configuration? Any unsaved edits will be replaced.',
      confirmText: 'Load Defaults',
      type: 'warning'
    });
    if (confirmed) {
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
      await showAlert({ title: 'File Too Large', message: 'Logo image should be under 2MB.', type: 'warning' });
      return;
    }
    try {
      const b64 = await fileToBase64(file);
      handleChange('company_logo', b64);
    } catch (err) {
      await showAlert({ title: 'Upload Failed', message: 'Failed to read logo image: ' + err.message, type: 'danger' });
    }
  };

  const handleEsigFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      await showAlert({ title: 'File Too Large', message: 'Signature image should be under 2MB.', type: 'warning' });
      return;
    }
    try {
      const b64 = await fileToBase64(file);
      handleChange('signatory_esig', b64);
    } catch (err) {
      await showAlert({ title: 'Upload Failed', message: 'Failed to read signature image: ' + err.message, type: 'danger' });
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

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 3000);
    } catch {
      alert('Failed to copy schema to clipboard.');
    }
  };

  const handleResetSampleAccounts = async () => {
    const confirmed = await showConfirm({
      title: 'Reset to Demo Sample Data?',
      message: 'Reset accounts and payments to demo sample data? This will overwrite existing accounts.',
      details: 'This will restore default sample buyers (Juan Dela Cruz, Pedro Santos, etc.) into your local database.',
      confirmText: 'Reset Demo Data',
      type: 'warning'
    });
    if (confirmed) {
      setIsDataActionLoading(true);
      try {
        await resetSample();
        showToast('Demo sample accounts restored successfully', 'success');
      } catch (err) {
        await showAlert({ title: 'Reset Failed', message: 'Reset failed: ' + err.message, type: 'danger' });
      } finally {
        setIsDataActionLoading(false);
      }
    }
  };

  const handleClearAllData = async () => {
    const confirmed = await showConfirm({
      title: 'Clear All Accounts & Payments?',
      message: 'This will permanently delete ALL accounts and payment records from the local database.',
      details: 'This action cannot be undone. All customer profiles, payments, and schedule ledgers will be permanently deleted.',
      confirmText: 'Delete All Data',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (confirmed) {
      setIsDataActionLoading(true);
      try {
        await clearAll();
        showToast('All database accounts and payments cleared', 'success');
      } catch (err) {
        await showAlert({ title: 'Clear Failed', message: 'Clear failed: ' + err.message, type: 'danger' });
      } finally {
        setIsDataActionLoading(false);
      }
    }
  };

  // Notification Permission & Action Handlers
  useEffect(() => {
    checkNotificationPermission().then(setNotifPerm);
  }, []);

  const handleRequestNotifPermission = async () => {
    try {
      await requestNotificationPermission();
      const updated = await checkNotificationPermission();
      setNotifPerm(updated);
      if (updated.granted) {
        setNotifNotice({ type: 'success', message: 'Notification permission granted! Overdue payment alerts are active.' });
      } else {
        setNotifNotice({ type: 'warning', message: 'Permission not granted. Opening phone notification settings...' });
        await openSystemNotificationSettings();
      }
    } catch (e) {
      setNotifNotice({ type: 'error', message: 'Permission error: ' + e.message });
    }
    setTimeout(() => setNotifNotice(null), 5000);
  };

  const handleSendTestNotification = async () => {
    setIsTestingNotif(true);
    try {
      const perm = await checkNotificationPermission();
      if (!perm.granted) {
        await requestNotificationPermission();
      }
      await sendLocalNotification({
        id: 999,
        title: '🔔 Test Alert: Land Amortization Tracker',
        message: 'Phone notifications are working properly! Overdue and due payment alerts will appear here.',
        type: 'overdue',
        subText: 'System Test'
      });
      setNotifNotice({ type: 'success', message: 'Test notification sent! Check your phone notification tray.' });
    } catch (e) {
      setNotifNotice({ type: 'error', message: 'Failed to send notification: ' + e.message });
    } finally {
      setIsTestingNotif(false);
      setTimeout(() => setNotifNotice(null), 5000);
    }
  };

  const handleTriggerActiveAlerts = async () => {
    setIsTriggeringNotif(true);
    try {
      const perm = await checkNotificationPermission();
      if (!perm.granted) {
        await requestNotificationPermission();
      }
      const res = await triggerNotificationAlerts(accounts || [], { force: true });
      if (res.sent > 0) {
        setNotifNotice({ type: 'success', message: `Dispatched ${res.sent} active payment alert(s) to phone status bar!` });
      } else {
        setNotifNotice({ type: 'info', message: 'No overdue or due accounts currently require phone alerts.' });
      }
    } catch (e) {
      setNotifNotice({ type: 'error', message: 'Alert trigger error: ' + e.message });
    } finally {
      setIsTriggeringNotif(false);
      setTimeout(() => setNotifNotice(null), 5000);
    }
  };

  const handleTogglePref = (key) => {
    const updated = saveNotificationPreferences({ [key]: !notifPrefs[key] });
    setNotifPrefs({ ...updated });
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
          title="Reset to default Cortez Land details"
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
              placeholder="e.g. CORTEZ LAND AMORTIZATION COLLECTION TRACKER"
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
              placeholder="e.g. Purok 2, Brgy. Sta. Elena (Poblacion) Sta. Elena, Camarines Norte"
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
                placeholder="e.g. 0935-3551416"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={form.company_email}
                onChange={e => handleChange('company_email', e.target.value)}
                placeholder="e.g. artjrbarbasa@yahoo.com"
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
                placeholder="e.g. ARTEMIO TEDOCO-BARBASA"
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cloud size={22} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                margin: 0
              }}>
                Supabase Cloud Database & Sync
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Connect this mobile app to Supabase PostgreSQL to keep your accounts and payments in sync with PC.
              </p>
            </div>
          </div>
          {sbConfig.lastSyncedAt && (
            <span style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 6, fontWeight: 600, alignSelf: 'flex-start' }}>
              Last Synced: {formatLastSync(sbConfig.lastSyncedAt)}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.76rem' }}>Supabase Project URL</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showSbUrl ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: 36, width: '100%', boxSizing: 'border-box' }}
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
                  cursor: 'pointer',
                  padding: 4
                }}
                title={showSbUrl ? 'Hide Project URL' : 'Show Project URL'}
              >
                {showSbUrl ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.76rem' }}>Supabase API Key (Anon / Publishable)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showSbKey ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: 36, width: '100%', boxSizing: 'border-box' }}
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
                  cursor: 'pointer',
                  padding: 4
                }}
                title={showSbKey ? 'Hide API Key' : 'Show API Key'}
              >
                {showSbKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSaveSbConfig}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={14} />
              <span>Save</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleTestSb}
              disabled={isTestingSb}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={14} color="var(--accent-emerald)" />
              <span>{isTestingSb ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSyncSb}
              disabled={isSyncingSb}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={isSyncingSb ? 'animate-spin' : ''} />
              <span>{isSyncingSb ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSchema(!showSchema)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Terminal size={14} />
            <span>{showSchema ? 'Hide SQL' : 'SQL Schema'}</span>
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
                Run in Supabase SQL Editor:
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

      {/* 3.8 Phone Notifications & Overdue Reminders */}
      <div className="glass-card" style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(245, 158, 11, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-rose)',
              flexShrink: 0
            }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                margin: 0
              }}>
                Phone Notifications & Overdue Reminders
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Receive heads-up status bar alerts for overdue amortizations, 2+ missed months (10% penalty), and payments due today.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {notifPerm.granted ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 10px',
                borderRadius: 99,
                fontSize: '0.74rem',
                fontWeight: 700
              }}>
                <CheckCircle2 size={13} />
                Access Granted
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleRequestNotifPermission}
                style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              >
                <BellRing size={14} />
                Grant Phone Access
              </button>
            )}
          </div>
        </div>

        {/* Notice Banner */}
        {notifNotice && (
          <div style={{
            padding: '10px 12px',
            borderRadius: 8,
            marginBottom: 12,
            background: notifNotice.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : notifNotice.type === 'warning' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${notifNotice.type === 'success' ? 'var(--accent-emerald)' : notifNotice.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-rose)'}`,
            color: notifNotice.type === 'success' ? 'var(--accent-emerald-light)' : notifNotice.type === 'warning' ? 'var(--accent-amber)' : '#fb7185',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Info size={15} style={{ flexShrink: 0 }} />
            <span>{notifNotice.message}</span>
          </div>
        )}

        {/* Notification Preferences Checklist */}
        <div style={{
          background: 'var(--bg-card-subtle)',
          borderRadius: 10,
          border: '1px solid var(--border-subtle)',
          padding: '12px 14px',
          marginBottom: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Enable Payment Alerts
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Allow this app to schedule and post payment reminders to your phone status bar.
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(notifPrefs.enabled)}
              onChange={() => handleTogglePref('enabled')}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
            />
          </label>

          <div style={{ height: 1, background: 'var(--border-subtle)' }} />

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', opacity: notifPrefs.enabled ? 1 : 0.5 }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Overdue & Delinquency Alerts
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Notifies when accounts have unpaid amortizations or 2+ consecutive missed months (10% penalty).
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!notifPrefs.enabled}
              checked={Boolean(notifPrefs.overdueAlerts)}
              onChange={() => handleTogglePref('overdueAlerts')}
              style={{ width: 17, height: 17, accentColor: 'var(--accent-rose)', cursor: 'pointer' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', opacity: notifPrefs.enabled ? 1 : 0.5 }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Down Payment Overdue Alerts
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Notifies when agreed down payment due date passes without payment (1% contract penalty).
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!notifPrefs.enabled}
              checked={Boolean(notifPrefs.dpOverdueAlerts !== false)}
              onChange={() => handleTogglePref('dpOverdueAlerts')}
              style={{ width: 17, height: 17, accentColor: '#ea580c', cursor: 'pointer' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', opacity: notifPrefs.enabled ? 1 : 0.5 }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Payment Due Today Alerts
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Notifies on the morning of scheduled amortization due dates.
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!notifPrefs.enabled}
              checked={Boolean(notifPrefs.dueTodayAlerts)}
              onChange={() => handleTogglePref('dueTodayAlerts')}
              style={{ width: 17, height: 17, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSendTestNotification}
            disabled={isTestingNotif}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Bell size={14} color="var(--accent-cyan)" />
            <span>{isTestingNotif ? 'Sending...' : 'Send Test Alert'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleTriggerActiveAlerts}
            disabled={isTriggeringNotif}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <RefreshCw size={14} color="var(--accent-emerald)" className={isTriggeringNotif ? 'animate-spin' : ''} />
            <span>{isTriggeringNotif ? 'Checking...' : 'Check Alerts Now'}</span>
          </button>

          {!notifPerm.granted && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={openSystemNotificationSettings}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.74rem' }}
            >
              <span>System Settings</span>
            </button>
          )}
        </div>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
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
