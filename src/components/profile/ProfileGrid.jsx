import React from 'react';
import { PlaySquare, Repeat2, Plus, Heart, MessageSquare } from 'lucide-react';

const ProfileGrid = ({ displayPosts, setSelectedPost }) => {
  return (
    <div className="profile-grid">
      {displayPosts.map(post => (
         <div key={post.id} onClick={() => setSelectedPost(post)} className="explore-item fade-in" style={{ aspectRatio: '1/1', cursor: 'pointer', overflow: 'hidden', position: 'relative', borderRadius: '12px' }}>
           {(post.is_reel || (post.image && (post.image.match(/\.(mp4|webm|mov)$/) || post.image.includes('video')))) ? (
             <video 
               src={post.image || post.repost?.image}
               className={post.filter_class || post.repost?.filter_class || ''} 
               autoPlay
               loop
               muted
               playsInline
               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
             />
           ) : (
             <img 
                src={post.image || post.repost?.image || 'https://placehold.co/600x600/1a1a1a/6366f1?text=Media+Unavailable'} 
                alt="Post" 
                loading="lazy" 
                className={post.filter_class || post.repost?.filter_class || ''} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => {
                  e.target.onerror = null;
                   e.target.src = 'https://placehold.co/600x600/1a1a1a/6366f1?text=Media+Unavailable';
                }}
             />
           )}
           {post.is_reel && <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'white', zIndex: 10 }}><PlaySquare size={20} /></div>}
           {(post.repost_id || post.repost) && <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'white', zIndex: 10 }}><Repeat2 size={20} /></div>}
           {post.is_pinned && <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--accent-color)', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', padding: '4px', zIndex: 10 }}><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></div>}
           <div className="grid-item-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', color: 'white', opacity: 0, transition: 'opacity 0.2s', zIndex: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Heart fill="white" size={20} /> <span style={{ fontWeight: 'bold' }}>{post.likes}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare fill="white" size={20} /> <span style={{ fontWeight: 'bold' }}>{post.comments?.length || 0}</span></div>
           </div>
         </div>
      ))}
      {displayPosts.length === 0 && <p style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '60px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No posts found here yet.</p>}
    </div>
  );
};

export default ProfileGrid;
