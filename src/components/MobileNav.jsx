import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Film, MessageCircle, PlusSquare, Globe, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { useNotifications } from '../context/NotificationContext';
import Avatar from './Avatar';

/**
 * Bottom navigation for small screens.
 *
 * The desktop sidebar exposes Home, Search, Explore, Reels, Global,
 * Messages, Notifications and Profile (plus Admin HUD for admins). The
 * previous mobile bar only carried five of those, so on a phone you could
 * not reach Reels, Global or Notifications at all.
 *
 * A sixth destination needs room, but six icons do not fit in 360px
 * without crowding, so Global and Notifications share a "More" slot that
 * opens a small sheet. Every desktop destination stays reachable.
 */
const MobileNav = () => {
  const { currentUser } = useAuth();
  const { setIsCreateModalOpen } = usePosts();
  const { notifications } = useNotifications();
  const [showMore, setShowMore] = React.useState(false);

  // Close the sheet if the viewport grows past the mobile breakpoint.
  React.useEffect(() => {
    if (!showMore) return;
    const mq = window.matchMedia('(min-width: 769px)');
    const onChange = (e) => { if (e.matches) setShowMore(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [showMore]);

  const unreadCount = (notifications || []).filter(n => !n.is_read).length;

  const handleCreate = (e) => {
    e.preventDefault();
    setShowMore(false);
    setIsCreateModalOpen(true);
  };

  const closeMore = () => setShowMore(false);

  return (
    <>
      {showMore && (
        <>
          <div
            onClick={closeMore}
            style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.5)' }}
          />
          <div
            role="dialog"
            aria-label="More navigation"
            style={{
              position: 'fixed',
              bottom: 76,
              left: '12px',
              right: '12px',
              zIndex: 999,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              animation: 'slide-up 0.22s ease-out',
              maxWidth: '420px',
              margin: '0 auto',
            }}
          >
            <NavLink to="/explore" onClick={closeMore} className="mobile-sheet-item">
              <Search size={20} /> <span>Explore</span>
            </NavLink>
            <NavLink to="/reels" onClick={closeMore} className="mobile-sheet-item">
              <Film size={20} /> <span>Reels</span>
            </NavLink>
            <NavLink to="/global" onClick={closeMore} className="mobile-sheet-item">
              <Globe size={20} /> <span>Global</span>
            </NavLink>
            <NavLink to="/notifications" onClick={closeMore} className="mobile-sheet-item">
              <Heart size={20} />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--accent-color)',
                  color: 'var(--button-text, #fff)',
                  borderRadius: '999px',
                  padding: '1px 8px',
                  fontSize: '11px',
                  fontWeight: '900',
                }}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
            {currentUser && (
              <NavLink
                to={`/profile/${currentUser.username}`}
                onClick={closeMore}
                className="mobile-sheet-item"
              >
                <Avatar
                  src={currentUser?.avatar_url}
                  username={currentUser?.username}
                  size="24px"
                  borderStyle={currentUser?.border_style}
                  avatarShape={currentUser?.avatar_shape}
                />
                <span>My Profile</span>
              </NavLink>
            )}
          </div>
        </>
      )}

      <div className="mobile-nav">
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          {({ isActive }) => <Home size={22} strokeWidth={isActive ? 2.5 : 2} />}
        </NavLink>

        <NavLink to="/explore" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          {({ isActive }) => <Search size={22} strokeWidth={isActive ? 2.5 : 2} />}
        </NavLink>

        <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={handleCreate}
            className="hover-scale"
            aria-label="Create post"
            style={{
              background: 'var(--exotic-gradient)',
              color: 'white',
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(var(--accent-color-rgb), 0.4)',
              border: 'none',
              transform: 'translateY(-12px)'
            }}
          >
            <PlusSquare size={24} strokeWidth={2.5} />
          </button>
        </div>

        <NavLink to="/messages" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          {({ isActive }) => <MessageCircle size={22} strokeWidth={isActive ? 2.5 : 2} />}
        </NavLink>

        <button
          onClick={() => setShowMore(v => !v)}
          aria-label="More options"
          aria-expanded={showMore}
          className={`mobile-nav-item ${showMore ? 'active' : ''}`}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}
        >
          <MoreIcon />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-color)',
              border: '2px solid var(--bg-secondary)',
              boxSizing: 'content-box',
            }} />
          )}
        </button>
      </div>
    </>
  );
};

// Three dots -- a compact "more" glyph that reads as a menu.
const MoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export default MobileNav;
