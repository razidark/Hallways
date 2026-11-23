import React from 'react';

const SkeletonGrid = ({ count = 9 }) => {
  return (
    <div className="explore-grid" style={{ marginBottom: '40px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="shimmer" 
          style={{ 
            aspectRatio: '1/1', 
            borderRadius: 'var(--radius-lg)', 
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            opacity: 0.4
          }} 
        />
      ))}
    </div>
  );
};

export default SkeletonGrid;
