import React, { useState, useEffect } from 'react';
import { Search, X, Clock, Sparkles, ArrowLeft, Users, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { supabase } from '../lib/supabaseClient';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import AdminBadge from './AdminBadge';
import { isUserAdmin, isUserVerified } from '../lib/utils';

const SearchOverlay = () => {
  const [query, setQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const { setActiveOverlay } = useUI();
  const { currentUser } = useAuth();
  const { posts } = usePosts();
  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('hallway_recent_searches');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [focused, setFocused] = useState(false);

  const saveRecentSearch = (user) => {
    const updated = [user, ...recentSearches.filter(i => i.id !== user.id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('hallway_recent_searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('hallway_recent_searches');
  };

  const removeRecentItem = (e, userId) => {
    e.stopPropagation();
    const updated = recentSearches.filter(i => i.id !== userId);
    setRecentSearches(updated);
    localStorage.setItem('hallway_recent_searches', JSON.stringify(updated));
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser?.id)
        .limit(5);
      if (data) setSuggestedUsers(data);
    };
    if (currentUser) fetchSuggestions();
  }, [currentUser]);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setFilteredUsers([]);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);
      
      if (data) setFilteredUsers(data);
    };
    
    const delayDebounceFn = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const filteredPosts = query
    ? posts.filter(p => p.caption?.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  const handleUserClick = (user) => {
    saveRecentSearch({
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      full_name: user.full_name,
      border_style: user.border_style,
      avatar_shape: user.avatar_shape
    });
    navigate(`/profile/${user.username}`);
    setActiveOverlay(null);
  };

  return (
    <div className="search-container fade-in" style={{ display: 'flex', flexDirection: 'column', maxHeight: 'inherit' }}>
       
       {/* Cinematic Header */}
       <div style={{ padding: '32px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
             <div className="rainbow-logo-container" style={{ width: '32px', height: '32px', borderRadius: '10px' }}>
                <Search size={18} color="white" />
             </div>
             <div>
                <h2 style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '1px', fontFamily: 'Space Grotesk' }}>DISCOVERY ENGINE</h2>
                <p style={{ fontSize: '10px', opacity: 0.5, fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>Spatial Identity Search</p>
             </div>
          </div>

          <div style={{ position: 'relative' }}>
             <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} />
             <input 
               autoFocus
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onFocus={() => setFocused(true)}
               onBlur={() => setFocused(false)}
               placeholder="Search nodes or signals..."
               style={{ 
                   width: '100%', 
                   padding: '16px 16px 16px 48px', 
                   background: 'rgba(255,255,255,0.03)', 
                   border: `1px solid ${focused ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'}`, 
                   borderRadius: '16px', 
                   outline: 'none', 
                   color: 'var(--text-primary)', 
                   fontSize: '14px',
                   transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                   boxShadow: focused ? '0 0 20px rgba(var(--accent-color-rgb), 0.15)' : 'none'
               }}
             />
             {query && (
               <button 
                 onClick={() => setQuery('')} 
                 style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', padding: '6px', opacity: 0.4, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', border: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
               >
                 <X size={12} />
               </button>
             )}
          </div>
       </div>

       <div className="scrollbar-hidden" style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {!query ? (
            <>
               {/* RECENT SEARCHES */}
               {recentSearches.length > 0 && (
                 <div style={{ marginBottom: '32px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 12px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={12} style={{ opacity: 0.4 }} />
                        <span style={{ fontSize: '11px', fontWeight: '900', opacity: 0.4, letterSpacing: '1px' }}>RECENT NODES</span>
                     </div>
                     <button onClick={clearRecentSearches} className="hover-bright" style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>PURGE ALL</button>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                   {recentSearches.map(user => (
                     <div key={user.id} className="notification-item-glass hover-scale" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '18px', cursor: 'pointer', marginBottom: '4px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} onClick={() => handleUserClick(user)}>
                        <Avatar src={user.avatar_url} username={user.username} borderStyle={user.border_style} avatarShape={user.avatar_shape} size="36px" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                           <p style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{user.username}</p>
                           <p style={{ fontSize: '11px', opacity: 0.4, fontWeight: '700' }}>{user.full_name}</p>
                        </div>
                        <button onClick={(e) => removeRecentItem(e, user.id)} style={{ padding: '8px', opacity: 0.3, background: 'transparent', border: 'none', color: 'var(--text-primary)' }} className="hover-bright">
                            <X size={14} />
                        </button>
                     </div>
                   ))}
                   </div>
                 </div>
               )}

               {/* SUGGESTED ACCOUNTS */}
               <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px 12px' }}>
                     <Sparkles size={12} style={{ opacity: 0.4 }} />
                     <span style={{ fontSize: '11px', fontWeight: '900', opacity: 0.4, letterSpacing: '1px' }}>SUGGESTED NODES</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                  {suggestedUsers.map(user => (
                    <div key={user.id} className="notification-item-glass hover-scale" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '18px', cursor: 'pointer', marginBottom: '4px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} onClick={() => handleUserClick(user)}>
                       <Avatar src={user.avatar_url} username={user.username} borderStyle={user.border_style} avatarShape={user.avatar_shape} size="36px" />
                       <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{user.username}</p>
                          <p style={{ fontSize: '11px', opacity: 0.4, fontWeight: '700' }}>{user.full_name}</p>
                       </div>
                    </div>
                  ))}
                  </div>
               </div>
            </>
          ) : (
            <>
               {/* SEARCH RESULTS */}
               {filteredUsers.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px 12px' }}>
                        <Users size={12} style={{ opacity: 0.4 }} />
                        <span style={{ fontSize: '11px', fontWeight: '900', opacity: 0.4, letterSpacing: '1px' }}>MATCHING NODES</span>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                     {filteredUsers.map(user => (
                       <div key={user.id} className="notification-item-glass hover-scale" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '18px', cursor: 'pointer', marginBottom: '4px', backgroundColor: 'rgba(var(--accent-color-rgb), 0.05)', border: '1px solid rgba(var(--accent-color-rgb), 0.15)' }} onClick={() => handleUserClick(user)}>
                          <Avatar src={user.avatar_url} username={user.username} borderStyle={user.border_style} avatarShape={user.avatar_shape} size="40px" />
                           <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <p style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-primary)' }}>{user.username}</p>
                                {isUserAdmin(user) && <AdminBadge size={14} />}
                                {isUserVerified(user) && !isUserAdmin(user) && <VerifiedBadge size={14} />}
                              </div>
                              <p style={{ fontSize: '11px', opacity: 0.4, fontWeight: '700' }}>{user.full_name}</p>
                          </div>
                       </div>
                     ))}
                     </div>
                  </div>
               )}

               {filteredPosts.length > 0 && (
                  <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px 12px' }}>
                        <Layout size={12} style={{ opacity: 0.4 }} />
                        <span style={{ fontSize: '11px', fontWeight: '900', opacity: 0.4, letterSpacing: '1px' }}>RELEVANT SIGNALS</span>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '4px' }}>
                        {filteredPosts.map(post => (
                           <div 
                               key={post.id} 
                               onClick={() => { navigate(`/profile/${post.user.username}`); setActiveOverlay(null); }} 
                               className="hover-scale"
                               style={{ aspectRatio: '1/1', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
                           >
                              <img src={post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {filteredUsers.length === 0 && filteredPosts.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '80px 20px', opacity: 0.3 }}>
                     <Search size={40} style={{ marginBottom: '24px' }} />
                     <h3 style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px' }}>SIGNAL LOST</h3>
                     <p style={{ fontSize: '11px', marginTop: '8px' }}>No matches found for "{query}"</p>
                  </div>
               )}
            </>
          )}
       </div>

       {/* Footer */}
       <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <button 
            onClick={() => setActiveOverlay(null)}
            className="action-pill hover-scale"
            style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '1px', fontSize: '12px' }}
          >
            CLOSE ENGINE
          </button>
       </div>
    </div>
  );
};

export default SearchOverlay;
