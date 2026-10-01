import React, { useState, useEffect } from 'react';
import { getCompanySettings } from '../print/companyConfig.js';
import {
  calculateReceiptCoveredMonths,
  generateAllReceiptsHTML,
  generateSingleReceiptHTML
} from '../print/receiptGenerator.js';
import { printDocument } from '../print/printService.js';
import { X, Share2, Printer, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export function ReceiptPreviewModal({ isOpen, onClose, account, payment, allPayments = [] }) {
  const [company, setCompany] = useState({});
  const [receiptItems, setReceiptItems] = useState([]);
  const [activeReceiptIdx, setActiveReceiptIdx] = useState(0);
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

    return () => { isMounted = false; };
  }, [isOpen, account, payment, allPayments]);

  if (!isOpen || !account || !payment) return null;

  const totalReceipts = receiptItems.length;
  const currentItem = receiptItems[activeReceiptIdx] || receiptItems[0];

  const handlePrintOrShare = async () => {
    setIsPrinting(true);
    try {
      const fullHtml = generateAllReceiptsHTML(account, payment, allPayments, company);
      const title = `${account.name || 'Account'}_Receipt_${payment.receipt_no || payment.payment_id}`;
      await printDocument(fullHtml, title);
    } catch (err) {
      alert('Could not open print/share: ' + err.message);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 680, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="var(--accent-emerald)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Official Receipt Preview</h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {totalReceipts > 1
                  ? `${totalReceipts} Receipts Generated (Covers ${totalReceipts} Months)`
                  : '1 Month Covered'}
              </div>
            </div>
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

        {/* Multi-receipt pagination bar (if > 1 receipt) */}
        {totalReceipts > 1 && (
          <div style={{
            background: 'var(--bg-card-subtle)',
            padding: '8px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald-light)' }}>
              Receipt {activeReceiptIdx + 1} of {totalReceipts}
            </span>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveReceiptIdx(prev => Math.max(0, prev - 1))}
                disabled={activeReceiptIdx === 0}
                style={{ padding: '4px 8px' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveReceiptIdx(prev => Math.min(totalReceipts - 1, prev + 1))}
                disabled={activeReceiptIdx === totalReceipts - 1}
                style={{ padding: '4px 8px' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body: Receipt Render */}
        <div
          className="modal-body"
          style={{
            background: '#e2e8f0',
            padding: 12,
            overflowY: 'auto',
            flex: 1
          }}
        >
          <div
            style={{
              background: '#ffffff',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              borderRadius: 6,
              overflow: 'hidden'
            }}
            dangerouslySetInnerHTML={{ __html: currentReceiptHtml }}
          />
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrintOrShare}
            disabled={isPrinting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              fontSize: '0.88rem'
            }}
          >
            <Share2 size={16} />
            <span>{isPrinting ? 'Opening...' : (totalReceipts > 1 ? `Share / Save ${totalReceipts} Receipts (PDF)` : 'Share / Save PDF')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default ReceiptPreviewModal;
