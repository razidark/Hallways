import React from 'react';
import { useUI } from '../context/UIContext';
import { Info, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

const ToastContainer = () => {
  const { toast } = useUI();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <Sparkles size={18} className="text-accent" />;
      case 'error': return <AlertCircle size={18} style={{ color: '#ff4b4b' }} />;
      default: return <Info size={18} style={{ color: 'var(--accent-color)' }} />;
    }
  };

  return (
    <div className="toast-portal fade-in-up" style={{
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div className="glass-overlay" style={{
        padding: '12px 24px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        backgroundColor: 'rgba(var(--bg-secondary-rgb), 0.8)',
        backdropFilter: 'blur(20px)',
        minWidth: '200px',
        justifyContent: 'center'
      }}>
        {getIcon()}
        <span style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            letterSpacing: '0.2px',
            color: 'var(--text-primary)',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {toast.message}
        </span>
      </div>
    </div>
  );
};

export default ToastContainer;
