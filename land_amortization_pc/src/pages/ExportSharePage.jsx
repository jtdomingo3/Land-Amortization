import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatDate, toISODateString } from '../utils/formatters.js';
import { getFileNamePresets } from '../export/excelExport.js';
import {
  CloudUpload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  History,
  RotateCcw,
  Trash2,
  AlertTriangle,
  FolderDown,
  Info,
  Cloud,
  Folder,
  ExternalLink,
  Settings
} from 'lucide-react';
import { GoogleDriveModal } from '../components/GoogleDriveModal.jsx';
import { getGoogleDriveConfig, openGoogleDriveFolder, uploadToGoogleDrive } from '../services/googleDriveService.js';

export function ExportSharePage({ onSync, isSyncing, syncStatus }) {
  const {
    accounts,
    payments,
    exportLogs,
    exportExcel,
    shareDrive,
    resetSample,
    clearAll,
    setActiveTab
  } = useApp();

  const presets = getFileNamePresets();
  const [loadingAction, setLoadingAction] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [exportFileName, setExportFileName] = useState(
    `Land_Amortization_Tracker_${toISODateString(new Date())}.xlsx`
  );
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [lastExport, setLastExport] = useState(null);
  const gdriveConfig = getGoogleDriveConfig();

  const handleSaveToDriveDirect = async () => {
    const config = getGoogleDriveConfig();
    const hasFolder = Boolean((config.folderUrl && config.folderUrl.trim()) || (config.webhookUrl && config.webhookUrl.trim()));

    // If folder is NOT updated/configured yet, open the modal dialog to setup
    if (!hasFolder) {
      setIsDriveModalOpen(true);
      return;
    }

    // Once folder is updated, DO NOT show the modal! Automatically save new file!
    try {
      setLoadingAction('drive');
      setSuccessMessage('');
      setErrorMessage('');

      // 1. If automated webhook is configured, upload directly to Google Drive
      if (config.webhookUrl && config.webhookUrl.trim()) {
        const uploadRes = await uploadToGoogleDrive(accounts, payments, exportFileName, (msg) => {
          setSuccessMessage(msg);
        });
        setLastExport(uploadRes);
        setSuccessMessage(`Workbook "${uploadRes.fileName}" uploaded directly to your Google Drive folder!`);
        return;
      }

      // 2. Otherwise: Save new file to Documents > Amortization Tracker > ExcelFile
      const res = await shareDrive(exportFileName);
      setLastExport(res);

      // Open the saved file in Windows File Explorer
      if (res && res.filePath && window.electronAPI?.shell?.showItemInFolder) {
        window.electronAPI.shell.showItemInFolder(res.filePath);
      }

      setSuccessMessage(
        `New file "${res.fileName}" saved to Documents > Amortization Tracker > ExcelFile, and Google Drive opened in your browser!`
      );
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save to Google Drive');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveToDevice = async () => {
    try {
      setLoadingAction('save');
      setSuccessMessage('');
      setErrorMessage('');
      const res = await exportExcel(exportFileName);
      setLastExport(res);
      setSuccessMessage(res.message || `Saved as "${res.fileName}" successfully!`);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('cancel')) {
        // User cancelled the file picker dialog
        return;
      }
      setErrorMessage(err.message || 'Failed to save Excel file');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset database back to the Excel sample accounts (Juan Dela Cruz, Pedro Santos)? Any newly added accounts will be replaced.')) {
      await resetSample();
      setSuccessMessage('Reset to sample data successfully.');
    }
  };

  const handleClear = async () => {
    if (confirm('CAUTION: Are you sure you want to clear all accounts and payments? This cannot be undone.')) {
      await clearAll();
      setSuccessMessage('All data cleared.');
    }
  };

  return (
    <div className="export-share-page">
      {/* Hero Card */}
      <div className="glass-card export-hero-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <CloudUpload size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Export & Share</h2>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Save tabular Excel (.xlsx) & upload to Google Drive
            </div>
          </div>
        </div>

        {/* Cloud & Offline Highlights */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 8,
          padding: '10px 12px',
          marginTop: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
            <ShieldCheck size={14} />
            <span>Documents Storage • Direct Google Drive Account Sync</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            • <strong>Local Backup:</strong> Saved directly inside <code>Documents/Amortization Tracker/</code> on your device.<br />
            • <strong>Google Drive:</strong> Connects directly to your Google account on your phone to upload into your selected folder with 0 developer setup!
          </div>
        </div>
      </div>

      {/* Supabase Realtime Cloud Sync Card */}
      <div className="glass-card" style={{
        marginBottom: 16,
        padding: '16px 20px',
        borderLeft: '4px solid var(--accent-emerald)',
        background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.06) 0%, var(--bg-card) 100%)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)'
            }}>
              <Cloud size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                Supabase Cloud Synchronization
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Synchronize offline PC records with Supabase PostgreSQL to keep mobile Android in sync.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {onSync && (
              <button
                className="btn btn-primary"
                onClick={onSync}
                disabled={isSyncing}
                style={{ padding: '8px 18px', fontSize: '0.86rem' }}
              >
                <Cloud size={16} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
              </button>
            )}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('settings')}
              title="Configure Supabase URL & Key"
            >
              <Settings size={15} />
              <span>Configure Sync</span>
            </button>
          </div>
        </div>

        {syncStatus && (
          <div style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--accent-emerald)',
            fontSize: '0.78rem',
            fontWeight: 600
          }}>
            {syncStatus}
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--accent-emerald-light)',
          padding: '12px 14px',
          borderRadius: 8,
          marginBottom: 14,
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          padding: '12px 14px',
          borderRadius: 8,
          marginBottom: 14,
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* File Name Configuration with Presets */}
      <div className="glass-card" style={{ marginBottom: 14, padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Export File Name</label>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Proper Excel format</span>
        </div>

        <input
          type="text"
          className="form-input mono"
          value={exportFileName}
          onChange={e => setExportFileName(e.target.value)}
          placeholder="Land_Amortization_Tracker_YYYY-MM-DD.xlsx"
          style={{ fontWeight: 600, marginBottom: 8 }}
        />

        {/* Quick Preset Buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {presets.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setExportFileName(p.fileName)}
              style={{
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: 6,
                border: exportFileName === p.fileName ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                background: exportFileName === p.fileName ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card-subtle)',
                color: exportFileName === p.fileName ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          File extension <strong>.xlsx</strong> is automatically preserved.
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <div>
          <button
            className="btn btn-secondary btn-block"
            style={{ padding: '14px', fontSize: '0.96rem' }}
            onClick={handleSaveToDevice}
            disabled={loadingAction !== null}
          >
            <FolderDown size={18} />
            {loadingAction === 'save' ? 'Saving to Documents...' : 'Save .xlsx to Local Storage'}
          </button>
          <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
            📁 Destination: <strong>Documents/Amortization Tracker/</strong>
          </div>
        </div>

        <div>
          <button
            className="btn btn-drive btn-block"
            style={{ padding: '14px', fontSize: '0.96rem', background: 'linear-gradient(135deg, #4285F4, #34A853)' }}
            onClick={handleSaveToDriveDirect}
            disabled={loadingAction !== null}
          >
            <Cloud size={18} />
            {loadingAction === 'drive' ? 'Opening Google Drive...' : 'Save to Google Drive'}
          </button>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setIsDriveModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 4px'
              }}
            >
              <Folder size={12} />
              <span>{gdriveConfig.folderUrl ? 'Folder Link Configured • Settings' : 'Setup Backup Folder Link'}</span>
            </button>
            {gdriveConfig.folderUrl && (
              <button
                type="button"
                onClick={() => openGoogleDriveFolder()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-emerald)',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 4px'
                }}
              >
                <ExternalLink size={12} />
                <span>Open Backup Folder</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Where is my file saved card - shown after export */}
      {lastExport && (
        <div className="glass-card" style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--accent-emerald-light)' }}>
            <CheckCircle2 size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>File Ready & Saved</span>
          </div>

          <div style={{ fontSize: '0.82rem', marginBottom: 8 }}>
            <strong>File Name:</strong> <code style={{ background: 'var(--bg-card-subtle)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{lastExport.fileName}</code>
          </div>

          <div style={{
            fontSize: '0.76rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            padding: '8px 10px',
            background: 'var(--bg-card-subtle)',
            borderRadius: 6,
            marginBottom: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              <FolderDown size={14} color="var(--accent-cyan)" />
              <span>File Storage Location:</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
              Saved to: <strong>My Documents &gt; Amortization Tracker &gt; ExcelFile</strong>
              {lastExport.filePath && (
                <div style={{ marginTop: 4 }}>
                  <code style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4, wordBreak: 'break-all' }}>
                    {lastExport.filePath}
                  </code>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {lastExport.filePath && typeof window !== 'undefined' && window.electronAPI?.shell && (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '9px 14px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => window.electronAPI.shell.openPath(lastExport.filePath)}
                >
                  <FileSpreadsheet size={15} />
                  <span>Open Excel File</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '9px 14px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => {
                    const dir = lastExport.directory || (lastExport.filePath ? lastExport.filePath.substring(0, lastExport.filePath.lastIndexOf('\\')) : '');
                    if (dir) window.electronAPI.shell.openPath(dir);
                    else window.electronAPI.shell.showItemInFolder(lastExport.filePath);
                  }}
                >
                  <Folder size={15} color="var(--accent-cyan)" />
                  <span>Open Folder</span>
                </button>
              </>
            )}

            {lastExport.blobUrl && (typeof window === 'undefined' || !window.electronAPI) && (
              <a
                href={lastExport.blobUrl}
                download={lastExport.fileName}
                className="btn btn-primary btn-block"
                style={{ padding: '10px 14px', fontSize: '0.86rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Download size={15} />
                Download "{lastExport.fileName}"
              </a>
            )}
          </div>
        </div>
      )}

      {/* 5-Sheet Workbook Contents Overview */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Export Workbook Structure (5 Sheets)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-card-subtle)', borderRadius: 6 }}>
            <span><strong>1. Dashboard</strong> (Summary & KPIs)</span>
            <span style={{ color: 'var(--accent-cyan)' }}>14 KPI Rows</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-card-subtle)', borderRadius: 6 }}>
            <span><strong>2. Land Accounts</strong> (All 24 Columns)</span>
            <span style={{ color: 'var(--accent-emerald-light)' }}>{accounts.length} Accounts</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-card-subtle)', borderRadius: 6 }}>
            <span><strong>3. Payments</strong> (All 11 Columns)</span>
            <span style={{ color: 'var(--accent-emerald-light)' }}>{payments.length} Payments</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-card-subtle)', borderRadius: 6 }}>
            <span><strong>4. Monthly Schedule</strong> (Waterfall)</span>
            <span style={{ color: 'var(--accent-amber)' }}>120 mos / account</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-card-subtle)', borderRadius: 6 }}>
            <span><strong>5. Instructions</strong> (Usage Rules)</span>
            <span style={{ color: 'var(--text-muted)' }}>10 Rules</span>
          </div>
        </div>
      </div>

      {/* Past Export History */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <History size={16} color="var(--text-secondary)" />
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Export History
          </h3>
        </div>

        {exportLogs.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
            No export history yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {exportLogs.slice(0, 5).map((log, idx) => (
              <div
                key={log.log_id || idx}
                style={{
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.74rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.file_name}</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                    {log.accounts_exported} accounts • {log.payments_exported} payments • {log.export_type === 'share_google_drive' ? 'Shared to Drive' : 'Saved to Device'}
                  </div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  {formatDate(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Database Maintenance Tools */}
      <div className="glass-card">
        <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Database Tools
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleReset}>
            <RotateCcw size={14} />
            Reset to Sample Data
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleClear}>
            <Trash2 size={14} />
            Clear All Data
          </button>
        </div>
      </div>

      {/* Author & Developer Info */}
      <div style={{
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10,
        fontSize: '0.74rem',
        color: 'var(--text-muted)'
      }}>
        Land Amortization Tracker • Developed by <strong style={{ color: 'var(--text-secondary)' }}>Gezyne-Jamir Software Tech</strong>
      </div>

      {/* Google Drive Account Sync Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        accounts={accounts}
        payments={payments}
        fileName={exportFileName}
      />
    </div>
  );
}
