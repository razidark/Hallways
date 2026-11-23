import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Hallway Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '20px', textAlign: 'center' }}>
          <div className="rainbow-logo-container" style={{ width: '80px', height: '80px', borderRadius: '30px', marginBottom: '32px' }}>
            <AlertTriangle size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '16px' }}>Reality Splintered</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6, marginBottom: '40px' }}>
            The corridor encountered an intense distortion. An unexpected error forced the interface to sever connection.
          </p>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => window.location.reload()}
              className="exotic-gradient"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '16px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <RefreshCw size={18} /> Restore Reality
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <Home size={18} /> Return to Nexus
            </button>
          </div>

          {/* Detailed dev trace */}
          {typeof import.meta !== 'undefined' && import.meta.env?.DEV && this.state.error && (
            <div style={{ marginTop: '60px', padding: '20px', backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: '16px', border: '1px solid rgba(255,0,0,0.2)', textAlign: 'left', maxWidth: '80vw', overflowX: 'auto' }}>
              <strong style={{ color: '#ff6b6b' }}>{this.state.error.toString()}</strong>
              <pre style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;