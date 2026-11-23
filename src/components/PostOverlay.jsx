import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Post from './Post';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePosts } from '../context/PostContext';

const PostOverlay = ({ post: initialPost, onClose }) => {
  const { posts, fetchPostById } = usePosts();
  const [activePostId, setActivePostId] = useState(initialPost?.id);
  const [fetchedPost, setFetchedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Always use the latest version of the post from context to ensure live comment/like updates
  const postFromContext = posts.find(p => p.id === activePostId);
  const post = postFromContext || fetchedPost;

  useEffect(() => {
    if (activePostId && !postFromContext) {
      setLoading(true);
      fetchPostById(activePostId).then(p => {
        if (p) {
          setFetchedPost(p);
        }
        setLoading(false);
      });
    } else {
      setFetchedPost(null);
    }
  }, [activePostId, postFromContext, fetchPostById]);

  const currentIndex = posts.findIndex(p => p.id === activePostId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < posts.length - 1;

  const navigatePrev = React.useCallback((e) => {
    e?.stopPropagation();
    if (hasPrev) setActivePostId(posts[currentIndex - 1].id);
  }, [currentIndex, hasPrev, posts]);

  const navigateNext = React.useCallback((e) => {
    e?.stopPropagation();
    if (hasNext) setActivePostId(posts[currentIndex + 1].id);
  }, [currentIndex, hasNext, posts]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Keyboard Support
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') navigatePrev();
      if (e.key === 'ArrowRight') navigateNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, navigatePrev, navigateNext]); // Re-bind when navigation handlers change

  if (loading) {
    return createPortal(
      <div className="fade-in" style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(30px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3000,
      }} onClick={onClose}>
        <div style={{ color: 'white', fontFamily: 'Space Grotesk', fontWeight: '900', letterSpacing: '2px' }} className="pulse">
          RETRIEVING SIGNAL...
        </div>
      </div>,
      document.body
    );
  }

  if (!post) return null;

  return createPortal(
    <div className="fade-in" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(30px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3000,
      padding: 'clamp(0px, 3vw, 40px)'
    }} onClick={onClose}>
      
      {/* Top Right Close */}
      <button 
        onClick={onClose} 
        style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7, zIndex: 10 }}
        className="hover-bright"
      >
        <X size={40} />
      </button>

      {/* Floating Carousel Arrows */}
      {hasPrev && (
        <button onClick={navigatePrev} className="hover-scale" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: 'none', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 10 }}>
          <ChevronLeft size={30} />
        </button>
      )}
      
      {hasNext && (
        <button onClick={navigateNext} className="hover-scale" style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: 'none', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 10 }}>
          <ChevronRight size={30} />
        </button>
      )}

      <div 
        className="post-overlay-container glass-overlay" 
        style={{ 
          width: '100%', 
          maxWidth: '1200px', 
          height: '85vh', 
          display: 'flex', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden',
          backgroundColor: 'var(--bg-primary)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* REUSING Post Component Logic with specialized Styling for Overlay */}
        <div style={{ flex: 1, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
           {(!post.image && !post.repost?.image) ? (
             <div style={{ opacity: 0.5 }}>Media missing...</div>
           ) : (post.is_reel || (post.image || post.repost?.image)?.match(/\.(mp4|webm|mov)$/)) ? (
             <video 
               src={post.image || post.repost?.image} 
               className={post.filter_class || post.repost?.filter_class}
               style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
               autoPlay loop muted playsInline
             />
           ) : (
             <img 
               src={post.image || post.repost?.image} 
               className={post.filter_class || post.repost?.filter_class}
               style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
               alt="Post" 
             />
           )}
        </div>
        
        <div className="scrollbar-hidden" style={{ width: 'clamp(300px, 35%, 450px)', flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
           <Post post={post} isOverlay={true} />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PostOverlay;
