import React from 'react';
import { AlertTriangle, RefreshCw, Terminal, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
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

  handleToggleDevTools = () => {
    if (window.electronAPI?.dev?.toggleDevTools) {
      window.electronAPI.dev.toggleDevTools();
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
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
          padding: 24,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            maxWidth: 680,
            width: '100%',
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 16,
            padding: '28px 24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb7185'
              }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  Something went wrong
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                  The application encountered a runtime error instead of crashing to a white screen.
                </div>
              </div>
            </div>

            <div style={{
              background: '#020617',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: 12,
              marginBottom: 18,
              fontSize: '0.78rem',
              color: '#fb7185',
              fontFamily: 'Consolas, Monaco, monospace',
              overflowX: 'auto',
              maxHeight: 200,
              lineHeight: 1.45
            }}>
              <strong>{this.state.error?.toString()}</strong>
              {this.state.errorInfo?.componentStack && (
                <pre style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '0.72rem' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <RefreshCw size={15} />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleToggleDevTools}
                style={{
                  background: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Terminal size={15} />
                <span>Open DevTools (F12 or Ctrl+Shift+I)</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Home size={15} />
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
