import React, { useState, useEffect } from 'react';
import { getCompanySettings } from '../print/companyConfig.js';
import {
  calculateReceiptCoveredMonths,
  generateAllReceiptsHTML,
  generateSingleReceiptHTML
} from '../print/receiptGenerator.js';
import { printDocument, saveDocumentAsPdf } from '../print/printService.js';
import {
  X,
  Printer,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function ReceiptPreviewModal({ isOpen, onClose, account, payment, allPayments = [] }) {
  const [company, setCompany] = useState({});
  const [receiptItems, setReceiptItems] = useState([]);
  const [activeReceiptIdx, setActiveReceiptIdx] = useState(0);
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'all'
  const [zoom, setZoom] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  useEffect(() => {
    if (!isOpen || !account || !payment) return;

    let isMounted = true;
    (async () => {
      try {
        const comp = await getCompanySettings();
        if (isMounted) setCompany(comp);
      } catch (e) {
        console.warn('Failed to load company config for preview:', e);
      }
    })();

    const items = calculateReceiptCoveredMonths(account, payment, allPayments);
    setReceiptItems(items);
    setActiveReceiptIdx(0);
    setViewMode('single');
    setZoom(1.0);
    setStatusMessage(null);

    return () => { isMounted = false; };
  }, [isOpen, account, payment, allPayments]);

  if (!isOpen || !account || !payment) return null;

  const totalReceipts = receiptItems.length;
  const currentItem = receiptItems[activeReceiptIdx] || receiptItems[0];

  const handleZoomIn = () => setZoom(prev => Math.min(1.6, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom(prev => Math.max(0.65, Number((prev - 0.15).toFixed(2))));
  const handleZoomReset = () => setZoom(1.0);

  const handlePrint = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const fullHtml = viewMode === 'all' || totalReceipts === 1
        ? generateAllReceiptsHTML(account, payment, allPayments, company)
        : generateSingleReceiptHTML({
            account,
            payment,
            receiptItem: currentItem,
            company,
            receiptIndex: activeReceiptIdx + 1,
            totalReceipts
          });

      const title = `${account.name || 'Account'}_Receipt_${payment.receipt_no || payment.payment_id}`;
      const res = await printDocument(fullHtml, title);
      if (res && res.error) {
        setStatusMessage({ type: 'error', text: `Print failed: ${res.error}` });
      } else {
        setStatusMessage({ type: 'success', text: 'Document sent to printer successfully.' });
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
      const fullHtml = generateAllReceiptsHTML(account, payment, allPayments, company);
      const title = `${account.name || 'Account'}_Receipt_${payment.receipt_no || payment.payment_id}`;
      const res = await saveDocumentAsPdf(fullHtml, title);
      if (res && res.success) {
        setStatusMessage({ type: 'success', text: res.message || 'PDF saved successfully.' });
        setTimeout(() => setStatusMessage(null), 4000);
      } else if (res && res.canceled) {
        // user simply canceled dialog
      } else if (res && res.error) {
        setStatusMessage({ type: 'error', text: `Save error: ${res.error}` });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Could not save PDF: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderedHtml = viewMode === 'all' && totalReceipts > 1
    ? generateAllReceiptsHTML(account, payment, allPayments, company)
    : (currentItem ? generateSingleReceiptHTML({
        account,
        payment,
        receiptItem: currentItem,
        company,
        receiptIndex: activeReceiptIdx + 1,
        totalReceipts
      }) : '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content print-preview-modal"
        style={{
          width: '92vw',
          maxWidth: 960,
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
        {/* Top Desktop Control Bar */}
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
          {/* Document Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>
                  Print Preview — Official Receipt
                </h3>
                <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  {payment.receipt_no || `OR-${payment.payment_id}`}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {account.name} &bull; {totalReceipts} month{totalReceipts > 1 ? 's' : ''} covered &bull; {payment.payment_date}
              </div>
            </div>
          </div>

          {/* Center: Pagination & Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* View Mode Toggle (Single vs All Continuous) */}
            {totalReceipts > 1 && (
              <div style={{
                display: 'flex',
                background: 'var(--bg-input)',
                borderRadius: 6,
                padding: 2,
                border: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'single' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => setViewMode('single')}
                  title="View individual receipt slip"
                >
                  Single Slip
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setViewMode('all')}
                  title="View all covered receipts together"
                >
                  <Layers size={12} />
                  <span>All ({totalReceipts})</span>
                </button>
              </div>
            )}

            {/* Single mode receipt navigator */}
            {totalReceipts > 1 && viewMode === 'single' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 6px' }}
                  onClick={() => setActiveReceiptIdx(prev => Math.max(0, prev - 1))}
                  disabled={activeReceiptIdx === 0}
                  title="Previous Receipt"
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, minWidth: 60, textAlign: 'center' }}>
                  {activeReceiptIdx + 1} of {totalReceipts}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 6px' }}
                  onClick={() => setActiveReceiptIdx(prev => Math.min(totalReceipts - 1, prev + 1))}
                  disabled={activeReceiptIdx === totalReceipts - 1}
                  title="Next Receipt"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
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
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSavePdf}
              disabled={isProcessing}
              title="Save Receipt as PDF document"
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
              title="Send directly to printer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontWeight: 700 }}
            >
              {isProcessing ? <RefreshCw size={15} className="spin" /> : <Printer size={15} />}
              <span>Print Receipt</span>
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
              width: 720,
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
              background: '#ffffff',
              borderRadius: 6,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              marginBottom: 40
            }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
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
            Showing: <strong>{viewMode === 'all' ? `All ${totalReceipts} Receipts` : `Receipt ${activeReceiptIdx + 1} of ${totalReceipts}`}</strong>
            {currentItem && currentItem.periodText && ` &bull; Period: ${currentItem.periodText}`}
          </div>
          <div>
            Format: Standard Receipt Slip &bull; Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceiptPreviewModal;
