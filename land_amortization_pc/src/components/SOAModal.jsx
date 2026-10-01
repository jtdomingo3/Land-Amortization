import React, { useState, useEffect, useMemo } from 'react';
import { getCompanySettings } from '../print/companyConfig.js';
import { generateSOAHTML } from '../print/soaGenerator.js';
import { printDocument, saveDocumentAsPdf } from '../print/printService.js';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function SOAModal({ isOpen, onClose, account, payments = [] }) {
  const [company, setCompany] = useState({});
  const [preset, setPreset] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [zoom, setZoom] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (!isOpen || !account) return;

    let isMounted = true;
    (async () => {
      try {
        const comp = await getCompanySettings();
        if (isMounted) setCompany(comp);
      } catch (e) {
        console.warn('Failed to load company config for SOA:', e);
      }
    })();

    setZoom(1.0);
    setStatusMessage(null);

    return () => { isMounted = false; };
  }, [isOpen, account]);

  // Handle Preset Changes
  const handlePresetSelect = (newPreset) => {
    setPreset(newPreset);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    if (newPreset === 'ALL') {
      setDateFrom('');
      setDateTo('');
    } else if (newPreset === 'THIS_YEAR') {
      setDateFrom(`${currentYear}-01`);
      setDateTo(`${currentYear}-12`);
    } else if (newPreset === 'YTD') {
      setDateFrom(`${currentYear}-01`);
      setDateTo(`${currentYear}-${currentMonth}`);
    } else if (newPreset === 'LAST_6_MOS') {
      const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const pastMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      setDateFrom(pastMonth);
      setDateTo(`${currentYear}-${currentMonth}`);
    }
  };

  const soaHtml = useMemo(() => {
    if (!account) return '';
    return generateSOAHTML(account, payments, {
      dateFrom,
      dateTo,
      company
    });
  }, [account, payments, dateFrom, dateTo, company]);

  if (!isOpen || !account) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(1.6, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom(prev => Math.max(0.65, Number((prev - 0.15).toFixed(2))));
  const handleZoomReset = () => setZoom(1.0);

  const periodLabel = dateFrom || dateTo ? `_${dateFrom || 'start'}_to_${dateTo || 'end'}` : '_Full';
  const docTitle = `${account.name || 'Account'}_SOA${periodLabel}`;

  const handlePrint = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await printDocument(soaHtml, docTitle);
      if (res && res.error) {
        setStatusMessage({ type: 'error', text: `Print failed: ${res.error}` });
      } else {
        setStatusMessage({ type: 'success', text: 'Statement of Account sent to printer.' });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Print error: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePdf = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await saveDocumentAsPdf(soaHtml, docTitle);
      if (res && res.success) {
        setStatusMessage({ type: 'success', text: res.message || 'SOA saved as PDF successfully.' });
        setTimeout(() => setStatusMessage(null), 4000);
      } else if (res && res.canceled) {
        // user canceled dialog
      } else if (res && res.error) {
        setStatusMessage({ type: 'error', text: `Save error: ${res.error}` });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Could not save PDF: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content print-preview-modal"
        style={{
          width: '92vw',
          maxWidth: 1040,
          height: '92vh',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 14,
          overflow: 'hidden',
          background: 'var(--bg-card)',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.45)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className="print-preview-header"
          style={{
            padding: '12px 20px',
            background: 'var(--bg-card-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          {/* Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(6, 182, 212, 0.12)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>
                  Print Preview — Statement of Account (SOA)
                </h3>
                <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  A4 Formal Ledger
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {account.name} &bull; Title: {account.land_title_number || 'N/A'} &bull; {account.num_of_months || 120} Months Term
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-input)',
              borderRadius: 6,
              padding: '2px 4px',
              border: '1px solid var(--border-subtle)',
              gap: 2
            }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: '3px 5px' }}
                onClick={handleZoomOut}
                title="Zoom Out"
                disabled={zoom <= 0.65}
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem', padding: '3px 6px', fontWeight: 700, minWidth: 42 }}
                onClick={handleZoomReset}
                title="Reset to 100%"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: '3px 5px' }}
                onClick={handleZoomIn}
                title="Zoom In"
                disabled={zoom >= 1.6}
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: '3px 5px' }}
                onClick={handleZoomReset}
                title="Fit Width / 100%"
              >
                <Maximize2 size={13} />
              </button>
            </div>

            {/* Actions: Save PDF & Print */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSavePdf}
              disabled={isProcessing}
              title="Save SOA as PDF document"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}
            >
              <Download size={15} color="var(--accent-cyan)" />
              <span>Save as PDF</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              disabled={isProcessing}
              title="Send SOA directly to printer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontWeight: 700 }}
            >
              {isProcessing ? <RefreshCw size={15} className="spin" /> : <Printer size={15} />}
              <span>Print SOA</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              title="Close Preview"
              style={{ padding: '7px 9px', marginLeft: 4 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Schedule Period Options */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '8px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            <Calendar size={14} color="var(--accent-cyan)" />
            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>Period:</span>
          </div>

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${preset === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
              onClick={() => handlePresetSelect('ALL')}
            >
              Full Schedule
            </button>
            <button
              type="button"
              className={`btn btn-sm ${preset === 'YTD' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
              onClick={() => handlePresetSelect('YTD')}
            >
              Year-to-Date
            </button>
            <button
              type="button"
              className={`btn btn-sm ${preset === 'THIS_YEAR' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
              onClick={() => handlePresetSelect('THIS_YEAR')}
            >
              This Year
            </button>
            <button
              type="button"
              className={`btn btn-sm ${preset === 'LAST_6_MOS' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
              onClick={() => handlePresetSelect('LAST_6_MOS')}
            >
              Last 6 Months
            </button>
            <button
              type="button"
              className={`btn btn-sm ${preset === 'CUSTOM' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
              onClick={() => handlePresetSelect('CUSTOM')}
            >
              Custom Range
            </button>
          </div>

          {preset === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <input
                type="month"
                className="form-input"
                style={{ padding: '3px 8px', fontSize: '0.75rem', width: 130 }}
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                placeholder="From"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>to</span>
              <input
                type="month"
                className="form-input"
                style={{ padding: '3px 8px', fontSize: '0.75rem', width: 130 }}
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                placeholder="To"
              />
            </div>
          )}
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div style={{
            padding: '8px 16px',
            background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            borderBottom: `1px solid ${statusMessage.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
            color: statusMessage.type === 'success' ? 'var(--accent-emerald-light)' : '#fb7185',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 2 }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Interactive Desktop Preview Canvas */}
        <div
          className="print-preview-viewport"
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#334155', // Studio slate backdrop for contrast
            padding: '24px 20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}
        >
          {/* Scalable Paper Sheet Container */}
          <div
            className="print-preview-sheet"
            style={{
              width: 794, // Standard A4 width at 96 DPI
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
              background: '#ffffff',
              borderRadius: 6,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              marginBottom: 40
            }}
            dangerouslySetInnerHTML={{ __html: soaHtml }}
          />
        </div>

        {/* Bottom Status / Summary Bar */}
        <div
          style={{
            padding: '8px 20px',
            background: 'var(--bg-card-subtle)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: 'var(--text-secondary)'
          }}
        >
          <div>
            Schedule: <strong>{preset === 'ALL' ? 'Complete Amortization Term' : (preset === 'YTD' ? 'Year-to-Date' : (preset === 'THIS_YEAR' ? 'Full Current Year' : 'Filtered Period'))}</strong> &bull; Total Payments Logged: {payments.length}
          </div>
          <div>
            Format: Standard A4 Formal Statement &bull; Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}

export default SOAModal;
