import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Copy } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  handleCopyError = () => {
    const errorText = `${this.state.error?.toString()}\n\nStack:\n${this.state.errorInfo?.componentStack || ''}`;
    try {
      navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    } catch {
      alert('Could not copy error to clipboard.');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0b0f19',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            maxWidth: 600,
            width: '100%',
            background: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 16,
            padding: '24px 20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb7185',
                flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  Something went wrong
                </h2>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 2 }}>
                  The app caught a runtime exception instead of crashing to a white screen.
                </div>
              </div>
            </div>

            <div style={{
              background: '#020617',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: '0.74rem',
              color: '#fb7185',
              fontFamily: 'Consolas, Monaco, monospace',
              overflowX: 'auto',
              maxHeight: 180,
              lineHeight: 1.45
            }}>
              <strong>{this.state.error?.toString()}</strong>
              {this.state.errorInfo?.componentStack && (
                <pre style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <RefreshCw size={14} />
                <span>Reload App</span>
              </button>

              <button
                type="button"
                onClick={this.handleCopyError}
                style={{
                  background: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Copy size={14} />
                <span>{this.state.copied ? 'Copied Error!' : 'Copy Error Details'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <RotateCcw size={14} />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
