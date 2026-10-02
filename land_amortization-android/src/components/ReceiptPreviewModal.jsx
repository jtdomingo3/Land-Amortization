import React, { useState, useEffect } from 'react';
import { getCompanySettings } from '../print/companyConfig.js';
import {
  calculateReceiptCoveredMonths,
  generateAllReceiptsHTML,
  generateSingleReceiptHTML
} from '../print/receiptGenerator.js';
import { printDocument, shareOrSavePdf } from '../print/printService.js';
import {
  X,
  Share2,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers
} from 'lucide-react';

export function ReceiptPreviewModal({ isOpen, onClose, account, payment, allPayments = [] }) {
  const [company, setCompany] = useState({});
  const [receiptItems, setReceiptItems] = useState([]);
  const [activeReceiptIdx, setActiveReceiptIdx] = useState(0);
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'all'
  const [zoom, setZoom] = useState(1.0);
  const [isPrinting, setIsPrinting] = useState(false);

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

    return () => { isMounted = false; };
  }, [isOpen, account, payment, allPayments]);

  if (!isOpen || !account || !payment) return null;

  const totalReceipts = receiptItems.length;
  const currentItem = receiptItems[activeReceiptIdx] || receiptItems[0];

  const handleZoomIn = () => setZoom(prev => Math.min(2.0, +(prev + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom(prev => Math.max(0.6, +(prev - 0.15).toFixed(2)));
  const handleZoomReset = () => setZoom(1.0);

  const handlePrintOrShare = async () => {
    setIsPrinting(true);
    try {
      const isMultiple = viewMode === 'all' && totalReceipts > 1;
      const htmlToGenerate = isMultiple
        ? generateAllReceiptsHTML(account, payment, allPayments, company)
        : (currentItem ? generateSingleReceiptHTML({
            account,
            payment,
            receiptItem: currentItem,
            company,
            receiptIndex: activeReceiptIdx + 1,
            totalReceipts
          }) : generateAllReceiptsHTML(account, payment, allPayments, company));

      const title = isMultiple
        ? `${account.name || 'Account'}_Receipts_All_${payment.receipt_no || payment.payment_id}`
        : `${account.name || 'Account'}_Receipt_${payment.receipt_no || payment.payment_id}${totalReceipts > 1 ? `_part${activeReceiptIdx + 1}` : ''}`;

      await shareOrSavePdf(htmlToGenerate, title);
    } catch (err) {
      alert('Could not generate PDF: ' + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const isMultiple = viewMode === 'all' && totalReceipts > 1;
      const htmlToGenerate = isMultiple
        ? generateAllReceiptsHTML(account, payment, allPayments, company)
        : (currentItem ? generateSingleReceiptHTML({
            account,
            payment,
            receiptItem: currentItem,
            company,
            receiptIndex: activeReceiptIdx + 1,
            totalReceipts
          }) : generateAllReceiptsHTML(account, payment, allPayments, company));

      const title = isMultiple
        ? `${account.name || 'Account'}_Receipts_All_${payment.receipt_no || payment.payment_id}`
        : `${account.name || 'Account'}_Receipt_${payment.receipt_no || payment.payment_id}${totalReceipts > 1 ? `_part${activeReceiptIdx + 1}` : ''}`;

      await printDocument(htmlToGenerate, title);
    } catch (err) {
      alert('Could not print: ' + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const currentReceiptHtml = currentItem ? generateSingleReceiptHTML({
    account,
    payment,
    receiptItem: currentItem,
    company,
    receiptIndex: activeReceiptIdx + 1,
    totalReceipts
  }) : '';

  const allReceiptsHtml = totalReceipts > 0
    ? generateAllReceiptsHTML(account, payment, allPayments, company)
    : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 680, maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="var(--accent-emerald)" />
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>Official Receipt Preview</h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {totalReceipts > 1
                  ? `${totalReceipts} Receipts Generated (${totalReceipts} Months Covered)`
                  : '1 Month Covered'}
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

        {/* Multi-receipt pagination & view mode bar (if > 1 receipt) */}
        {totalReceipts > 1 && (
          <div style={{
            background: 'var(--bg-card-subtle)',
            padding: '6px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {viewMode === 'single' ? (
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  Receipt {activeReceiptIdx + 1} of {totalReceipts}
                </span>
              ) : (
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  Showing All {totalReceipts} Receipts
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {viewMode === 'single' && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveReceiptIdx(prev => Math.max(0, prev - 1))}
                    disabled={activeReceiptIdx === 0}
                    style={{ padding: '3px 7px' }}
                    title="Previous Receipt"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveReceiptIdx(prev => Math.min(totalReceipts - 1, prev + 1))}
                    disabled={activeReceiptIdx === totalReceipts - 1}
                    style={{ padding: '3px 7px' }}
                    title="Next Receipt"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setViewMode(prev => prev === 'single' ? 'all' : 'single')}
                style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Layers size={13} />
                <span>{viewMode === 'single' ? 'View All' : 'Single View'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body: Receipt Render with Zoom */}
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
              dangerouslySetInnerHTML={{ __html: viewMode === 'all' ? allReceiptsHtml : currentReceiptHtml }}
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
              title="Print Receipt"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}
            >
              <Printer size={15} />
              <span>{viewMode === 'all' && totalReceipts > 1 ? `Print All (${totalReceipts})` : 'Print'}</span>
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
              <span>
                {isPrinting
                  ? 'Generating...'
                  : (viewMode === 'all' && totalReceipts > 1
                      ? `Share All PDFs (${totalReceipts})`
                      : (totalReceipts > 1 ? `Share PDF (${activeReceiptIdx + 1}/${totalReceipts})` : 'Share / Save PDF'))}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceiptPreviewModal;
