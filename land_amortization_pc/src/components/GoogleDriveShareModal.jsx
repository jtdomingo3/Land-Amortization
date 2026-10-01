import React, { useState } from 'react';
import {
  CloudUpload,
  ExternalLink,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Smartphone,
  Laptop,
  FolderOpen,
  Folder,
  Globe,
  Sparkles
} from 'lucide-react';
import { getGoogleDriveConfig } from '../services/googleDriveService.js';

export function GoogleDriveShareModal({ isOpen, onClose, fileName, onShareNative, onDirectDownload, isCordova }) {
  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const [savedFileInfo, setSavedFileInfo] = useState(null);
  const [statusNotice, setStatusNotice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Helper to ensure file is saved to My Documents > Amortization Tracker > ExcelFile
  const ensureFileSaved = async () => {
    if (savedFileInfo && savedFileInfo.filePath) {
      return savedFileInfo;
    }
    if (onDirectDownload) {
      setIsProcessing(true);
      try {
        const res = await onDirectDownload();
        if (res) {
          setSavedFileInfo(res);
          setDownloadTriggered(true);
          return res;
        }
      } catch (e) {
        console.warn('Error saving file:', e);
      } finally {
        setIsProcessing(false);
      }
    }
    return null;
  };

  const handleOpenGoogleDrive = async () => {
    const fileRes = await ensureFileSaved();
    const config = getGoogleDriveConfig();
    const targetUrl = (config && config.folderUrl && config.folderUrl.trim())
      ? config.folderUrl.trim()
      : 'https://drive.google.com/drive/my-drive';

    try {
      if (typeof window !== 'undefined' && window.electronAPI?.shell?.openExternal) {
        await window.electronAPI.shell.openExternal(targetUrl);
      } else {
        window.open(targetUrl, '_blank');
      }
      setStatusNotice('Google Drive opened in your web browser! Drag and drop your saved Excel file into your Google Drive folder.');
    } catch (err) {
      console.warn('Could not open drive url:', err);
      window.open(targetUrl, '_blank');
    }
  };

  const handleOpenInExcel = async () => {
    const fileRes = await ensureFileSaved();
    const path = fileRes?.filePath || savedFileInfo?.filePath;
    if (path && window.electronAPI?.shell?.openPath) {
      await window.electronAPI.shell.openPath(path);
      setStatusNotice('Opening Excel file with your desktop spreadsheet app...');
    } else {
      setStatusNotice('File saved. You can locate it in your ExcelFile folder.');
    }
  };

  const handleOpenFolder = async () => {
    const fileRes = await ensureFileSaved();
    const path = fileRes?.filePath || savedFileInfo?.filePath;
    if (path && window.electronAPI?.shell?.showItemInFolder) {
      window.electronAPI.shell.showItemInFolder(path);
      setStatusNotice('Opened Amortization Tracker folder in Windows File Explorer.');
    } else if (window.electronAPI?.excel?.getExcelDir) {
      const dir = await window.electronAPI.excel.getExcelDir();
      window.electronAPI.shell.openPath(dir);
      setStatusNotice('Opened Amortization Tracker folder in Windows File Explorer.');
    } else {
      setStatusNotice('File saved to Documents > Amortization Tracker > ExcelFile.');
    }
  };

  const handleOpenGoogleSheetsWeb = async () => {
    // Instead of sheets.new (which opens a blank empty spreadsheet), open Google Sheets web app
    const sheetsUrl = 'https://docs.google.com/spreadsheets/u/0/';
    if (window.electronAPI?.shell?.openExternal) {
      await window.electronAPI.shell.openExternal(sheetsUrl);
    } else {
      window.open(sheetsUrl, '_blank');
    }
    setStatusNotice('Google Sheets Web opened! In Google Sheets, click the Folder icon > Upload to import your file.');
  };

  const handleNativeShare = async () => {
    if (onShareNative) {
      await onShareNative();
    }
  };

  const displayFilePath = savedFileInfo?.displayPath || savedFileInfo?.filePath || 'My Documents\\Amortization Tracker\\ExcelFile\\' + (fileName || 'Land_Amortization_Tracker.xlsx');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content glass-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 520,
          width: '94%',
          padding: '24px 22px',
          borderRadius: 16,
          background: 'var(--bg-card)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border-color)',
          maxHeight: '92vh',
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
              color: '#fff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <CloudUpload size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800 }}>Save to Google Drive</h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Backup 5-sheet amortization report to your Google account
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
              Report File:
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
            Contains 5 complete sheets: Dashboard, Land Accounts, Payments, Monthly Waterfall & Rules.
          </div>
        </div>

        {/* Explanation Card */}
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
              <span>Google Drive Desktop Workflow</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Click <strong>Open Google Drive</strong> below to launch Google Drive in your web browser. Your file will automatically be saved to <strong>My Documents &gt; Amortization Tracker &gt; ExcelFile</strong> so you can drag and drop it straight into your Drive folder.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
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
              {/* Button 1: Open Google Drive */}
              <button
                className="btn btn-drive btn-block"
                style={{
                  padding: '14px',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
                onClick={handleOpenGoogleDrive}
                disabled={isProcessing}
              >
                <ExternalLink size={18} />
                <span>{isProcessing ? 'Saving & Opening...' : 'Open Google Drive (drive.google.com)'}</span>
              </button>

              {/* Button 2: Open in Microsoft Excel (Replaces useless sheets.new empty sheet) */}
              <button
                className="btn btn-secondary btn-block"
                style={{
                  padding: '12px 14px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontWeight: 600,
                  borderRadius: 10
                }}
                onClick={handleOpenInExcel}
                disabled={isProcessing}
              >
                <FileSpreadsheet size={17} color="var(--accent-emerald)" />
                <span>Open in Microsoft Excel (Desktop)</span>
              </button>

              {/* Button 3: Open Excel Folder in Windows Explorer */}
              <button
                className="btn btn-secondary btn-block"
                style={{
                  padding: '12px 14px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontWeight: 600,
                  borderRadius: 10
                }}
                onClick={handleOpenFolder}
                disabled={isProcessing}
              >
                <FolderOpen size={17} color="var(--accent-cyan)" />
                <span>Open Folder in File Explorer</span>
              </button>
            </>
          )}

          {/* Button 4: Save / Download file */}
          <button
            className="btn btn-secondary btn-block"
            style={{
              padding: '11px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 10
            }}
            onClick={async () => {
              await ensureFileSaved();
              setStatusNotice('File saved to Documents > Amortization Tracker > ExcelFile.');
            }}
            disabled={isProcessing}
          >
            <Download size={15} />
            <span>Save .xlsx to Amortization Tracker Folder</span>
          </button>
        </div>

        {/* Status / Saved File Banner */}
        {(downloadTriggered || savedFileInfo) && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: '0.76rem',
            color: 'var(--accent-emerald-light)',
            marginBottom: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span>Excel File Saved:</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', wordBreak: 'break-all', opacity: 0.9 }}>
              {displayFilePath}
            </div>
          </div>
        )}

        {/* Status Notice */}
        {statusNotice && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: '0.75rem',
            color: 'var(--accent-cyan)',
            marginBottom: 12
          }}>
            {statusNotice}
          </div>
        )}

        {/* Google Sheets Web Helper Link (Instead of sheets.new empty sheet) */}
        {!isCordova && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingTop: 4,
            borderTop: '1px solid var(--border-color)',
            marginTop: 4
          }}>
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              Want to view in Google Sheets?
            </span>
            <button
              type="button"
              onClick={handleOpenGoogleSheetsWeb}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-emerald)',
                fontSize: '0.73rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 4px',
                fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              <Globe size={13} />
              <span>Open Google Sheets Web App</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
