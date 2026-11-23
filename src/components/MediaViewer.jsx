import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';

/**
 * MediaViewer: Fullscreen image/video viewer with zoom, pan, rotate, and download.
 * Props:
 *   - src: string (URL of the media)
 *   - isVideo: boolean
 *   - onClose: () => void
 */
const MediaViewer = ({ src, isVideo = false, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => { setScale(1); setRotation(0); setPosition({ x: 0, y: 0 }); };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hallway_media_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(src, '_blank');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === 'r') handleRotate();
      if (e.key === '0') handleReset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Scroll wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale(prev => Math.max(0.5, Math.min(5, prev + delta)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (el) el.removeEventListener('wheel', handleWheel); };
  }, [handleWheel]);

  // Pan when zoomed
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch support for mobile
  const handleTouchStart = (e) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };

  const btnStyle = {
    width: '44px', height: '44px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => { if (e.target === containerRef.current) onClose(); }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{ ...btnStyle, position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}
        className="hover-bright"
      >
        <X size={20} />
      </button>

      {/* Media */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          userSelect: 'none',
        }}
      >
        {isVideo ? (
          <video
            src={src}
            autoPlay
            loop
            controls
            playsInline
            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }}
          />
        ) : (
          <img
            src={src}
            alt="Full view"
            draggable={false}
            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }}
          />
        )}
      </div>

      {/* Toolbar */}
      <div style={{
        position: 'absolute',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        padding: '8px',
        borderRadius: '20px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <button onClick={handleZoomIn} style={btnStyle} className="hover-bright" title="Zoom In (+)">
          <ZoomIn size={18} />
        </button>
        <button onClick={handleZoomOut} style={btnStyle} className="hover-bright" title="Zoom Out (-)">
          <ZoomOut size={18} />
        </button>
        <button onClick={handleRotate} style={btnStyle} className="hover-bright" title="Rotate (R)">
          <RotateCw size={18} />
        </button>
        <button onClick={handleReset} style={btnStyle} className="hover-bright" title="Reset (0)">
          <Maximize2 size={18} />
        </button>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)', margin: '4px 0' }} />
        <button onClick={handleDownload} style={btnStyle} className="hover-bright" title="Download">
          <Download size={18} />
        </button>
      </div>

      {/* Zoom indicator */}
      {scale !== 1 && (
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 16px',
          borderRadius: '20px',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          fontSize: '12px',
          fontWeight: '900',
          letterSpacing: '1px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}>
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
};

export default MediaViewer;
