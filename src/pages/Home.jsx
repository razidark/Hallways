import React, { useState, useMemo } from 'react';
import StoryCarousel from '../components/StoryCarousel';
import Post from '../components/Post';
import PostOverlay from '../components/PostOverlay';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import SkeletonPost from '../components/skeleton/SkeletonPost';
import { supabase } from '../lib/supabaseClient';

const Home = () => {
  const { posts, loading, setIsCreateModalOpen } = usePosts();
  const { currentUser } = useAuth();
  const [selectedPost, setSelectedPost] = useState(null);
  const [feedMode, setFeedMode] = useState('foryou'); // 'foryou' | 'following'
  const [followingIds, setFollowingIds] = useState(null); // null = not loaded yet

  // Fetch following IDs when user switches to "Following" tab
  React.useEffect(() => {
    if (feedMode === 'following' && followingIds === null && currentUser) {
      const fetchFollowing = async () => {
        const { data } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUser.id);
        setFollowingIds((data || []).map(f => f.following_id));
      };
      fetchFollowing();
    }
  }, [feedMode, followingIds, currentUser]);

  // Filter posts based on feed mode
  const filteredPosts = useMemo(() => {
    if (feedMode === 'foryou') return posts;
    if (!followingIds) return []; // Still loading
    return posts.filter(p => followingIds.includes(p.user_id));
  }, [posts, feedMode, followingIds]);

  if (loading) return (
     <div className="feed-container">
        <div className="posts-container" style={{ gap: '64px' }}>
           {[1, 2, 3].map(i => <SkeletonPost key={i} />)}
        </div>
     </div>
  );

  return (
    <>
      <div className="feed-container">
        <StoryCarousel />
        
        {/* Feed Toggle */}
        <div className="glass-shine" style={{ 
          display: 'flex', 
          gap: '0', 
          marginBottom: 'var(--space-lg)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          backdropFilter: 'blur(20px)'
        }}>
          <button 
            onClick={() => setFeedMode('foryou')}
            style={{ 
              flex: 1,
              padding: '14px 24px',
              border: 'none',
              background: feedMode === 'foryou' 
                ? 'var(--accent-color)' 
                : 'transparent',
              color: feedMode === 'foryou' ? 'white' : 'var(--text-secondary)',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
              letterSpacing: '0.5px'
            }}
          >
            For You
          </button>
          <button 
            onClick={() => setFeedMode('following')}
            style={{ 
              flex: 1,
              padding: '14px 24px',
              border: 'none',
              borderLeft: '1px solid var(--border-color)',
              background: feedMode === 'following' 
                ? 'var(--accent-color)' 
                : 'transparent',
              color: feedMode === 'following' ? 'white' : 'var(--text-secondary)',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
              letterSpacing: '0.5px'
            }}
          >
            Following
          </button>
        </div>

        <div className="posts-container">
          {filteredPosts.length > 0 ? filteredPosts.map((post, index) => (
            <Post key={post.id} post={post} index={index} onOpenOverlay={() => setSelectedPost(post)} />
          )) : feedMode === 'following' ? (
            <div className="empty-state-card fade-in" style={{ textAlign: 'center', marginTop: 'var(--space-xl)', padding: 'var(--space-xl) var(--space-lg)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', backdropFilter: 'blur(60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
               <div style={{ fontSize: '48px', marginBottom: '8px' }}>👁️</div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)' }}>Your feed is quiet</h2>
                <p style={{ maxWidth: '300px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14px' }}>
                  Follow other users to see their posts here, or switch to "For You" to discover new content.
                </p>
                <button 
                  className="exotic-gradient" 
                  style={{ padding: '14px 28px', borderRadius: '20px', border: 'none', color: 'white', fontWeight: '800', cursor: 'pointer', boxShadow: '0 16px 32px rgba(0,0,0,0.3)' }} 
                  onClick={() => setFeedMode('foryou')}
                >
                   EXPLORE
                </button>
             </div>
           ) : (
             <div className="empty-state-card fade-in" style={{ textAlign: 'center', marginTop: 'var(--space-xl)', padding: 'var(--space-xl) var(--space-lg)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', backdropFilter: 'blur(60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚡</div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)' }}>Welcome</h2>
                <p style={{ maxWidth: '300px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14px' }}>
                  The feed is currently quiet. Be the first to share a moment and illuminate the network.
                </p>
                 <button className="exotic-gradient" style={{ padding: '14px 28px', borderRadius: '20px', border: 'none', color: 'white', fontWeight: '800', cursor: 'pointer', boxShadow: '0 16px 32px rgba(0,0,0,0.3)' }} onClick={() => setIsCreateModalOpen(true)}>
                    SHARE YOUR FIRST MOMENT
                 </button>
            </div>
          )}
        </div>
      </div>
      
      {selectedPost && <PostOverlay post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </>
  );
};

export default Home;
