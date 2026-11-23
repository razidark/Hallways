import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useStories } from '../context/StoryContext';
import { usePosts } from '../context/PostContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Avatar from './Avatar';
import { ChevronLeft, Loader2, UserCircle } from 'lucide-react';
import AdminBadge from './AdminBadge';
import { isUserAdmin } from '../lib/utils';

const Suggestions = () => {
  const { currentUser, logout, toggleFollow, updateProfile } = useAuth();
  const { stories, openStoryGroup } = useStories();
  const { trendingTags } = usePosts();
  const [suggestedUsers, setSuggestedUsers] = React.useState([]);
  const [followingIds, setFollowingIds] = React.useState([]);
  const [statusVal, setStatusVal] = React.useState(currentUser?.status || "");
  // Unused state removed to satisfy strict linting
  // const [isSyncing, setIsSyncing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadingFollows, setLoadingFollows] = React.useState({});
  const [showAll, setShowAll] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState([]);
  const [allLoading, setAllLoading] = React.useState(false);

  const navigate = useNavigate();

  // Sync initial status when user loads
  React.useEffect(() => {
    if (currentUser?.status) setStatusVal(currentUser.status);
  }, [currentUser?.status]);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      // 1. Get the list of users we already follow
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser?.id);
      
      const fIds = (followingData || []).map(f => f.following_id);
      setFollowingIds(fIds);

      // 2. Get profiles excluding ourselves
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser?.id)
        .limit(15);
      
      if (data) {
        const notFollowed = data.filter(u => !fIds.includes(u.id));
        const followed = data.filter(u => fIds.includes(u.id));
        const mixed = [...notFollowed, ...followed].slice(0, 5);
        setSuggestedUsers(mixed);
      }
      setLoading(false);
    };

    if (currentUser) fetchSuggestions();
  }, [currentUser]);

  const fetchAllUsers = async () => {
    setAllLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUser?.id)
      .limit(50);
    if (data) setAllUsers(data);
    setAllLoading(false);
  };

  const handleSeeAll = () => {
    setShowAll(true);
    fetchAllUsers();
  };

  const handleFollowToggle = async (userId) => {
    setLoadingFollows(prev => ({ ...prev, [userId]: true }));
    const res = await toggleFollow(userId);
    if (res?.success) {
      setFollowingIds(prev => 
          res.isFollowing 
            ? [...prev, userId] 
            : prev.filter(id => id !== userId)
      );
    }
    setLoadingFollows(prev => ({ ...prev, [userId]: false }));
  };

  const handleStatusSubmit = async (e) => {
    if (e.key === 'Enter' && statusVal !== currentUser?.status) {
      await updateProfile({ status: statusVal });
      e.target.blur();
    } else if (e.key === 'Enter') {
      e.target.blur();
    }
  };
  
  return (
    <div className="suggestions-pillar fade-in hover-lift glass-shine" style={{ padding: 'clamp(16px, 2vw, 24px)', backgroundColor: 'var(--bg-secondary)', backdropFilter: 'blur(40px)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
      {/* Current User Header */}
      <div className="suggestions-profile" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div onClick={() => navigate(`/profile/${currentUser?.username}`)} className="pointer">
          <Avatar src={currentUser?.avatar_url} username={currentUser?.username} borderStyle={currentUser?.border_style} avatarShape={currentUser?.avatar_shape} size="56px" />
        </div>
        <div className="username-block" style={{ cursor: 'pointer', flex: 1 }} onClick={() => navigate(`/profile/${currentUser?.username}`)}>
          <h4 className="username" style={{ fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {currentUser?.username}
            {isUserAdmin(currentUser) && <AdminBadge size={14} />}
          </h4>
          <p className="name" style={{ fontSize: '12px', opacity: 0.5 }}>{currentUser?.full_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          <button 
            onClick={() => navigate('/settings')}
            className="hover-bg" 
            style={{ color: 'var(--text-primary)', fontSize: '11px', fontWeight: '900', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px' }}
          >
            <UserCircle size={14} /> EDIT PROFILE
          </button>
          <button 
            onClick={logout} 
            className="hover-bg" 
            style={{ color: 'var(--accent-color)', fontSize: '11px', fontWeight: '900', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(var(--accent-color-rgb), 0.1)', border: 'none', transition: 'all 0.2s', letterSpacing: '0.5px' }}
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* THE PULSE - Mini Story Preview */}
      {stories.find(g => g.userId === currentUser?.id) && (
        <div 
          onClick={() => {
            const group = stories.find(g => g.userId === currentUser?.id);
            if (group) openStoryGroup(group);
          }}
          className="hover-scale pointer" 
          style={{ 
            marginBottom: '24px', 
            borderRadius: 'var(--radius-md)', 
            overflow: 'hidden', 
            position: 'relative', 
            aspectRatio: '16/9',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '16px'
          }}
        >
          <img 
            src={stories.find(g => g.userId === currentUser?.id)?.stories.slice(-1)[0]?.media_url} 
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} 
            alt="Pulse preview"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <p style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '2px', marginBottom: '4px' }}>THE PULSE</p>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>Your Active Story</h4>
          </div>
          <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 10px var(--accent-color)' }}></div>
        </div>
      )}



      {/* QUICK STATUS BAR */}
      <div className="status-bar" style={{ marginBottom: '32px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '1px' }}>STATUS MESSAGE</p>
          <input 
             value={statusVal}
             onChange={(e) => setStatusVal(e.target.value)}
             onKeyDown={handleStatusSubmit}
             placeholder="What's on your mind?..."
             style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '500' }}
          />
       </div>
       
          <div className="trending-section" style={{ marginTop: '32px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '1px' }}>TRENDING</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {trendingTags && trendingTags.length > 0 ? (
              trendingTags.map(tag => (
                <Link 
                  key={tag} 
                  to={`/explore?q=${encodeURIComponent(tag.replace('#', ''))}`}
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: '700', 
                    color: 'var(--accent-color)', 
                    padding: '4px 10px', 
                    borderRadius: 'var(--radius-sm)', 
                    background: 'rgba(var(--accent-color-rgb), 0.1)',
                    border: '1px solid rgba(var(--accent-color-rgb), 0.2)',
                    textDecoration: 'none'
                  }}>{tag}</Link>
              ))
            ) : (
              <span style={{ fontSize: '12px', opacity: 0.5 }}>No active hashtags found</span>
            )}
          </div>
        </div>
       
       {/* SEE ALL EXPANDED VIEW */}
      {showAll ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="suggestions-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => setShowAll(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} className="hover-scale">
                <ChevronLeft size={20} />
              </button>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>All Users</h4>
            </div>
            <span style={{ fontSize: '11px', opacity: 0.4 }}>{allUsers.length} found</span>
          </div>
          <div className="suggestions-list scrollbar-hidden" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '50vh', paddingRight: '4px' }}>
            {allLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" style={{ position: 'relative' }}></div></div>
            ) : allUsers.map(s => {
              const isFollowed = followingIds.includes(s.id);
              return (
                <div key={s.id} className="suggestion-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div onClick={() => navigate(`/profile/${s.username}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}>
                     <Avatar src={s.avatar_url} username={s.username} borderStyle={s.border_style} size="40px" />
                     <div className="username-block">
                       <h5 className="username" style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         {s.username}
                         {isUserAdmin(s) && <AdminBadge size={12} />}
                       </h5>
                       <p className="reason" style={{ fontSize: '11px', opacity: 0.5 }}>{isFollowed ? 'Following' : 'Suggested'}</p>
                     </div>
                   </div>
                   <button 
                     onMouseOver={e => e.currentTarget.style.filter='brightness(1.5)'}
                     onMouseOut={e => e.currentTarget.style.filter='brightness(1)'}
                     onClick={() => handleFollowToggle(s.id)}
                     style={{ 
                       color: isFollowed ? 'var(--text-secondary)' : 'var(--accent-color)', 
                       fontSize: '12px', 
                       fontWeight: 'bold', 
                       background: isFollowed ? 'rgba(255,255,255,0.05)' : 'transparent', 
                       border: isFollowed ? '1px solid var(--border-color)' : 'none',
                       padding: isFollowed ? '6px 14px' : '0',
                       borderRadius: '10px',
                       transition: 'all 0.2s',
                       cursor: 'pointer'
                     }}
                   >
                     {loadingFollows[s.id] ? <Loader2 size={12} className="spin" /> : (isFollowed ? 'Following' : 'Follow')}
                   </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="suggestions-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', opacity: 0.6 }}>Suggested for you</h4>
            <button onClick={handleSeeAll} style={{ fontSize: '12px', fontWeight: 'bold', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }} className="hover-underline">See All</button>
          </div>
          
          <div className="suggestions-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {suggestedUsers.length > 0 ? suggestedUsers.map((s, idx) => {
              const isFollowed = followingIds.includes(s.id);
              return (
                <div key={s.id} className="suggestion-item fade-in" style={{ display: 'flex', alignItems: 'center', gap: '12px', animationDelay: `${idx * 0.1}s`, animationFillMode: 'both' }}>
                   <div onClick={() => navigate(`/profile/${s.username}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}>
                     <Avatar src={s.avatar_url} username={s.username} borderStyle={s.border_style} size="40px" />
                     <div className="username-block">
                       <h5 className="username" style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         {s.username}
                         {isUserAdmin(s) && <AdminBadge size={12} />}
                       </h5>
                       <p className="reason" style={{ fontSize: '11px', opacity: 0.5 }}>{isFollowed ? 'Following' : 'Suggested'}</p>
                     </div>
                   </div>
                   <button 
                     onMouseOver={e => e.currentTarget.style.filter='brightness(1.5)'}
                     onMouseOut={e => e.currentTarget.style.filter='brightness(1)'}
                     onClick={() => handleFollowToggle(s.id)}
                     style={{ 
                       color: isFollowed ? 'var(--text-secondary)' : 'var(--accent-color)', 
                       fontSize: '12px', 
                       fontWeight: 'bold', 
                       background: isFollowed ? 'rgba(255,255,255,0.05)' : 'transparent', 
                       border: isFollowed ? '1px solid var(--border-color)' : 'none',
                       padding: isFollowed ? '6px 14px' : '0',
                       borderRadius: '10px',
                       transition: 'all 0.2s',
                       cursor: 'pointer'
                     }}
                   >
                     {loadingFollows[s.id] ? <Loader2 size={12} className="spin" /> : (isFollowed ? 'Following' : 'Follow')}
                   </button>
                </div>
              );
            }) : !loading && (
              <p style={{ fontSize: '12px', opacity: 0.5, textAlign: 'center' }}>No suggestions available.</p>
            )}
          </div>
        </>
      )}
      
      <div className="footer-links" style={{ marginTop: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px', opacity: 0.8, justifyContent: 'center' }}>
           <Link to="/help/about" style={{ textDecoration: 'none', color: 'inherit' }} className="hover-underline">About</Link>
           <span>·</span>
           <Link to="/help/privacy" style={{ textDecoration: 'none', color: 'inherit' }} className="hover-underline">Privacy</Link>
           <span>·</span>
           <Link to="/help/terms" style={{ textDecoration: 'none', color: 'inherit' }} className="hover-underline">Terms</Link>
           <span>·</span>
           <Link to="/help/api" style={{ textDecoration: 'none', color: 'inherit' }} className="hover-underline">Connect</Link>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0.8 }}>
           <div style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '2px', color: 'var(--text-primary)' }}>
              © 2026 HALLWAYS | BETA v1.0
           </div>
           <div className="rainbow-text" style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px' }}>
              CRAFTED FOR THE NETWORK
           </div>
        </div>
      </div>
    </div>
  );
};

export default Suggestions;
