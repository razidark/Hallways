import React, { useEffect } from 'react';
import { X, Palette, Sparkles } from 'lucide-react';
import ThemePanel from './ThemePanel';

const ThemeEngineModal = ({ onClose }) => {
  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fade-in" style={{
      position: 'fixed', 
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', 
      backdropFilter: 'blur(30px)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      zIndex: 10000,
      padding: '20px'
    }}>
      <div 
        className="glass-overlay slide-down" 
        onClick={e => e.stopPropagation()}
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: 'var(--radius-xl)', 
          width: '720px', 
          maxWidth: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          maxHeight: '90vh', 
          border: '1px solid var(--border-color)', 
          boxShadow: '0 40px 120px rgba(0,0,0,0.6)', 
          overflow: 'hidden' 
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '32px', 
          borderBottom: '1px solid var(--border-color)',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              padding: '12px', 
              background: 'rgba(var(--accent-color-rgb), 0.1)', 
              borderRadius: 'var(--radius-lg)',
              color: 'var(--accent-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Palette size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '1px', fontFamily: 'Space Grotesk' }}>IDENTITY THEME ENGINE</h2>
              <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px', fontWeight: 'bold' }}>ADJUSTING PLATFORM AESTHETICS</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'var(--bg-tertiary)', 
              border: 'none', 
              borderRadius: '50%', 
              width: '40px', 
              height: '40px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              color: 'var(--text-secondary)' 
            }} 
            className="hover-scale"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div 
          className="scrollbar-hidden" 
          style={{ 
            padding: '40px 32px', 
            overflowY: 'auto', 
            flex: 1 
          }}
        >
          <ThemePanel viewMode="expanded" onSelect={onClose} />
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '24px 32px', 
          borderTop: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.4 }}>
            <Sparkles size={14} />
            <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px' }}>Style: SYNCHRONIZED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeEngineModal;
