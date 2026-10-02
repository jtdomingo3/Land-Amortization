import React, { useState, useEffect, useMemo } from 'react';
import { getCompanySettings } from '../print/companyConfig.js';
import { generateSOAHTML } from '../print/soaGenerator.js';
import { printDocument, shareOrSavePdf } from '../print/printService.js';
import {
  X,
  Share2,
  Printer,
  FileSpreadsheet,
  Calendar,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

export function SOAModal({ isOpen, onClose, account, payments = [] }) {
  const [company, setCompany] = useState({});
  const [preset, setPreset] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [zoom, setZoom] = useState(1.0);
  const [isPrinting, setIsPrinting] = useState(false);

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

    // Default dates based on preset
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const todayMonth = `${currentYear}-${currentMonth}`;

    if (preset === 'THIS_YEAR') {
      setDateFrom(`${currentYear}-01`);
      setDateTo(`${currentYear}-12`);
    } else if (preset === 'YTD') {
      setDateFrom(`${currentYear}-01`);
      setDateTo(todayMonth);
    } else if (preset === 'ALL') {
      setDateFrom('');
      setDateTo('');
    }

    setZoom(1.0);

    return () => { isMounted = false; };
  }, [isOpen, account, preset]);

  const handleZoomIn = () => setZoom(prev => Math.min(2.0, +(prev + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom(prev => Math.max(0.6, +(prev - 0.15).toFixed(2)));
  const handleZoomReset = () => setZoom(1.0);

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

  const handlePrintOrShare = async () => {
    setIsPrinting(true);
    try {
      const periodLabel = dateFrom || dateTo ? `_${dateFrom || 'start'}_to_${dateTo || 'end'}` : '_Full';
      const docTitle = `${account.name || 'Account'}_SOA${periodLabel}`;
      await shareOrSavePdf(soaHtml, docTitle);
    } catch (err) {
      alert('Could not generate PDF: ' + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const periodLabel = dateFrom || dateTo ? `_${dateFrom || 'start'}_to_${dateTo || 'end'}` : '_Full';
      const docTitle = `${account.name || 'Account'}_SOA${periodLabel}`;
      await printDocument(soaHtml, docTitle);
    } catch (err) {
      alert('Could not print: ' + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 760, maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={18} color="var(--accent-cyan)" />
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>Statement of Account (SOA)</h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {account.name} • Account #{account.account_id}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card-subtle)', borderRadius: 6, padding: '2px 4px', gap: 2 }}>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.6}
                title="Zoom Out"
                style={{ background: 'none', border: 'none', padding: '3px 5px', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                title="Reset Zoom"
                style={{ background: 'none', border: 'none', fontSize: '0.68rem', padding: '2px 4px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600 }}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 2.0}
                title="Zoom In"
                style={{ background: 'none', border: 'none', padding: '3px 5px', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <ZoomIn size={13} />
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ padding: '4px 8px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Period Filter Bar */}
        <div style={{
          background: 'var(--bg-card-subtle)',
          padding: '8px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: 2, textTransform: 'uppercase' }}>
              Period:
            </span>
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

          {/* Custom Date Pickers */}
          {preset === 'CUSTOM' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>
                  From Month
                </label>
                <input
                  type="month"
                  className="form-input"
                  style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>
                  To Month
                </label>
                <input
                  type="month"
                  className="form-input"
                  style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Container with Zoom */}
        <div
          className="modal-body"
          style={{
            background: '#e2e8f0',
            padding: 12,
            overflowY: 'auto',
            overflowX: 'auto',
            flex: 1
          }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
          >
            <div
              style={{
                background: '#ffffff',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                borderRadius: 6,
                overflow: 'hidden'
              }}
              dangerouslySetInnerHTML={{ __html: soaHtml }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrint}
              disabled={isPrinting}
              title="Print Statement of Account"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}
            >
              <Printer size={15} />
              <span>Print</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrintOrShare}
              disabled={isPrinting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                fontSize: '0.84rem'
              }}
            >
              {isPrinting ? <RefreshCw size={15} className="spin" /> : <Share2 size={15} />}
              <span>{isPrinting ? 'Generating...' : 'Share / Save SOA (PDF)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SOAModal;
