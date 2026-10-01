import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import {
  Cloud,
  Folder,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Upload,
  Link,
  Smartphone
} from 'lucide-react';
import {
  getGoogleDriveConfig,
  saveGoogleDriveConfig,
  disconnectGoogleDrive,
  openGoogleDriveFolder,
  uploadToGoogleDrive
} from '../services/googleDriveService.js';
import { shareToGoogleDrive } from '../share/shareFile.js';

export function GoogleDriveModal({ isOpen, onClose, accounts = [], payments = [], fileName = '' }) {
  const [config, setConfig] = useState(getGoogleDriveConfig());
  const [folderUrl, setFolderUrl] = useState('');
  const [folderName, setFolderName] = useState('Amortization Tracker Backups');
  const [userEmail, setUserEmail] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionResult, setActionResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const cfg = getGoogleDriveConfig();
      setConfig(cfg);
      setFolderUrl(cfg.folderUrl || '');
      setFolderName(cfg.folderName || 'Amortization Tracker Backups');
      setUserEmail(cfg.userEmail || '');
      setWebhookUrl(cfg.webhookUrl || '');
      setErrorMsg('');
      setStatusMessage('');
      setActionResult(null);
    }
  }, [isOpen]);

  const handleSaveSettings = () => {
    const updated = saveGoogleDriveConfig({
      folderUrl: folderUrl.trim(),
      folderName: folderName.trim() || 'Amortization Tracker Backups',
      userEmail: userEmail.trim(),
      webhookUrl: webhookUrl.trim()
    });
    setConfig(updated);
    setStatusMessage('Settings saved successfully.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleClearSettings = () => {
    disconnectGoogleDrive();
    const clean = getGoogleDriveConfig();
    setConfig(clean);
    setFolderUrl('');
    setUserEmail('');
    setWebhookUrl('');
    setActionResult(null);
    setStatusMessage('Settings cleared.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleOpenFolderLink = () => {
    openGoogleDriveFolder(folderUrl);
  };

  const handleSaveToDrive = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    setStatusMessage('Saving backup and opening Google Drive...');
    setActionResult(null);

    try {
      // Auto-save any folder URL entered
      saveGoogleDriveConfig({
        folderUrl: folderUrl.trim(),
        folderName: folderName.trim() || 'Amortization Tracker Backups',
        userEmail: userEmail.trim(),
        webhookUrl: webhookUrl.trim()
      });

      // 1. If webhook configured, upload directly
      if (webhookUrl.trim()) {
        const res = await uploadToGoogleDrive(accounts, payments, fileName, (msg) => {
          setStatusMessage(msg);
        });
        setActionResult(res);
        setStatusMessage('');
        return;
      }

      // 2. Standard Mobile/Web Google Drive Launch
      const res = await shareToGoogleDrive(accounts, payments, fileName);
      setActionResult(res);
      setStatusMessage('');
    } catch (err) {
      console.error('Google Drive error:', err);
      setErrorMsg(err.message || 'Failed to save to Google Drive.');
      setStatusMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  const modalFooter = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 10 }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={handleSaveSettings}
      >
        Save Settings
      </button>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClose}
        >
          Close
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #4285F4, #34A853)' }}
          onClick={handleSaveToDrive}
          disabled={isProcessing}
        >
          <Upload size={14} />
          {isProcessing ? 'Saving...' : 'Save to Google Drive Now'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Drive Cloud Backup"
      footer={modalFooter}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Mobile App Direct Connect Banner */}
        <div style={{
          background: 'rgba(66, 133, 244, 0.08)',
          border: '1px solid rgba(66, 133, 244, 0.25)',
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa', fontWeight: 700, fontSize: '0.86rem' }}>
            <Smartphone size={18} />
            <span>Mobile 1-Tap Google Drive Integration</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            No developer API keys or token setup needed! Tapping <strong>Save to Google Drive Now</strong> automatically connects with your logged-in Google account on your phone and opens the Google Drive folder selector.
          </div>
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {statusMessage && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: 'var(--accent-cyan)',
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <RefreshCw size={14} className="spin-slow" />
            <span>{statusMessage}</span>
          </div>
        )}

        {actionResult && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 8,
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: 6 }}>
              <CheckCircle2 size={18} />
              <span>Google Drive Connected</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
              {actionResult.message || 'Backup file prepared and forwarded to Google Drive.'}
            </div>
            {folderUrl && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleOpenFolderLink}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', padding: '6px 12px' }}
              >
                <ExternalLink size={14} />
                Open Backup Folder in Google Drive
              </button>
            )}
          </div>
        )}

        {/* Option: Google Drive Shared Folder Link */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link size={14} color="var(--accent-cyan)" />
              Google Drive Folder Link (Optional)
            </span>
            {folderUrl && (
              <button
                type="button"
                onClick={handleOpenFolderLink}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                <ExternalLink size={12} />
                Open Folder
              </button>
            )}
          </label>
          <input
            type="url"
            className="form-input"
            placeholder="https://drive.google.com/drive/folders/..."
            value={folderUrl}
            onChange={e => setFolderUrl(e.target.value)}
          />
          <span className="form-helper">
            Paste your shared Google Drive folder link. You can open it anytime with 1 tap to view or manage your backups.
          </span>
        </div>

        {/* Folder Label */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Folder size={14} color="var(--accent-gold)" />
            Target Folder Name
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Amortization Tracker Backups"
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
          />
          <span className="form-helper">
            Suggested folder name for saving backups in your Google Drive.
          </span>
        </div>

        {/* Collapsible Advanced Section for Headless Webhook */}
        <details style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: '8px 12px',
          marginTop: 4
        }}>
          <summary style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: 600,
            userSelect: 'none'
          }}>
            Advanced: Headless Webhook Upload (Optional)
          </summary>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.74rem' }}>
                Google Apps Script Webhook URL
              </label>
              <input
                type="url"
                className="form-input mono"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                style={{ fontSize: '0.75rem' }}
              />
              <span className="form-helper" style={{ fontSize: '0.68rem' }}>
                If provided, uploads will be delivered automatically in the background via this webhook.
              </span>
            </div>
            {config.webhookUrl && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearSettings}
                style={{ fontSize: '0.7rem', color: '#fb7185', alignSelf: 'flex-start' }}
              >
                <LogOut size={12} style={{ marginRight: 4 }} />
                Clear Webhook
              </button>
            )}
          </div>
        </details>
      </div>
    </Modal>
  );
}
