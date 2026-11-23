import React from 'react';
import Avatar from '../Avatar';
import VerifiedBadge from '../VerifiedBadge';
import AdminBadge from '../AdminBadge';
import { MessageSquare, Loader2, Globe } from 'lucide-react';
import { isUserAdmin, isUserVerified } from '../../lib/utils';

const NAME_EFFECT_MAP = {
  'gradient-sunset': 'linear-gradient(90deg, #ff6b35, #f7c948)',
  'gradient-ocean': 'linear-gradient(90deg, #0077b6, #00b4d8)',
  'gradient-neon': 'linear-gradient(90deg, #00f2ff, #7000ff)',
  'gradient-rose': 'linear-gradient(90deg, #ff6b6b, #ee5a24)',
  'gradient-aurora': 'linear-gradient(90deg, #00ff87, #60efff, #7000ff)',
  'gradient-gold': 'linear-gradient(90deg, #f7971e, #ffd200)',
  'rainbow': 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)',
};

const BIO_FONT_MAP = {
  'default': "'Outfit', sans-serif",
  'grotesk': "'Space Grotesk', sans-serif",
  'mono': "'JetBrains Mono', 'Courier New', monospace",
  'serif': "'Playfair Display', 'Georgia', serif",
  'handwritten': "'Caveat', cursive",
};

