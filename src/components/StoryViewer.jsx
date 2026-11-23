import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useStories } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { X, ChevronLeft, ChevronRight, Trash2, Pause, Play, Eye } from 'lucide-react';
import Avatar from './Avatar';
import { formatDistanceToNow } from '../lib/utils';

const STORY_DURATION = 6000; // 6 seconds per story

const StoryViewer = () => {
  const { activeStoryGroup, nextStory, prevStory, closeStoryViewer, markStoryViewed, deleteStory } = useStories();
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedRef = useRef(0);

  const currentStory = activeStoryGroup?.stories?.[activeStoryGroup?.currentIndex];
  const isOwnStory = currentStory?.user_id === currentUser?.id;

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.isViewed && !isOwnStory) {
      markStoryViewed(currentStory.id);
    }
  }, [currentStory, isOwnStory, markStoryViewed]);

  // Auto-advance timer
  const startTimer = useCallback(() => {
    if (!currentStory || isPaused) return;

    startTimeRef.current = Date.now();
    
    timerRef.current = requestAnimationFrame(function tick() {
      const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      
      if (pct >= 100) {
        elapsedRef.current = 0;
        nextStory();
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    });
  }, [currentStory, isPaused, nextStory]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      elapsedRef.current += Date.now() - (startTimeRef.current || Date.now());
    }
  }, []);

  // Reset and start timer when story changes
  useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    setImageLoaded(false);
    setIsPaused(false);
    
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [currentStory?.id]);

  // Start timer when image loads or when unpaused
  useEffect(() => {
    if (imageLoaded && !isPaused && currentStory) {
      startTimer();
    }
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [imageLoaded, isPaused, startTimer, currentStory]);

  // Handle pause/resume
  const togglePause = useCallback((e) => {
    e.stopPropagation();
    if (isPaused) {
      setIsPaused(false);
    } else {
      pauseTimer();
      setIsPaused(true);
    }
  }, [isPaused, pauseTimer]);

  // Keyboard navigation
  useEffect(() => {
    if (!activeStoryGroup) return;
    const handleKey = (e) => {
      switch (e.key) {
        case 'ArrowRight': nextStory(); break;
        case 'ArrowLeft': prevStory(); break;
        case 'Escape': closeStoryViewer(); break;
        case ' ':
          e.preventDefault();
          togglePause(e);
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeStoryGroup, nextStory, prevStory, closeStoryViewer, isPaused, togglePause]);

  // Handle click zones (left third = prev, right third = next)
  const handleZoneClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const thirdWidth = rect.width / 3;
    
    if (x < thirdWidth) {
      prevStory();
    } else if (x > thirdWidth * 2) {
      nextStory();
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this story?')) return;
    const res = await deleteStory(currentStory.id);
    if (res.success) {
      nextStory();
    }
  };

  useEffect(() => {
    if (activeStoryGroup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activeStoryGroup]);

  if (!activeStoryGroup || !currentStory) return null;

  return (
    <div 
      className="fade-in"
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: '#000', 
        zIndex: 9999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      {/* ATMOSPHERIC BACKWASH LAYER */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: '-20%', 
          backgroundImage: `url(${currentStory.media_url})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          filter: 'blur(120px) saturate(2.5) brightness(0.35)', 
          opacity: 0.8,
          transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 0
        }} 
      />
      {/* Close button */}
      <button 
        onClick={closeStoryViewer} 
        style={{ 
          position: 'absolute', top: '32px', right: '40px', 
          color: 'white', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', 
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%',
          width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10001, backdropFilter: 'blur(20px)', transition: 'all 0.3s'
        }} 
        className="hover-scale"
      >
        <X size={24} strokeWidth={2.5} />
      </button>

      {/* Prev arrow */}
      <button 
        onClick={prevStory}
        style={{ 
          position: 'absolute', left: 'max(40px, calc(50% - 480px))', 
          color: 'white', background: 'rgba(255,255,255,0.05)', 
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', 
          width: '56px', height: '56px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(20px)', zIndex: 10001 
        }}
        className="hover-scale"
      >
        <ChevronLeft size={28} />
      </button>

      {/* Next arrow */}
      <button 
        onClick={nextStory}
        style={{ 
          position: 'absolute', right: 'max(40px, calc(50% - 480px))', 
          color: 'white', background: 'rgba(255,255,255,0.05)', 
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', 
          width: '56px', height: '56px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(20px)', zIndex: 10001 
        }}
        className="hover-scale"
      >
        <ChevronRight size={28} />
      </button>

      {/* Story Card */}
      <div 
        onClick={handleZoneClick}
        style={{ 
          position: 'relative', 
          width: '480px', 
          maxWidth: '95vw', 
          height: '92vh', 
          maxHeight: '900px',
          backgroundColor: '#0a0a0a', 
          borderRadius: '32px', 
          overflow: 'hidden', 
          border: '1px solid rgba(255,255,255,0.15)', 
          boxShadow: '0 50px 100px rgba(0,0,0,0.9)',
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        {/* Progress bars */}
        <div style={{ 
          position: 'absolute', top: '16px', left: '16px', right: '16px',
          display: 'flex', gap: '6px', zIndex: 20 
        }}>
          {activeStoryGroup.stories.map((s, idx) => (
            <div key={s.id} style={{ 
              flex: 1, height: '4px', 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              borderRadius: '10px', 
              overflow: 'hidden',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ 
                height: '100%', 
                backgroundColor: 'white', 
                borderRadius: '10px',
                width: idx < activeStoryGroup.currentIndex ? '100%' 
                     : idx === activeStoryGroup.currentIndex ? `${progress}%` 
                     : '0%',
                transition: idx === activeStoryGroup.currentIndex ? 'none' : 'width 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
                boxShadow: '0 0 10px rgba(255,255,255,0.5)' 
              }} />
            </div>
          ))}
        </div>

        {/* User info header */}
        <div style={{ 
          position: 'absolute', top: '28px', left: '16px', right: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 20 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar 
              src={activeStoryGroup.avatar_url} 
              username={activeStoryGroup.username}
              borderStyle={activeStoryGroup.border_style}
              avatarShape="circle"
              size="36px"
            />
            <div>
              <span style={{ 
                color: 'white', fontWeight: '800', fontSize: '14px',
                textShadow: '0 2px 8px rgba(0,0,0,0.8)' 
              }}>
                {activeStoryGroup.username}
              </span>
              <span style={{ 
                color: 'rgba(255,255,255,0.6)', fontSize: '11px', 
                marginLeft: '8px', textShadow: '0 2px 8px rgba(0,0,0,0.8)' 
              }}>
                {formatDistanceToNow(currentStory.created_at)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Pause/Play */}
            <button 
              onClick={togglePause}
              style={{ 
                background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}
            >
              {isPaused ? <Play size={14} fill="white" /> : <Pause size={14} />}
            </button>

            {/* Delete (own stories only) */}
            {isOwnStory && (
              <button 
                onClick={handleDelete}
                style={{ 
                  background: 'rgba(239,68,68,0.3)', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Story media */}
        {!imageLoaded && (
          <div style={{ 
            position: 'absolute', inset: 0, display: 'flex', 
            alignItems: 'center', justifyContent: 'center' 
          }}>
            <div className="spinner" style={{ position: 'relative' }} />
          </div>
        )}

        {!currentStory.media_url ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' }}>
            MEDIA UNREACHABLE
          </div>
        ) : (currentStory.media_type === 'video' || (currentStory.media_url?.match(/\.(mp4|webm|mov)$/) && !currentStory.media_url?.includes('.gif'))) ? (
          <video
            key={currentStory.id}
            src={currentStory.media_url}
            className={currentStory.filter_class || ''}
            autoPlay
            muted
            playsInline
            onLoadedData={() => setImageLoaded(true)}
            style={{ 
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' 
            }}
          />
        ) : (
          <img
            key={currentStory.id}
            src={currentStory.media_url}
            alt="Story"
            className={currentStory.filter_class || ''}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/600x1000/1a1a1a/6366f1?text=Vision+Lost';
              setImageLoaded(true);
            }}
            style={{ 
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' 
            }}
          />
        )}

        {/* Bottom gradient overlay */}
        <div style={{ 
          position: 'absolute', bottom: 0, left: 0, right: 0, 
          height: '160px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          pointerEvents: 'none', zIndex: 10
        }} />

        {/* Caption (if exists) */}
        {currentStory.caption && (
          <div style={{ 
            position: 'absolute', bottom: '24px', left: '20px', right: '20px',
            zIndex: 20 
          }}>
            <p style={{ 
              color: 'white', fontSize: '15px', fontWeight: '500',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)', 
              lineHeight: 1.5 
            }}>
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Viewer count for own stories */}
        {isOwnStory && (
          <div style={{ 
            position: 'absolute', bottom: '20px', left: '20px',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: 'rgba(255,255,255,0.6)', zIndex: 20 
          }}>
            <Eye size={14} />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>Your story</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
