import React from 'react';
import { getDynamicAvatarUrl } from '../lib/utils';
import { SHAPE_CLIPS } from '../lib/avatarShapes';

const Avatar = React.memo(({ src, username, style, size = 'md', borderStyle = 'normal', avatarShape = 'hexagon' }) => {
  const SIZES = {
    xs: '24px',
    sm: '32px',
    md: '56px',
    lg: '150px',
    xl: '200px'
  };

  const currentSize = SIZES[size] || size;
  const shape = avatarShape || 'hexagon';
  const clipPath = SHAPE_CLIPS[shape] || SHAPE_CLIPS.hexagon;

  const [imgError, setImgError] = React.useState(false);
  const defaultUrl = getDynamicAvatarUrl(username || 'H');

  const FRAME_MAP = {
    'normal': 'normal',
    'hexagon-glass': 'glass-morphism',
    'hexagon-cyber': 'cyber-neon',
    'hexagon-royalty': 'ghibli-nature',
    'hexagon-prism': 'spectral-prism',
    'hexagon-void': 'noir-cinema',
    'hexagon-inferno': 'matrix-code',
    'hexagon-nebula': 'liquid-plasma',
    'hexagon-liquid': 'liquid-plasma',
    'ethereal-silk': 'ethereal-silk',
    'crimson-void': 'crimson-void',
    'hyperdrive': 'hyperdrive',
    'cyber-radar': 'cyber-radar',
    'stellar-nova': 'stellar-nova',
    'deep-sea': 'deep-sea',
    'aurora-glow': 'aurora-glow'
  };

  const actualFrame = FRAME_MAP[borderStyle] || borderStyle;

  return (
    <div 
      className={`avatar-frame frame-${actualFrame} hover-scale`}
      style={{ 
        width: currentSize, 
        height: currentSize, 
        flexShrink: 0,
        clipPath: clipPath,
        WebkitClipPath: clipPath,
        cursor: 'pointer',
        ...style
      }}
    >
      {/* Removed avatar-shimmer to fix GIF flickering */}
      <img 
        src={(!src || imgError || (typeof src === 'string' && src.includes('ui-avatars.com'))) ? defaultUrl : src} 
        alt={username} 
        onError={() => setImgError(true)} 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          border: 'none',
          clipPath: clipPath,
          WebkitClipPath: clipPath,
          display: 'block'
        }} 
      />
      {/* Rim Light / Glow Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        boxShadow: borderStyle !== 'normal' ? 'inset 0 0 10px rgba(255,255,255,0.2)' : 'none',
        clipPath: clipPath,
        WebkitClipPath: clipPath,
        zIndex: 2
      }} />
    </div>
  );
});

export default Avatar;
