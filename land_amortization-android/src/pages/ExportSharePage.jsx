import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatDate, toISODateString, formatLastSync } from '../utils/formatters.js';
import { getFileNamePresets } from '../export/excelExport.js';
import {
  CloudUpload,
  Download,
  Share2,
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
  Settings,
  RefreshCw
} from 'lucide-react';
import { GoogleDriveModal } from '../components/GoogleDriveModal.jsx';
import { getGoogleDriveConfig, openGoogleDriveFolder } from '../services/googleDriveService.js';
import { shareToOtherApps } from '../share/shareFile.js';

export function ExportSharePage({ onSync, isSyncing, syncStatus, lastSyncedAt }) {
  const {
    accounts,
    payments,
    exportLogs,
    exportExcel,
    shareDrive,
    resetSample,
    clearAll,
    setActiveTab,
    syncCloud,
    isSyncing: appIsSyncing,
    syncStatus: appSyncStatus,
    lastSyncedAt: appLastSyncedAt
  } = useApp();

  const currentOnSync = onSync || (() => syncCloud({ silent: false }));
  const currentIsSyncing = isSyncing !== undefined ? isSyncing : appIsSyncing;
  const currentSyncStatus = syncStatus !== undefined ? syncStatus : appSyncStatus;
  const currentLastSyncedAt = lastSyncedAt !== undefined ? lastSyncedAt : appLastSyncedAt;

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

  const handleSaveToDriveDirect = () => {
    // Open the Google Drive setup modal so the user can easily review the folder link,
    // ensure "Anyone with the link" is enabled, and tap "Save to Google Drive Now"
    setIsDriveModalOpen(true);
  };

  const handleNativeShare = async () => {
    try {
      setLoadingAction('share_apps');
      setSuccessMessage('');
      setErrorMessage('');
      const res = await shareToOtherApps(accounts, payments, exportFileName);
      setLastExport(res);
      setSuccessMessage(res.message || 'Share options opened.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to open share menu');
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

      {/* Supabase Cloud Synchronization */}
      <div className="glass-card" style={{
        marginBottom: 16,
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        padding: '14px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-emerald)',
            flexShrink: 0
          }}>
            <Cloud size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Supabase Cloud Sync
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Synchronize offline accounts & payments with Supabase to keep PC in sync.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={currentOnSync}
              disabled={currentIsSyncing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}
            >
              <Cloud size={15} className={currentIsSyncing ? 'animate-spin' : ''} />
              <span>{currentIsSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
            </button>
            <span style={{ fontSize: '0.7rem', color: currentIsSyncing ? 'var(--accent-cyan)' : 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
              {currentIsSyncing ? 'Synchronizing...' : (currentLastSyncedAt ? `Last Synced: ${formatLastSync(currentLastSyncedAt)}` : 'Not synchronized yet')}
            </span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('settings')}
            title="Configure Supabase URL & Key in Settings"
            style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
          >
            <Settings size={14} />
            <span>Configure Sync</span>
          </button>
        </div>

        {currentSyncStatus && (
          <div style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--accent-emerald)',
            fontSize: '0.76rem',
            fontWeight: 600
          }}>
            {currentSyncStatus}
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

        <button
          className="btn btn-ghost btn-block"
          style={{ padding: '10px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}
          onClick={handleNativeShare}
          disabled={loadingAction !== null}
        >
          <Share2 size={16} />
          {loadingAction === 'share_apps' ? 'Opening Share Menu...' : 'Or Share via Other Apps (WhatsApp, Email...)'}
        </button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              <FolderDown size={14} color="var(--accent-cyan)" />
              <span>Where to find your file on your computer / phone:</span>
            </div>
            {lastExport.saveLocation === 'documents_folder' || (lastExport.displayPath && lastExport.displayPath.includes('Documents')) ? (
              <div>Saved directly to your device inside <strong>Documents/Amortization Tracker/</strong> (<code>{lastExport.displayPath || `Documents/Amortization Tracker/${lastExport.fileName}`}</code>). You can open it anytime from your phone's <strong>Files</strong> or <strong>My Files</strong> app under Documents.</div>
            ) : lastExport.saveLocation === 'chosen_folder' ? (
              <div>Saved in the folder you selected in the "Save As" window.</div>
            ) : lastExport.saveLocation === 'downloads_folder' ? (
              <div>Saved directly to your device's <strong>Download</strong> folder (<code>/Download/{lastExport.fileName}</code>). Accessible from your phone's <strong>Files</strong> app.</div>
            ) : lastExport.saveLocation === 'device_storage' ? (
              <div>Saved to device storage in your <strong>Documents</strong> folder.</div>
            ) : (
              <div>
                Saved in your PC's <strong>Downloads</strong> folder (e.g. <code>Downloads\{lastExport.fileName}</code>).<br />
                💡 Shortcut: Press <strong>Ctrl + J</strong> in your browser to immediately see and open downloaded files.
              </div>
            )}
          </div>

          {lastExport.blobUrl && (
            <a
              href={lastExport.blobUrl}
              download={lastExport.fileName}
              className="btn btn-primary btn-block"
              style={{ padding: '10px 14px', fontSize: '0.86rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Download size={15} />
              Click here to directly open / re-download "{lastExport.fileName}"
            </a>
          )}
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
