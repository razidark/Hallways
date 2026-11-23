import React, { useState, useMemo } from 'react';
import { usePosts } from '../context/PostContext';
import { Heart, MessageCircle, Film, Repeat2, Image, Play, Sparkles } from 'lucide-react';
import PostOverlay from '../components/PostOverlay';
import SkeletonGrid from '../components/skeleton/SkeletonGrid';

const FILTERS = [
  { key: 'all', label: 'All', icon: <Sparkles size={14} /> },
  { key: 'photos', label: 'Photos', icon: <Image size={14} /> },
  { key: 'videos', label: 'Videos', icon: <Play size={14} /> },
  { key: 'reels', label: 'Reels', icon: <Film size={14} /> },
];

const Explore = () => {
  const { posts, loading } = usePosts();
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    if (activeFilter === 'reels') return posts.filter(p => p.is_reel);
    if (activeFilter === 'videos') return posts.filter(p => 
      !p.is_reel && p.image && (p.image.match(/\.(mp4|webm|mov)$/) || p.image.includes('video'))
    );
    if (activeFilter === 'photos') return posts.filter(p => 
      !p.is_reel && p.image && !(p.image.match(/\.(mp4|webm|mov)$/) || p.image.includes('video'))
    );
    return posts;
  }, [posts, activeFilter]);

  if (loading) return <SkeletonGrid />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      
      {/* Category Filter Bar */}
      <div className="glass-shine" style={{
        display: 'flex',
        gap: '0',
        marginBottom: 'var(--space-lg)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        backdropFilter: 'blur(20px)',
        width: '100%',
        maxWidth: '935px',
        padding: '0 20px',
      }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: 'none',
              borderBottom: activeFilter === f.key 
                ? '2px solid var(--accent-color)' 
                : '2px solid transparent',
              background: 'transparent',
              color: activeFilter === f.key ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textTransform: 'uppercase'
            }}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      <div className="explore-grid" style={{ maxWidth: '935px', width: '100%', padding: '0 20px 20px' }}>
        {filteredPosts.map((post, index) => {
          const isFeatured = index % 6 === 2; // Create a repeating pattern of feature blocks
          return (
            <div 
              key={post.id} 
              className={`explore-item fade-in ${isFeatured ? 'featured' : ''}`} 
              onClick={() => setSelectedPost(post)} 
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {(post.is_reel || (post.image && (post.image.match(/\.(mp4|webm|mov)$/) || post.image.includes('video')))) ? (
                <video 
                  src={post.image || post.repost?.image}
                  className={post.filter_class || ''} 
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <img 
                  src={post.image || post.repost?.image || 'https://placehold.co/600x600/1a1a1a/6366f1?text=Media+Unavailable'} 
                  alt="Explore" 
                  loading="lazy"
                  className={post.filter_class || ''} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x600/1a1a1a/6366f1?text=Media+Unavailable';
                  }}
                />
              )}
              {post.is_reel && <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'white', zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={16} /></div>}
              {post.repost_id && <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Repeat2 size={16} /></div>}
            <div className="explore-overlay" style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '20px',
                color: 'white',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                backdropFilter: 'blur(4px)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><Heart fill="white" size={20} /> {post.likes}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><MessageCircle fill="white" size={20} /> {post.comments?.length || 0}</span>
            </div>
          </div>
        )})}
        
        {filteredPosts.length === 0 && (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px' }}>
              {activeFilter === 'all' ? 'DISCOVERY FEED EMPTY' : `NO ${activeFilter.toUpperCase()} FOUND`}
            </p>
            <p style={{ marginTop: '10px' }}>
              {activeFilter === 'all' 
                ? 'Contribute your first post to expand the network.' 
                : 'Try switching filters or share some content.'}
            </p>
          </div>
        )}
      </div>

      {selectedPost && <PostOverlay post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
};

export default Explore;
