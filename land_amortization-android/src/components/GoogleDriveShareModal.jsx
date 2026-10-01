import React, { useState } from 'react';
import {
  CloudUpload,
  ExternalLink,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Smartphone,
  Laptop
} from 'lucide-react';

export function GoogleDriveShareModal({ isOpen, onClose, fileName, onShareNative, onDirectDownload, isCordova }) {
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  if (!isOpen) return null;

  const handleOpenGoogleDrive = () => {
    if (onDirectDownload) {
      onDirectDownload();
      setDownloadTriggered(true);
    }
    window.open('https://drive.google.com/drive/my-drive', '_blank');
  };

  const handleOpenGoogleSheets = () => {
    if (onDirectDownload) {
      onDirectDownload();
      setDownloadTriggered(true);
    }
    window.open('https://sheets.new', '_blank');
  };

  const handleNativeShare = async () => {
    if (onShareNative) {
      await onShareNative();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content glass-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: '92%',
          padding: '24px 20px',
          borderRadius: 16,
          background: 'var(--bg-card)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-color)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <CloudUpload size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800 }}>Save to Google Drive</h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Upload 5-sheet report to your Google account
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected File Card */}
        <div style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <FileSpreadsheet size={16} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Export File:
            </span>
          </div>
          <div style={{
            fontSize: '0.82rem',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            wordBreak: 'break-all'
          }}>
            {fileName || 'Land_Amortization_Tracker.xlsx'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Contains 5 sheets: Dashboard, Land Accounts, Payments, Monthly Waterfall & Rules.
          </div>
        </div>

        {/* Android Native vs Web Preview Explanation */}
        {isCordova ? (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 6 }}>
              <Smartphone size={16} />
              <span>How to Save to Google Drive on Android:</span>
            </div>
            <ol style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: 18, margin: 0 }}>
              <li>Tap <strong>Upload to Google Drive</strong> below to open Android's Share menu.</li>
              <li>Select <strong>Google Drive (Save to Drive)</strong> or <strong>Sheets</strong>.</li>
              <li>Choose your account & folder, and tap <strong>Save</strong>.</li>
            </ol>
          </div>
        ) : (
          <div style={{
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 4 }}>
              <Laptop size={16} />
              <span>Google Account Connection</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              To upload to Google Drive without needing developer API keys, tap <strong>Open Google Drive</strong> below. Your file will be saved to your computer, and Google Drive will open so you can drop it straight into your Drive.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
          {isCordova ? (
            <button
              className="btn btn-drive btn-block"
              style={{ padding: '14px', fontSize: '0.96rem' }}
              onClick={handleNativeShare}
            >
              <CloudUpload size={18} />
              Upload to Google Drive (Save to Drive)
            </button>
          ) : (
            <>
              <button
                className="btn btn-drive btn-block"
                style={{ padding: '14px', fontSize: '0.95rem' }}
                onClick={handleOpenGoogleDrive}
              >
                <ExternalLink size={18} />
                Open Google Drive (drive.google.com)
              </button>

              <button
                className="btn btn-secondary btn-block"
                style={{ padding: '12px', fontSize: '0.88rem' }}
                onClick={handleOpenGoogleSheets}
              >
                <FileSpreadsheet size={16} color="var(--accent-emerald)" />
                Open in Google Sheets (sheets.new)
              </button>
            </>
          )}

          <button
            className="btn btn-primary btn-block"
            style={{ padding: '12px', fontSize: '0.88rem' }}
            onClick={() => {
              if (onDirectDownload) onDirectDownload();
              setDownloadTriggered(true);
            }}
          >
            <Download size={16} />
            Download .xlsx File to Storage
          </button>
        </div>

        {downloadTriggered && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: '0.74rem',
            color: 'var(--accent-emerald-light)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <CheckCircle2 size={14} />
            <span>File saved to your Downloads folder!</span>
          </div>
        )}
      </div>
    </div>
  );
}
