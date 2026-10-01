import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import {
  Cloud,
  Folder,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  LogOut,
  Upload,
  Link,
  Laptop,
  FolderOpen,
  Copy,
  Check,
  Sparkles
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
  const [copiedScript, setCopiedScript] = useState(false);

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
    setStatusMessage('Folder link saved! Future clicks on "Save to Google Drive" will automatically save new files without opening this setup dialog.');
    setTimeout(() => {
      setStatusMessage('');
      if (onClose) onClose();
    }, 2000);
  };

  const handleClearSettings = () => {
    disconnectGoogleDrive();
    const clean = getGoogleDriveConfig();
    setConfig(clean);
    setFolderUrl('');
    setUserEmail('');
    setWebhookUrl('');
    setActionResult(null);
    setStatusMessage('Google Drive configuration cleared.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleOpenFolderLink = () => {
    openGoogleDriveFolder(folderUrl);
  };

  const handleCopyScript = () => {
    const targetFolderId = extractFolderId(folderUrl) || 'YOUR_GOOGLE_DRIVE_FOLDER_ID';
    const code = generateAppsScriptCode(targetFolderId);
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleSaveToDrive = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    setStatusMessage('Saving backup...');
    setActionResult(null);

    try {
      // Auto-save folder configuration
      const updatedConfig = saveGoogleDriveConfig({
        folderUrl: folderUrl.trim(),
        folderName: folderName.trim() || 'Amortization Tracker Backups',
        userEmail: userEmail.trim(),
        webhookUrl: webhookUrl.trim()
      });
      setConfig(updatedConfig);

      // 1. If Webhook URL is set: Upload directly into Google Drive with 0 manual steps
      if (webhookUrl.trim()) {
        const res = await uploadToGoogleDrive(accounts, payments, fileName, (msg) => {
          setStatusMessage(msg);
        });
        setActionResult({
          ...res,
          isUploaded: true,
          message: `Successfully uploaded "${res.fileName}" directly to your Google Drive folder!`
        });
        setStatusMessage('');
        return;
      }

      // 2. Desktop Local Save + Open Google Drive
      const res = await shareToGoogleDrive(accounts, payments, fileName);
      if (res && res.filePath && window.electronAPI?.shell?.showItemInFolder) {
        window.electronAPI.shell.showItemInFolder(res.filePath);
      }
      setActionResult({
        ...res,
        isUploaded: false,
        message: `New file "${res.fileName}" saved to Documents > Amortization Tracker > ExcelFile, and your Google Drive folder opened in your browser. Drag the file from File Explorer into Google Drive to complete, or use the 1-minute Automated Webhook below to upload directly with zero manual clicks!`
      });
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
        Save Folder Link
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
          {isProcessing ? 'Saving...' : 'Save & Open Drive Now'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Drive Cloud Backup Setup"
      footer={modalFooter}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Desktop Workflow Banner */}
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
            <Laptop size={18} />
            <span>Windows Desktop Google Drive Workflow</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Paste your Google Drive folder link below and click <strong>Save Folder Link</strong>. Once saved, clicking <strong>Save to Google Drive</strong> on the main screen will automatically save new files directly to your PC and open Drive without showing this dialog again.
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
            Open your Google Drive folder, click <strong>Share</strong>, and set General Access to <strong>"Anyone with the link"</strong> (Editor or Viewer).
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

        {/* Action result banner */}
        {actionResult && (
          <div style={{
            background: actionResult.isUploaded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.12)',
            border: `1px solid ${actionResult.isUploaded ? 'rgba(16, 185, 129, 0.35)' : 'rgba(59, 130, 246, 0.3)'}`,
            borderRadius: 8,
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: actionResult.isUploaded ? 'var(--accent-emerald)' : 'var(--accent-cyan)', fontWeight: 700, marginBottom: 6 }}>
              <CheckCircle2 size={18} />
              <span>{actionResult.isUploaded ? 'File Uploaded to Google Drive!' : 'Excel File Saved & Google Drive Opened'}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.45 }}>
              {actionResult.message}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {actionResult.filePath && window.electronAPI?.shell?.showItemInFolder && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.electronAPI.shell.showItemInFolder(actionResult.filePath)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  <FolderOpen size={14} color="var(--accent-cyan)" />
                  Show in File Explorer
                </button>
              )}
              {folderUrl && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleOpenFolderLink}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  <ExternalLink size={14} color="var(--accent-emerald)" />
                  Open Backup Folder in Google Drive
                </button>
              )}
            </div>
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
            Paste your Google Drive folder link. Tapping <strong>Open Folder</strong> verifies your link directly in Google Drive.
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
            To upload directly into your Google Drive folder with 0 manual steps:
            <ol style={{ margin: '6px 0 0 18px', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Open Google Drive &rarr; Click <strong>+ New &gt; More &gt; Google Apps Script</strong></li>
              <li>Click <strong>Copy Automated Upload Script</strong> above and paste into the editor</li>
              <li>Click <strong>Deploy &gt; New deployment &gt; Web app</strong></li>
              <li>Set <em>"Execute as"</em>: <strong>Me</strong> and <em>"Who has access"</em>: <strong>Anyone</strong> &rarr; Click <strong>Deploy</strong></li>
              <li>Copy the Web App URL and paste below, then click <strong>Save Folder Link</strong>.</li>
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
export default GoogleDriveModal;
