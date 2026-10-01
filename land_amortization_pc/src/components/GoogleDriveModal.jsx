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
  uploadToGoogleDrive,
  extractFolderId,
  generateAppsScriptCode
} from '../services/googleDriveService.js';
import { shareToGoogleDrive } from '../share/shareFile.js';
import { Copy, Check, Terminal, Play, Sparkles } from 'lucide-react';

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

  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyScript = () => {
    const targetFolderId = extractFolderId(folderUrl) || '1YarYj_0Cjr7dgYp9MU2YYXivjnbdbv1m';
    const code = generateAppsScriptCode(targetFolderId);
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
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
      if (res.method === 'browser_drive_link') {
        res.message = `Workbook "${res.fileName}" downloaded to your computer and Google Drive Backup folder opened. Drag the downloaded file into Google Drive to complete, or use the 1-minute Automated Webhook below to upload directly with zero manual steps!`;
      }
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

        {/* Note on Google Drive Folder Permission */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem' }}>
            <AlertTriangle size={18} />
            <span>Folder Setup: Set "Anyone with the link"</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            To ensure your backup folder accepts saves and is accessible, open your Google Drive folder, click <strong>Share</strong>, and set General Access to <strong>"Anyone with the link"</strong> (Editor or Viewer).
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

        {/* Google Drive Shared Folder Link */}
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link size={14} color="var(--accent-cyan)" />
              Google Drive Folder Link
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setFolderUrl('https://drive.google.com/drive/folders/1YarYj_0Cjr7dgYp9MU2YYXivjnbdbv1m?usp=drive_link')}
                style={{
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
                title="Fill with provided test folder link"
              >
                Insert Test Link
              </button>
              {folderUrl && (
                <button
                  type="button"
                  onClick={handleOpenFolderLink}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-emerald)',
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
            </div>
          </div>
          <input
            type="url"
            className="form-input"
            placeholder="https://drive.google.com/drive/folders/..."
            value={folderUrl}
            onChange={e => setFolderUrl(e.target.value)}
          />
          <span className="form-helper">
            Paste your shared Google Drive folder link. Tapping <strong>Open Folder</strong> verifies your link directly in Google Drive.
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

        {/* 100% Automated Background Upload Card */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.28)',
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#818cf8', fontWeight: 700, fontSize: '0.86rem' }}>
              <Sparkles size={18} />
              <span>100% Automated Background Upload (Zero Clicks)</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyScript}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.72rem',
                padding: '4px 10px',
                background: copiedScript ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                color: copiedScript ? 'var(--accent-emerald)' : '#a5b4fc',
                borderColor: copiedScript ? 'var(--accent-emerald)' : 'rgba(99, 102, 241, 0.3)'
              }}
            >
              {copiedScript ? <Check size={13} /> : <Copy size={13} />}
              {copiedScript ? 'Script Copied!' : 'Copy Automated Upload Script'}
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            To save directly into your Google Drive <strong>Backup</strong> folder with 0 manual steps:
            <ol style={{ margin: '6px 0 0 18px', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Open Google Drive &rarr; Click <strong>+ New &gt; More &gt; Google Apps Script</strong></li>
              <li>Click <strong>Copy Automated Upload Script</strong> above and paste into the editor</li>
              <li>Click <strong>Deploy &gt; New deployment &gt; Web app</strong></li>
              <li>Set <em>"Execute as"</em>: <strong>Me</strong> and <em>"Who has access"</em>: <strong>Anyone</strong> &rarr; Click <strong>Deploy</strong></li>
              <li>Copy the Web App URL and paste below, then click <strong>Save Settings</strong>.</li>
            </ol>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.74rem' }}>
              Google Apps Script Web App URL
            </label>
            <input
              type="url"
              className="form-input mono"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              style={{ fontSize: '0.75rem' }}
            />
          </div>

          {config.webhookUrl && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearSettings}
              style={{ fontSize: '0.7rem', color: '#fb7185', alignSelf: 'flex-start' }}
            >
              <LogOut size={12} style={{ marginRight: 4 }} />
              Disconnect Automated Webhook
            </button>
          )}
        </div>
        {/* Author Credit */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          paddingTop: 4,
          borderTop: '1px solid var(--border-color)'
        }}>
          Land Amortization Tracker • Developed by <strong>Gezyne-Jamir Software Tech</strong>
        </div>
      </div>
    </Modal>
  );
}
