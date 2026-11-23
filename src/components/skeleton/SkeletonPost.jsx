import React from 'react';

const SkeletonPost = () => {
  return (
    <div className="post shimmer" style={{ opacity: 0.5, border: 'none' }}>
      <div className="post-header" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.1)' }} className="shimmer" />
            <div style={{ width: '100px', height: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.1)' }} className="shimmer" />
        </div>
      </div>
       <div style={{ aspectRatio: '1/1', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-xl)' }} className="shimmer" />
      <div style={{ padding: '20px' }}>
        <div style={{ width: '60%', height: '10px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.1)', marginBottom: '8px' }} className="shimmer" />
        <div style={{ width: '40%', height: '10px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.1)' }} className="shimmer" />
      </div>
    </div>
  );
};

export default SkeletonPost;
