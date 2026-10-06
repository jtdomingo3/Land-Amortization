import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        const { id, message, type = 'info' } = toast;
        return (
          <div key={id} className={`toast-item ${type}`}>
            <div className="toast-icon">
              {type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
              {type === 'danger' && <AlertTriangle size={18} color="#ef4444" />}
              {type === 'warning' && <AlertTriangle size={18} color="#f59e0b" />}
              {type === 'info' && <Info size={18} color="#0ea5e9" />}
            </div>
            <div className="toast-message">{message}</div>
            <button
              type="button"
              className="toast-close"
              onClick={() => onDismiss(id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
