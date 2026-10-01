import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatDate, toISODateString } from '../utils/formatters.js';
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
  Info
} from 'lucide-react';
import { GoogleDriveShareModal } from '../components/GoogleDriveShareModal.jsx';

export function ExportSharePage() {
  const {
    accounts,
    payments,
    exportLogs,
    exportExcel,
    shareDrive,
    resetSample,
    clearAll
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

  const handleShareToDrive = async () => {
    if (window.cordova || (window.plugins && window.plugins.socialsharing)) {
      try {
        setLoadingAction('share');
        setSuccessMessage('');
        setErrorMessage('');
        const res = await shareDrive(exportFileName);
        setLastExport(res);
        setSuccessMessage(res.message || `File ready to share: ${res.fileName}`);
      } catch (err) {
        setErrorMessage(err.message || 'Failed to share to Google Drive');
      } finally {
        setLoadingAction(null);
      }
    } else {
      // In web browser preview, open the Google Drive modal
      setIsDriveModalOpen(true);
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
            <span>Google Drive Upload • 100% Offline Database</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            When you tap <strong>Share to Google Drive</strong>, Android's share menu opens. Select Google Drive to upload and convert your 5-sheet report into a Google Sheet directly to your Drive account.
          </div>
        </div>
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
        <button
          className="btn btn-secondary btn-block"
          style={{ padding: '14px', fontSize: '0.96rem' }}
          onClick={handleSaveToDevice}
          disabled={loadingAction !== null}
        >
          <Download size={18} />
          {loadingAction === 'save' ? 'Saving .xlsx file...' : 'Save .xlsx to Local Storage'}
        </button>

        <button
          className="btn btn-drive btn-block"
          style={{ padding: '14px', fontSize: '0.96rem' }}
          onClick={handleShareToDrive}
          disabled={loadingAction !== null}
        >
          <Share2 size={18} />
          {loadingAction === 'share' ? 'Preparing Share Sheet...' : 'Share to Google Drive / Apps'}
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
            {lastExport.saveLocation === 'chosen_folder' ? (
              <div>Saved in the folder you selected in the Windows "Save As" window.</div>
            ) : lastExport.saveLocation === 'device_storage' ? (
              <div>Saved to device storage in your <strong>Download</strong> folder.</div>
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

      {/* Google Drive Connection & Share Modal */}
      <GoogleDriveShareModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        fileName={exportFileName}
        onDirectDownload={() => handleSaveToDevice()}
        onShareNative={() => shareDrive(exportFileName)}
        isCordova={Boolean(window.cordova || (window.plugins && window.plugins.socialsharing) || /android|iphone|ipad/i.test(navigator.userAgent))}
      />
    </div>
  );
}
