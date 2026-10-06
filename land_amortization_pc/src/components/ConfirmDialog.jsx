import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Info, CheckCircle2, X } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  title,
  message,
  details,
  confirmText,
  cancelText = 'Cancel',
  type = 'danger',
  isAlert = false,
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel && onCancel();
      } else if (e.key === 'Enter') {
        onConfirm && onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const defaultConfirmText = isAlert
    ? 'Understood'
    : type === 'danger'
    ? 'Delete'
    : type === 'warning'
    ? 'Proceed'
    : 'Confirm';

  const finalConfirmText = confirmText || defaultConfirmText;

  const renderIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="confirm-icon-badge danger">
            <Trash2 size={28} />
          </div>
        );
      case 'warning':
        return (
          <div className="confirm-icon-badge warning">
            <AlertTriangle size={28} />
          </div>
        );
      case 'info':
        return (
          <div className="confirm-icon-badge info">
            <Info size={28} />
          </div>
        );
      case 'success':
        return (
          <div className="confirm-icon-badge success">
            <CheckCircle2 size={28} />
          </div>
        );
      default:
        return (
          <div className="confirm-icon-badge warning">
            <AlertTriangle size={28} />
          </div>
        );
    }
  };

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="confirm-close-btn"
          onClick={onCancel}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {renderIcon()}

        <h3 className="confirm-title">{title}</h3>

        {message && <p className="confirm-message">{message}</p>}

        {details && (
          <div className={`confirm-details-box ${type}`}>
            <span className="confirm-details-icon">⚠️</span>
            <div className="confirm-details-text">{details}</div>
          </div>
        )}

        <div className="confirm-actions">
          {!isAlert && (
            <button
              type="button"
              className="confirm-btn-cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className={`confirm-btn-action ${type}`}
            onClick={onConfirm}
            autoFocus
          >
            {type === 'danger' && !isAlert && <Trash2 size={16} />}
            {finalConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
