import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, MoreHorizontal, Music2, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { usePosts } from '../context/PostContext';
import Avatar from '../components/Avatar';

const ReelItem = ({ reel, isMuted, setIsMuted, toggleLike }) => {
  const videoRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [localLiked, setLocalLiked] = useState(reel.isLiked);
  const [likesCount, setLikesCount] = useState(reel.likes);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
      },
      { threshold: 0.8 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const handleLike = () => {
    setLocalLiked(!localLiked);
    setLikesCount(prev => localLiked ? prev - 1 : prev + 1);
    toggleLike(reel.id);
  };

  return (
    <div className="reel-viewer" onClick={() => setIsMuted(!isMuted)}>
      <div className="reel-media">
        {(reel.image?.match(/\.(mp4|webm|mov)$/) || reel.image?.includes('video')) ? (
          <video 
            ref={videoRef}
            src={reel.image} 
            className={reel.filter_class} 
            loop 
            muted={isMuted}
            playsInline
          />
        ) : (
          <img src={reel.image} alt="Reel" className={reel.filter_class} />
        )}
        <div className="reel-overlay-gradient"></div>
      </div>

      <div className="reel-info" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar src={reel.user?.avatar} username={reel.user?.username} borderStyle={reel.user?.borderStyle} size="40px" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '900', fontSize: '15px', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{reel.user?.username}</span>
            <span style={{ fontSize: '10px', color: 'var(--accent-color)', fontWeight: '900', letterSpacing: '1px' }}>REEL • ORIGINAL AUDIO</span>
          </div>
          <button className="hover-bright" style={{ background: 'var(--accent-color)', border: 'none', color: 'var(--bg-primary)', padding: '6px 14px', borderRadius: 'var(--radius-md)', fontSize: '11px', fontWeight: '900', marginLeft: '10px', cursor: 'pointer' }}>FOLLOW</button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', lineHeight: '1.5', maxWidth: '320px' }}>{reel.caption}</p>
        <div className="reel-music-tag">
          <Music2 size={12} color="white" />
          <div className="reel-music-scroll-container">
            <div className="reel-music-scroll">
              {reel.music || 'Original Audio'} • {reel.user?.username} • Original Audio • {reel.music || 'Original Audio'}
            </div>
          </div>
        </div>
      </div>

      <div className="reel-actions" onClick={(e) => e.stopPropagation()}>
        <div className="reel-action-item">
          <button onClick={handleLike} className="hover-scale" style={{ color: localLiked ? '#ff3040' : 'white', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <Heart size={32} fill={localLiked ? '#ff3040' : 'none'} />
          </button>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: '900' }}>{likesCount}</span>
        </div>
        <div className="reel-action-item">
          <button className="hover-scale" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><MessageCircle size={32} /></button>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: '900' }}>{reel.comments?.length || 0}</span>
        </div>
        <button className="hover-scale" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><Send size={30} /></button>
        <button onClick={() => setIsMuted(!isMuted)} className="hover-scale" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
          {isMuted ? <VolumeX size={30} /> : <Volume2 size={30} />}
        </button>
        <button className="hover-scale" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><MoreHorizontal size={30} /></button>
        <div className="reel-vinyl-container">
          <div className="reel-vinyl">
            <img src={reel.user?.avatar} alt="vinyl" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Reels = () => {
  const { posts, globalPosts, toggleLike, setIsCreateModalOpen } = usePosts();
  const [isMuted, setIsMuted] = useState(true);
  
  const allPosts = [...posts, ...globalPosts];
  const uniqueReels = Array.from(new Set(allPosts.filter(p => p.is_reel).map(p => p.id)))
    .map(id => allPosts.find(p => p.id === id));

  return (
    <div className="reels-container fade-in">
      <div className="reels-stack">
        {uniqueReels.length > 0 ? uniqueReels.map(reel => (
          <ReelItem key={reel.id} reel={reel} isMuted={isMuted} setIsMuted={setIsMuted} toggleLike={toggleLike} />
        )) : (
          <div className="reels-empty">
            <div className="rainbow-logo-container" style={{ width: '100px', height: '100px', borderRadius: '40px', marginBottom: '32px' }}>
              <Sparkles size={48} color="white" />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '900' }}>No Reels Found</h3>
            <p style={{ opacity: 0.6, marginTop: '8px' }}>Be the first to share a vertical video.</p>
            <button onClick={() => setIsCreateModalOpen(true)} className="exotic-gradient hover-scale" style={{ marginTop: '32px', padding: '12px 32px', borderRadius: '16px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Create Reel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reels;
