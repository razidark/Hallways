import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { Home, Search, Compass, Film, MessageCircle, Heart, MoreHorizontal, Moon, Sun, Zap, Palette, Globe, UserCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isUserAdmin } from '../lib/utils';

import { useUI } from '../context/UIContext';
import { useNotifications } from '../context/NotificationContext';
import { useAudio } from '../context/AudioContext';
import SearchOverlay from './SearchOverlay';
import NotificationsOverlay from './NotificationsOverlay';
import Avatar from './Avatar';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { activeOverlay, setActiveOverlay, themePanelOpen, setThemePanelOpen } = useUI();
  const { playSound } = useAudio();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  // Where the search panel should sit. The layout centres its columns, so
  // the sidebar's position changes with the viewport width -- a CSS
  // `calc(var(--sidebar-width) + 20px)` cannot track it and ends up
  // overlapping the menu. Measure the sidebar when the panel opens
  // instead: that is always current, needs no resize listener, and cannot
  // go stale. `null` means "use the stylesheet default".
  const [panelAnchorLeft, setPanelAnchorLeft] = useState(null);

  // Re-measure whenever the overlay opens, and whenever the window is
  // resized while it is open.
  useEffect(() => {
    if (!activeOverlay) {
      setPanelAnchorLeft(null);
      return;
    }

    const measure = () => {
      const node = sidebarRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      // Below the breakpoint the sidebar is hidden (width 0) and the panel
      // becomes a bottom sheet, so no inline offset is needed.
      setPanelAnchorLeft(rect.width > 0 ? Math.round(rect.right) + 20 : null);
    };

    measure();
    // A frame later, so the layout has settled after the panel renders.
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [activeOverlay]);
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const aura = currentUser?.profile_aura || 'nebula';
    const auraColors = {
      'aurora': '#00ff87',
      'glitch': '#00f2ff',
      'storm': '#ffffff',
      'sakura': '#ffb7c5',
      'ember': '#ff4500',
      'frost': '#e0f7fa',
      'nebula': '#818cf8',
      'none': 'var(--bg-tertiary)'
    };
    document.documentElement.style.setProperty('--aura-color', auraColors[aura] || auraColors['nebula']);
  }, [currentUser]);

  const handleMagneticMove = (e) => {
    const item = e.currentTarget;
    const rect = item.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const clamp = (v, max) => Math.max(-max, Math.min(max, v));
    item.style.setProperty('--move-x', `${clamp(x * 0.12, 6)}px`);
    item.style.setProperty('--move-y', `${clamp(y * 0.12, 6)}px`);
  };

  const handleMagneticLeave = (e) => {
    const item = e.currentTarget;
    item.style.setProperty('--move-x', '0px');
    item.style.setProperty('--move-y', '0px');
  };

  const navItems = useMemo(() => {
    const items = [
      { to: '/', icon: <Home size={22} />, label: 'Home' },
      { icon: <Search size={22} />, label: 'Search', overlay: 'search' },
      { to: '/explore', icon: <Compass size={22} />, label: 'Explore' },
      { to: '/reels', icon: <Film size={22} />, label: 'Reels' },
      { to: '/global', icon: <Globe size={22} />, label: 'Global' },
      { to: '/messages', icon: <MessageCircle size={22} />, label: 'Messages' },
      {
        icon: (
          <div style={{ position: 'relative' }}>
            <Heart size={22} />
            {unreadCount > 0 && <div className="pulse-dot" style={{ position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff3040', border: '2px solid var(--bg-secondary)' }} />}
          </div>
        ),
        label: 'Notifications',
        overlay: 'notifications'
      }
    ];

    if (isUserAdmin(currentUser)) {
      items.push({ to: '/admin', icon: <Shield size={22} />, label: 'Admin HUD' });
    }

    items.push({
      to: currentUser ? `/profile/${currentUser.username}` : '#',
      icon: currentUser ? <Avatar src={currentUser.avatar_url} username={currentUser.username} size="xs" borderStyle={currentUser.border_style} avatarShape={currentUser.avatar_shape} /> : <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-tertiary)' }} />,
      label: 'Profile'
    });

    return items;
  }, [currentUser, unreadCount]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setActiveOverlay(null);
      setIsMoreMenuOpen(false);
      setThemePanelOpen(false);
    });
  }, [location.pathname, setActiveOverlay, setThemePanelOpen]);

  useEffect(() => {
    const handleEvents = (e) => {
      if (e.key === 'Escape') {
        setActiveOverlay(null);
        setIsMoreMenuOpen(false);
        setThemePanelOpen(false);
      }
      const isMoreMenu = e.target.closest('.glass-overlay:not(.theme-panel)');
      const isMoreBtn = e.target.closest('.sidebar-nav-item.active');
      if (!isMoreMenu && !isMoreBtn && isMoreMenuOpen) {
        setIsMoreMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEvents);
    window.addEventListener('mousedown', handleEvents);
    return () => {
      window.removeEventListener('keydown', handleEvents);
      window.removeEventListener('mousedown', handleEvents);
    };
  }, [setActiveOverlay, setThemePanelOpen, isMoreMenuOpen]);

  const handleModeToggle = () => {
    toggleMode();
    playSound('pop');
  };

  return (
    <>
      <div className="vertical-sidebar fade-in" ref={sidebarRef}>
        <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 10 }}>
          <div className="rainbow-logo-container neon-glow" onClick={() => navigate('/')} style={{
            position: 'relative', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(var(--accent-color-rgb), 0.1)', borderRadius: '50%', cursor: 'pointer',
            border: '1px solid var(--glass-border)', transition: 'all 0.3s'
          }}>
            <Zap fill="var(--accent-color)" strokeWidth={2.5} size={22} style={{ filter: 'drop-shadow(0 0 8px var(--accent-color))' }} />
            <div style={{ position: 'absolute', top: '-4px', right: '-12px', background: 'var(--accent-color)', color: 'var(--button-text, white)', fontSize: '8px', fontWeight: '900', padding: '2px 6px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(var(--accent-color-rgb), 0.4)', letterSpacing: '0.5px' }}>BETA</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, zIndex: 10 }}>
          {navItems.map(item => (
            item.to ? (
              <NavLink key={item.label} onMouseEnter={() => playSound('pop')} onMouseMove={handleMagneticMove} onMouseLeave={handleMagneticLeave}
                to={item.to} end={item.to === '/'} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
                {item.icon} <span className="nav-text">{item.label}</span>
              </NavLink>
            ) : (
              <div key={item.label} onMouseEnter={() => playSound('pop')} onMouseMove={handleMagneticMove} onMouseLeave={handleMagneticLeave}
                className={`sidebar-nav-item ${activeOverlay === item.overlay ? 'active' : ''}`}
                onClick={() => setActiveOverlay(item.overlay === activeOverlay ? null : item.overlay)}>
                {item.icon} <span className="nav-text">{item.label}</span>
              </div>
            )
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10 }}>
          <div className="sidebar-nav-item" onClick={handleModeToggle} onMouseMove={handleMagneticMove} onMouseLeave={handleMagneticLeave}>
            {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="nav-text">{mode === 'dark' ? 'Light' : 'Dark'}</span>
          </div>
          <div className={`sidebar-nav-item ${themePanelOpen ? 'active' : ''}`} onMouseEnter={() => playSound('pop')} onMouseMove={handleMagneticMove} onMouseLeave={handleMagneticLeave} onClick={() => setThemePanelOpen(!themePanelOpen)}>
            <Palette size={20} /> <span className="nav-text">Themes</span>
          </div>
          <div className={`sidebar-nav-item ${isMoreMenuOpen ? 'active' : ''}`} onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} onMouseMove={handleMagneticMove} onMouseLeave={handleMagneticLeave}>
            <MoreHorizontal size={20} /> <span className="nav-text">More</span>
            {isMoreMenuOpen && (
              <div className="glass-overlay fade-in" onClick={e => e.stopPropagation()} style={{ position: 'absolute', left: '60px', bottom: '0', padding: '8px', borderRadius: '20px', width: '180px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '2px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', backdropFilter: 'blur(40px)', cursor: 'default' }}>
                <button onClick={(e) => { e.stopPropagation(); logout(); }} className="hover-bg" style={{ padding: '12px 16px', border: 'none', background: 'transparent', color: 'var(--text-primary)', textAlign: 'left', fontWeight: '600', cursor: 'pointer', borderRadius: '12px', fontSize: '13px' }}>Log out</button>
                <button onClick={(e) => { e.stopPropagation(); navigate('/settings'); }} className="hover-bg" style={{ padding: '12px 16px', border: 'none', background: 'transparent', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCircle size={14} /> Edit Identity
                </button>
                <button onClick={(e) => { e.stopPropagation(); toggleMode(); }} className="hover-bg" style={{ padding: '12px 16px', border: 'none', background: 'transparent', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', borderRadius: '12px', fontSize: '13px' }}>Toggle Lighting</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rendered through a portal into <body>. The sidebar lives inside
          `.evolved-layout`, which carries a leftover transform from its
          entry animation -- and a transformed ancestor becomes the
          containing block for `position: fixed`, so the panel would be
          positioned relative to the layout instead of the viewport and
          would sit far below the fold. The portal escapes that. */}
      {activeOverlay && createPortal(
        <>
          <div className="overlay-backdrop" onClick={() => setActiveOverlay(null)} />
          {/* The panel opens on the side of the sidebar that owns the button
              that launched it: Notifications lives in the lower group and
              should open to the RIGHT (screen edge), Search sits at the top
              and opens to the LEFT (towards the content column). */}
          <div
            className={`overlay-panel slide-in-panel ${activeOverlay === 'notifications' ? 'overlay-panel-right' : 'overlay-panel-left'}`}
            style={{
              padding: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              // Anchor to the sidebar's measured right edge so the panel
              // always sits clear of the menu. Falls back to the CSS value
              // until the first measurement lands.
              ...(activeOverlay === 'notifications' || panelAnchorLeft == null
                ? {}
                : { left: `${panelAnchorLeft}px` }),
            }}
          >
            {activeOverlay === 'search' && <SearchOverlay />}
            {activeOverlay === 'notifications' && <NotificationsOverlay onClose={() => setActiveOverlay(null)} />}
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default Sidebar;