const ProfileHeader = ({ 
  profileUser, 
  isCurrentUser, 
  isFollowing, 
  followLoading, 
  handleToggleFollow, 
  startChat, 
  navigate,
  parallax = { x: 0, y: 0 },
  followCounts = { followers: 0, following: 0 },
  setNetworkModal,
  postTotalCount,
  repostTotalCount,
  setActiveTab
}) => {

  const getNameStyle = () => {
    const effect = profileUser.name_effect;
    if (!effect || effect === 'none') return {};
    const bg = NAME_EFFECT_MAP[effect];
    if (!bg) return {};
    
    // Choose appropriate animation name
    let animationName = 'rainbowFlow';
    if (effect === 'gradient-sunset') animationName = 'sunsetFlow';
    else if (effect === 'gradient-ocean') animationName = 'oceanFlow';
    else if (effect === 'gradient-neon') animationName = 'neonFlow';
    else if (effect === 'gradient-gold') animationName = 'goldFlow';

    return {
      background: bg,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      backgroundSize: '200% auto',
      animation: `${animationName} 4s linear infinite`,
    };
  };

  const accentColor = profileUser.profile_accent && profileUser.profile_accent !== 'default'
    ? profileUser.profile_accent
    : null;

  return (
    <div className="profile-header fade-in" style={{ 
      position: 'relative', 
      overflow: 'hidden',
      backgroundColor: 'var(--bg-secondary)', 
      backdropFilter: 'blur(40px)', 
      border: '1px solid var(--border-color)', 
      borderRadius: 'var(--radius-xl)', 
      padding: 'clamp(24px, 4vw, 48px)', 
      boxShadow: '0 30px 60px rgba(0,0,0,0.15)', 
      marginBottom: 'var(--space-xl)', 
      width: '100%', 
      display: 'flex', 
      gap: 'clamp(20px, 4vw, 48px)', 
      alignItems: 'center',
      transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)'
    }}>
      
      {/* BANNER LAYER */}
      {profileUser.banner_url && (
         <div className="parallax-banner-container" style={{ transform: `translate(${-parallax.x}px, ${-parallax.y}px) scale(1.1)` }}>
            <img 
               src={profileUser.banner_url} 
               alt="Profile Banner" 
               style={{ 
                 width: '100%', 
                 height: '100%', 
                 objectFit: 'cover', 
                 opacity: 0.6,
                 animation: 'cinematicBreathe 30s infinite alternate ease-in-out'
               }} 
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, background: 'linear-gradient(to right, rgba(10,10,10,0.95) 10%, rgba(10,10,10,0.8) 40%, transparent 100%)' }}></div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(10,10,10,0.5), transparent)' }}></div>
            
            {/* Apply Identity Sync Effects ABOVE banner */}
            {profileUser.profile_aura && profileUser.profile_aura !== 'none' && (
              <div className={`aura-${profileUser.profile_aura}`} style={{ position: 'absolute', inset: 0, mixBlendMode: 'color-dodge', opacity: 0.4 }}></div>
            )}
         </div>
      )}

      {/* Identity Glow Sync if NO banner exists */}
      {!profileUser.banner_url && profileUser.profile_aura && profileUser.profile_aura !== 'none' && (
        <div className="aura-container">
           <div className={`aura-${profileUser.profile_aura}`} style={{ width: '100%', height: '100%' }}></div>
        </div>
      )}

      <div style={{ zIndex: 1, position: 'relative', display: 'flex', gap: 'clamp(20px, 4vw, 48px)', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
        <div className="story-ring" style={{ flexShrink: 0, padding: '6px', cursor: 'default' }}>
          <Avatar src={profileUser.avatar_url} username={profileUser.username} size="lg" borderStyle={profileUser.border_style} avatarShape={profileUser.avatar_shape} />
        </div>
        <div className="profile-info-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 20px)', marginBottom: 'clamp(12px, 2vw, 24px)', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: '-1.5px', ...getNameStyle(), textShadow: profileUser.banner_url ? '0 4px 20px rgba(0,0,0,0.5)' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {profileUser.username}
              {isUserAdmin(profileUser) && <AdminBadge size={20} />}
              {isUserVerified(profileUser) && !isUserAdmin(profileUser) && <VerifiedBadge size={20} />}
              

            </h2>
            {isCurrentUser ? (
              <div className="profile-actions">
                <button onClick={() => navigate('/settings')} className={!profileUser.profile_accent || profileUser.profile_accent === 'default' ? "exotic-gradient" : ""} style={{ backgroundColor: profileUser.profile_accent && profileUser.profile_accent !== 'default' ? accentColor : undefined, color: 'var(--button-text, white)', padding: '10px 24px', borderRadius: '14px', fontWeight: 'bold', fontSize: '14px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>Edit Profile</button>
              </div>
            ) : (
              <div className="profile-actions">
                <button onClick={handleToggleFollow} className={isFollowing ? "" : "exotic-gradient"} style={{ backgroundColor: isFollowing ? 'var(--bg-tertiary)' : (accentColor || 'transparent'), color: isFollowing ? 'var(--text-primary)' : 'white', padding: '10px 24px', borderRadius: '14px', fontWeight: 'bold', fontSize: '14px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {followLoading ? <Loader2 size={16} className="spin" /> : (isFollowing ? 'Following' : 'Follow')}
                </button>
                <button onClick={() => { startChat(profileUser); navigate('/messages'); }} style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', padding: '10px 24px', borderRadius: '14px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                  <MessageSquare size={16} /> Message
                </button>
              </div>
            )}
          </div>

          <div className="profile-stats" style={{ display: 'flex', gap: '16px', marginBottom: 'clamp(12px, 2vw, 24px)', flexWrap: 'wrap' }}>
            <div className="stat-box" onClick={() => setActiveTab('posts')}>
               <span className="stat-value">{postTotalCount}</span>
               <span className="stat-label">Posts</span>
            </div>
            <div className="stat-box" onClick={() => setActiveTab('reposts')}>
               <span className="stat-value">{repostTotalCount}</span>
               <span className="stat-label">Reposts</span>
            </div>
            <div className="stat-box" onClick={() => followCounts.followers > 0 && setNetworkModal({ isOpen: true, type: 'followers' })}>
               <span className="stat-value">{followCounts.followers}</span>
               <span className="stat-label">Followers</span>
            </div>
            <div className="stat-box" onClick={() => followCounts.following > 0 && setNetworkModal({ isOpen: true, type: 'following' })}>
               <span className="stat-value">{followCounts.following}</span>
               <span className="stat-label">Following</span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: 'clamp(16px, 1.5vw, 18px)', color: 'var(--text-primary)', ...getNameStyle() }}>{profileUser.full_name}</strong>
            {(profileUser.status_title || isUserAdmin(profileUser)) && (
              <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '900', letterSpacing: '2px', color: isUserAdmin(profileUser) ? '#ff0055' : (accentColor || 'var(--accent-color)'), background: `rgba(${isUserAdmin(profileUser) ? '255,0,85' : (accentColor ? '0,0,0' : 'var(--accent-color-rgb)')}, 0.1)`, padding: '4px 12px', borderRadius: '10px', marginBottom: '8px', border: `1px solid ${isUserAdmin(profileUser) ? 'rgba(255, 0, 85, 0.2)' : 'rgba(var(--accent-color-rgb), 0.1)'}` }}>
                ◈ {isUserAdmin(profileUser) ? 'SYSTEM OVERSEER' : profileUser.status_title.toUpperCase()}
              </span>
            )}

            <div style={{ fontFamily: BIO_FONT_MAP[profileUser.bio_font] || BIO_FONT_MAP['default'], fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {profileUser.bio}
            </div>
            
            {profileUser.website && (
              <div 
                 className="hover-bright" 
                 onClick={() => window.open(profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`, '_blank')}
                 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', width: 'fit-content' }}
              >
                <Globe size={14} />
                <span>{profileUser.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
              </div>
            )}
          </div>
            
          {profileUser.status && (
             <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(var(--accent-color-rgb), 0.05)', borderRadius: '16px', border: '1px solid rgba(var(--accent-color-rgb), 0.1)', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 10px var(--accent-color)', flexShrink: 0 }}></div>
                <span style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.8 }}>"{profileUser.status}"</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
