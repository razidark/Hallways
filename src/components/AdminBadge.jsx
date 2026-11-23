import React from 'react';
import { Shield } from 'lucide-react';

const AdminBadge = ({ size = 14 }) => {
  return (
    <div className="admin-badge" style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: '4px',
      position: 'relative',
      verticalAlign: 'middle',
      cursor: 'help'
    }} title="System Overseer (Administrator)">
      <div style={{
        position: 'absolute',
        width: `${size + 10}px`,
        height: `${size + 10}px`,
        background: 'radial-gradient(circle, #ff0055 0%, transparent 70%)',
        opacity: 0.4,
        animation: 'pulse 1.5s infinite'
      }} />
      <Shield size={size} color="#ff0055" fill="rgba(255, 0, 85, 0.2)" style={{ 
          filter: 'drop-shadow(0 0 5px #ff0055)',
          zIndex: 1
      }} />
    </div>
  );
};

export default AdminBadge;
