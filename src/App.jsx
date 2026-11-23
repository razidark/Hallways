import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PostProvider } from './context/PostContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { UIProvider } from './context/UIContext';
import { MessageProvider } from './context/MessageContext';
import { NotificationProvider } from './context/NotificationContext';
import { AudioProvider } from './context/AudioContext';
import { StoryProvider } from './context/StoryContext';
import CreatePostModal from './components/CreatePostModal';
import ThemeEngineModal from './components/ThemeEngineModal';
import { useUI } from './context/UIContext';
import Suggestions from './components/Suggestions';
import StoryViewer from './components/StoryViewer';
import FloatingChat from './components/FloatingChat';
import ToastContainer from './components/ToastContainer';
import { supabase } from './lib/supabaseClient';
import SplashScreen from './components/SplashScreen';
import CreationHub from './components/CreationHub';
import SpatialBgMesh from './components/SpatialBgMesh';

// PROFESSIONAL CODE SPLITTING
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const Profile = lazy(() => import('./pages/Profile'));
const Messages = lazy(() => import('./pages/Messages'));
const Reels = lazy(() => import('./pages/Reels'));
const Login = lazy(() => import('./pages/Login'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const Global = lazy(() => import('./pages/Global'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PostOverlay = lazy(() => import('./components/PostOverlay'));
const Admin = lazy(() => import('./pages/Admin'));

// Spatial Route Loader
const RouteLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', width: '100%', gap: '24px' }}>
    <div className="sync-container">
      <div className="sync-bar profile-glow-nebula"></div>
      <div className="sync-bar profile-glow-solar" style={{ animationDelay: '-0.4s' }}></div>
      <div className="sync-bar profile-glow-aurora" style={{ animationDelay: '-0.8s' }}></div>
    </div>
    <p style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '4px', opacity: 0.4, color: 'var(--text-primary)' }}>SYNCHRONIZING SECURE ACCESS</p>
  </div>
);

function AuthenticatedApp() {
  const { themePanelOpen, setThemePanelOpen, selectedPost, setSelectedPost } = useUI();

  return (
    <>
      <div className="ambient-bg" />
      <div className="global-cinema-bg" />
      <div className="mouse-spotlight" />
      <SpatialBgMesh />
      <div className="evolved-layout fade-in-up">
        <div className="theme-overlay"></div>
        <div className="immersive-content">
          <div className="sidebar-column">
            <Sidebar />
          </div>
          <div className="feed-column">
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/reels" element={<Reels />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/help/:topic" element={<HelpPage />} />
                <Route path="/global" element={<Global />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>

            {/* ── PLATFORM FOOTER ── */}
            <footer style={{
              marginTop: '60px',
              padding: '40px 24px 32px',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              background: 'rgba(var(--bg-secondary-rgb, 255, 255, 255), 0.02)',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                {[
                  { label: 'About', to: '/help/about' },
                  { label: 'Privacy', to: '/help/privacy' },
                  { label: 'Terms', to: '/help/terms' },
                  { label: 'Help', to: '/help/api' },
                  { label: 'Explore', to: '/explore' },
                  { label: 'Global', to: '/global' },
                ].map(link => (
                  <a key={link.label} href={link.to} style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    letterSpacing: '0.5px'
                  }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--accent-color)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >{link.label}</a>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '900',
                  letterSpacing: '3px',
                  color: 'var(--text-primary)',
                  opacity: 0.6
                }}>
                  © 2026 HALLWAYS
                </div>
                <div className="rainbow-text" style={{
                  fontSize: '9px',
                  fontWeight: 'bold',
                  letterSpacing: '2px'
                }}>
                  CRAFTED FOR THE NETWORK
                </div>
              </div>
            </footer>
          </div>
          <div className="suggestions-column">
            <Suggestions />
          </div>
        </div>
      </div>

      {/* GLOBAL OVERLAYS (Outside transform container) */}
      <MobileNav />
      <FloatingChat />
      <CreationHub />
      <CreatePostModal />
      <StoryViewer />
      {themePanelOpen && <ThemeEngineModal onClose={() => setThemePanelOpen(false)} />}
      <Suspense fallback={null}>
        {selectedPost && <PostOverlay post={selectedPost} onClose={() => setSelectedPost(null)} />}
      </Suspense>
      <ToastContainer />

    </>
  );
}

function MainApp() {
  const { isAuthenticated, loading, currentUser } = useAuth();
  const { theme, setTheme, mode, setMode } = useTheme();
  const [showSplash, setShowSplash] = React.useState(true);

  // 0. MOUSE SPOTLIGHT TRACKING
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 1. HYDRATE & SYNC PREFERENCES (Consolidated to prevent 429 loops)
  const hasHydrated = React.useRef(false);

  React.useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const meta = currentUser.user_metadata || {};

    // Phase 1: Hydration (Run once upon login/mount)
    if (!hasHydrated.current) {
      if (meta.theme && meta.theme !== theme) setTheme(meta.theme);
      if (meta.mode && meta.mode !== mode) setMode(meta.mode);
      hasHydrated.current = true;
      return; // Skip sync check on the hydration frame
    }

    // Phase 2: Synchronization (User-driven changes)
    const needsUpdate = (meta.theme !== theme) || (meta.mode !== mode);

    if (needsUpdate) {
      const timer = setTimeout(() => {
        // Double check after debounce to ensure we still need sync
        // and we aren't just reacting to a stale currentUser object
        supabase.auth.updateUser({
          data: { theme, mode }
        });
        console.log("Syncing preferences to cloud...");
      }, 2000); // 2s debounce for safety
      return () => clearTimeout(timer);
    }
  }, [theme, mode, isAuthenticated, currentUser?.id, currentUser, setMode, setTheme]);

  React.useEffect(() => {
    // Force splash for branding impact, then hide when auth is ready
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (loading || showSplash) {
    return <SplashScreen />;
  }

  if (isAuthenticated) return <AuthenticatedApp />;

  return (
    <div className="fade-in">
      <Suspense fallback={<SplashScreen />}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <AudioProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <MessageProvider>
              <PostProvider>
                <UIProvider>
                  <StoryProvider>
                    <MainApp />
                  </StoryProvider>
                </UIProvider>
              </PostProvider>
            </MessageProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AudioProvider>
  );
}

export default App;
