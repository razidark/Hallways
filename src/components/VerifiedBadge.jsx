import React from 'react';
import { BadgeCheck } from 'lucide-react';

const VerifiedBadge = ({ size = 14 }) => {
  return (
    <div className="verified-badge" style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: '4px',
      position: 'relative',
      verticalAlign: 'middle'
    }}>
      <div style={{
        position: 'absolute',
        width: `${size + 10}px`,
        height: `${size + 10}px`,
        background: 'radial-gradient(circle, var(--accent-color) 0%, transparent 70%)',
        opacity: 0.3,
        animation: 'pulse 2s infinite'
      }} />
      <BadgeCheck size={size} color="var(--accent-color)" fill="rgba(var(--accent-color-rgb), 0.2)" style={{ 
          filter: 'drop-shadow(0 0 5px var(--accent-color))',
          zIndex: 1
      }} />
    </div>
  );
};

export default VerifiedBadge;
