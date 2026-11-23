import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Camera, Edit2, Palette, Type, Crown, Hexagon, Globe, Layers, Sparkles, ArrowLeft, Trash2, ChevronRight, HardDrive } from 'lucide-react';
import Avatar from '../components/Avatar';
import { SHAPE_CLIPS } from '../lib/avatarShapes';
import ThemePanel from '../components/ThemePanel';
import { useUI } from '../context/UIContext';
import { STORAGE_QUOTA, formatBytes, getStoragePercentage } from '../lib/storageQuota';

/* ── Constants ── */
const BORDER_STYLES = [
  { id: 'normal', name: 'Standard', preview: 'var(--border-color)' },
  { id: 'hexagon-glass', name: 'Glass', preview: 'rgba(255,255,255,0.2)' },
  { id: 'hexagon-cyber', name: 'Cyber', preview: 'linear-gradient(45deg, #00f2ff, #0062ff)' },
  { id: 'hexagon-royalty', name: 'Royalty', preview: 'linear-gradient(45deg, #ffd700, #ff8c00)' },
  { id: 'hexagon-prism', name: 'Prism', preview: 'linear-gradient(45deg, #ff0000, #ff7f00, #00ff00, #0000ff, #8b00ff)' },
  { id: 'hexagon-void', name: 'Void', preview: 'linear-gradient(45deg, #000, #1e1e1e)' },
  { id: 'hexagon-inferno', name: 'Inferno', preview: 'linear-gradient(45deg, #ff3c00, #ff9100)' },
  { id: 'hexagon-nebula', name: 'Nebula', preview: 'linear-gradient(135deg, #7000ff, #ff00cc, #00d4ff)' },
  { id: 'hexagon-liquid', name: 'Liquid', preview: 'linear-gradient(180deg, #00d2ff, #3a7bd5)' },
  { id: 'ethereal-silk', name: 'Silk', preview: '#fff' },
  { id: 'crimson-void', name: 'Crimson', preview: '#900' },
  { id: 'hyperdrive', name: 'Hyper', preview: '#00f2ff' },
  { id: 'cyber-radar', name: 'Radar', preview: 'linear-gradient(45deg, #00ff66, #00f2ff)' },
  { id: 'stellar-nova', name: 'Nova', preview: 'linear-gradient(135deg, #ffd700, #ff007a, #00f2ff)' },
  { id: 'deep-sea', name: 'Deep Sea', preview: 'linear-gradient(180deg, #0f2027, #2c5364)' },
  { id: 'aurora-glow', name: 'Aurora', preview: 'linear-gradient(90deg, #0575e6, #00f260)' }
];

const AVATAR_SHAPES = [
  { id: 'circle', name: 'Circle' }, { id: 'rounded', name: 'Rounded' },
  { id: 'squircle', name: 'Squircle' }, { id: 'hexagon', name: 'Hexagon' },
  { id: 'diamond', name: 'Diamond' }, { id: 'octagon', name: 'Octagon' },
  { id: 'shield', name: 'Shield' }, { id: 'star', name: 'Star' },
  { id: 'pentagon', name: 'Pentagon' }, { id: 'clover', name: 'Clover' }
];

const PROFILE_GLOW_STYLES = [
  { id: 'none', name: 'NONE', color: 'var(--bg-tertiary)' },
  { id: 'aurora', name: 'AURORA', color: 'linear-gradient(135deg, #00ff87, #60efff)' },
  { id: 'glitch', name: 'GLITCH', color: 'linear-gradient(135deg, #00f2ff, #7000ff)' },
  { id: 'storm', name: 'STORM', color: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent)' },
  { id: 'sakura', name: 'SAKURA', color: 'linear-gradient(135deg, #ffb7c5, #ff69b4)' },
  { id: 'ember', name: 'EMBER', color: 'linear-gradient(135deg, #ff4500, #ff8c00)' },
  { id: 'frost', name: 'FROST', color: 'linear-gradient(135deg, #e0f7fa, #80deea)' }
];

const NAME_EFFECTS = [
  { id: 'none', name: 'Default', preview: 'var(--text-primary)' },
  { id: 'gradient-sunset', name: 'Sunset', preview: 'linear-gradient(90deg, #ff6b35, #f7c948)' },
  { id: 'gradient-ocean', name: 'Ocean', preview: 'linear-gradient(90deg, #0077b6, #00b4d8)' },
  { id: 'gradient-neon', name: 'Neon', preview: 'linear-gradient(90deg, #00f2ff, #7000ff)' },
  { id: 'gradient-rose', name: 'Rose', preview: 'linear-gradient(90deg, #ff6b6b, #ee5a24)' },
  { id: 'gradient-aurora', name: 'Aurora', preview: 'linear-gradient(90deg, #00ff87, #60efff, #7000ff)' },
  { id: 'gradient-gold', name: 'Gold', preview: 'linear-gradient(90deg, #f7971e, #ffd200)' },
  { id: 'rainbow', name: 'Rainbow', preview: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)' }
];

const BIO_FONTS = [
  { id: 'default', name: 'Outfit', family: "'Outfit', sans-serif" },
  { id: 'grotesk', name: 'Space Grotesk', family: "'Space Grotesk', sans-serif" },
  { id: 'mono', name: 'JetBrains Mono', family: "'JetBrains Mono', 'Courier New', monospace" },
  { id: 'serif', name: 'Playfair', family: "'Playfair Display', 'Georgia', serif" },
  { id: 'handwritten', name: 'Caveat', family: "'Caveat', cursive" }
];

const PROFILE_ACCENTS = [
  { id: 'default', name: 'Default', color: 'var(--accent-color)' },
  { id: '#ff6b6b', name: 'Coral', color: '#ff6b6b' },
  { id: '#00b894', name: 'Emerald', color: '#00b894' },
  { id: '#fdcb6e', name: 'Amber', color: '#fdcb6e' },
  { id: '#6c5ce7', name: 'Iris', color: '#6c5ce7' },
  { id: '#e84393', name: 'Fuchsia', color: '#e84393' },
  { id: '#00cec9', name: 'Teal', color: '#00cec9' },
  { id: '#fd79a8', name: 'Pink', color: '#fd79a8' },
  { id: '#55efc4', name: 'Mint', color: '#55efc4' },
  { id: '#fab1a0', name: 'Peach', color: '#fab1a0' }
];

const STATUS_TITLES = [
  '', 'Standard', 'Creator', 'Dreamer', 'Influencer', 'Artist', 'Early Adopter',
  'Designer', 'User', 'Ambassador', 'verified', 'Pro', 'Founder'
];

const NAV_ITEMS = [
  { id: 'identity', label: 'Identity', icon: Shield },
  { id: 'avatar', label: 'Avatar & Frame', icon: Hexagon },
  { id: 'style', label: 'Style & Flair', icon: Sparkles },
  { id: 'theme', label: 'Theme', icon: Layers },
  { id: 'security', label: 'Security', icon: Shield },
];

const Settings = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, updatePassword, uploadAvatar, deleteAccount } = useAuth();
  const { showToast } = useUI();
  const [activeSection, setActiveSection] = useState('identity');

  // Form state
  const [name, setName] = useState(currentUser?.full_name || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [website, setWebsite] = useState(currentUser?.website || "");
  const [status, setStatus] = useState(currentUser?.status || "");
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar_url);
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(currentUser?.banner_url);
  const [bannerFile, setBannerFile] = useState(null);
  const [borderStyle, setBorderStyle] = useState(currentUser?.border_style || 'normal');
  const [avatarShape, setAvatarShape] = useState(currentUser?.avatar_shape || 'hexagon');
  const [profileAura, setProfileAura] = useState(currentUser?.profile_aura || 'none');
  const [nameEffect, setNameEffect] = useState(currentUser?.name_effect || 'none');
  const [statusTitle, setStatusTitle] = useState(currentUser?.status_title || '');
  const [bioFont, setBioFont] = useState(currentUser?.bio_font || 'default');
  const [profileAccent, setProfileAccent] = useState(currentUser?.profile_accent || 'default');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationStatus] = useState(currentUser?.is_verified ? 'verified' : 'unverified');
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const getNameEffectStyle = (effect) => {
    if (effect === 'none') return {};
    const ne = NAME_EFFECTS.find(n => n.id === effect);
    if (!ne) return {};

    let animationName = 'rainbowFlow';
    if (effect === 'gradient-sunset') animationName = 'sunsetFlow';
    else if (effect === 'gradient-ocean') animationName = 'oceanFlow';
    else if (effect === 'gradient-neon') animationName = 'neonFlow';
    else if (effect === 'gradient-gold') animationName = 'goldFlow';

    return {
      background: ne.preview,
      WebkitBackgroundClip: 'text', 
      backgroundClip: 'text', 
      color: 'transparent',
      backgroundSize: '200% auto',
      animation: `${animationName} 4s linear infinite`,
    };
  };

  const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setBannerPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    let finalAvatarUrl = avatarPreview;
    let finalBannerUrl = bannerPreview;

    if (avatarFile) {
      const res = await uploadAvatar(avatarFile);
      if (res.success) finalAvatarUrl = res.publicUrl;
      else { setLoading(false); return showToast("Avatar upload failed: " + res.message, "error"); }
    }
    if (bannerFile) {
      const res = await uploadAvatar(bannerFile, true);
      if (res.success) finalBannerUrl = res.publicUrl;
      else { setLoading(false); return showToast("Banner upload failed: " + res.message, "error"); }
    }

    const profileRes = await updateProfile({
      full_name: name, username, bio, avatar_url: finalAvatarUrl,
      banner_url: finalBannerUrl, border_style: borderStyle, avatar_shape: avatarShape,
      profile_aura: profileAura, name_effect: nameEffect, status_title: statusTitle,
      bio_font: bioFont, profile_accent: profileAccent, website, status
    });

    if (newPassword) {
      if (newPassword !== confirmPassword) { setLoading(false); return showToast("Passwords don't match", "error"); }
      const passRes = await updatePassword(newPassword);
      if (!passRes.success) { setLoading(false); return showToast("Password change failed: " + passRes.message, "error"); }
    }

    setLoading(false);
    if (profileRes.success) {
      showToast("Identity synchronized", "success");
      navigate(`/profile/${username}`);
    } else {
      showToast("Save failed: " + profileRes.message, "error");
    }
  };

  // Hidden file inputs
  const hiddenInputs = (
    <>
      <input type="file" ref={fileInputRef} onChange={onAvatarChange} style={{ display: 'none' }} accept="image/*" />
      <input type="file" ref={bannerInputRef} onChange={onBannerChange} style={{ display: 'none' }} accept="image/*" />
    </>
  );

  return (
    <div className="settings-layout fade-in">
      {hiddenInputs}

      {/* ── Sidebar Navigation ── */}
      <nav className="settings-sidebar">
        <div className="settings-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <button onClick={() => navigate(-1)} className="hover-bright" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <ArrowLeft size={18} />
            </button>
            <h1>Settings</h1>
          </div>
          <p>IDENTITY CONFIGURATION</p>
        </div>
        <div className="settings-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`} onClick={() => setActiveSection(item.id)}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 12px' }} />
          <button className="settings-nav-item danger" onClick={() => setActiveSection('danger')}>
            <Trash2 size={18} />
            <span>Delete Account</span>
          </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="settings-content scrollbar-hidden">

        {/* ═══ IDENTITY TAB ═══ */}
        {activeSection === 'identity' && (
          <div className="fade-in">
            <h2 className="settings-section-title">Identity</h2>
            <p className="settings-section-subtitle">Your public profile information visible to everyone on Hallway.</p>

            {/* Storage Usage Indicator */}
            <div className="settings-card" style={{ marginBottom: 'var(--space-md)' }}>
              <div className="settings-card-header">
                <HardDrive size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Storage Usage</span>
              </div>
              {(() => {
                const used = currentUser?.storage_used || 0;
                const pct = getStoragePercentage(used);
                const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : 'var(--accent-color)';
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                      <span style={{ fontSize: '24px', fontWeight: '900', fontFamily: 'Space Grotesk', color: barColor }}>{pct}%</span>
                      <span style={{ fontSize: '12px', opacity: 0.5 }}>{formatBytes(used)} / {formatBytes(STORAGE_QUOTA)}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 'var(--radius-sm)', background: barColor, transition: 'width 0.5s ease, background 0.3s ease' }} />
                    </div>
                    <p style={{ fontSize: '11px', opacity: 0.4, marginTop: '8px' }}>Includes posts, stories, avatars, and banners. Max {formatBytes(STORAGE_QUOTA)} per account.</p>
                  </>
                );
              })()}
            </div>

            {/* Live Preview */}
            <div className="settings-preview-card" style={{ marginBottom: 'var(--space-lg)' }}>
              {bannerPreview && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', backgroundImage: `url(${bannerPreview})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 }} />
              )}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1, marginTop: bannerPreview ? '50px' : 0, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar src={avatarPreview} username={username} borderStyle={borderStyle} avatarShape={avatarShape} size="80px" />
                  <button onClick={() => fileInputRef.current?.click()} className="hover-scale" style={{ position: 'absolute', bottom: 0, right: 0, padding: '8px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    <Camera size={14} />
                  </button>
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontWeight: '900', fontSize: '18px', ...getNameEffectStyle(nameEffect) }}>{name || username || 'Your Name'}</h4>
                  <p style={{ color: 'var(--accent-color)', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>
                    {statusTitle ? `◈ ${statusTitle.toUpperCase()}` : '@' + (username || 'username')}
                  </p>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="settings-card">
              <div className="settings-card-header">
                <Palette size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Header Banner</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Upload a cinematic wide image for your profile header.</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={() => bannerInputRef.current?.click()} className="exotic-gradient hover-scale" style={{ padding: '12px 24px', borderRadius: 'var(--radius-lg)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                  Upload Banner
                </button>
                {bannerPreview && (
                  <button onClick={() => { setBannerPreview(null); setBannerFile(null); }} style={{ padding: '12px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,100,100,0.3)', background: 'rgba(255,100,100,0.08)', color: '#ff6b6b', fontWeight: 'bold', cursor: 'pointer' }}>
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Public Data */}
            <div className="settings-card">
              <div className="settings-card-header">
                <Edit2 size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Public Information</span>
              </div>
              <div className="settings-grid-2">
                <div>
                  <label className="settings-card-label" style={{ display: 'block', marginBottom: '8px' }}>Display Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="settings-input" placeholder="Your display name" />
                </div>
                <div>
                  <label className="settings-card-label" style={{ display: 'block', marginBottom: '8px' }}>Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="settings-input" placeholder="@username" />
                </div>
              </div>
              <div style={{ marginTop: 'var(--space-md)' }}>
                <label className="settings-card-label" style={{ display: 'block', marginBottom: '8px' }}>Biography</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} className="settings-input settings-textarea" rows="3" style={{ fontFamily: BIO_FONTS.find(f => f.id === bioFont)?.family || "'Outfit', sans-serif" }} placeholder="Tell the community about yourself..." />
              </div>
              <div style={{ marginTop: 'var(--space-md)' }}>
                <label className="settings-card-label" style={{ display: 'block', marginBottom: '8px' }}>
                  <Globe size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Website
                </label>
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="settings-input" placeholder="https://yoursite.com" />
              </div>
              <div style={{ marginTop: 'var(--space-md)' }}>
                <label className="settings-card-label" style={{ display: 'block', marginBottom: '8px' }}>
                  <Edit2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Status Message (Mood)
                </label>
                <input type="text" value={status} onChange={e => setStatus(e.target.value.slice(0, 60))} maxLength={60} className="settings-input" placeholder="What's your current vibe?" />
                <p style={{ fontSize: '10px', opacity: 0.3, marginTop: '6px', textAlign: 'right' }}>{status.length}/60</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ AVATAR & FRAME TAB ═══ */}
        {activeSection === 'avatar' && (
          <div className="fade-in">
            <h2 className="settings-section-title">Avatar & Frame</h2>
            <p className="settings-section-subtitle">Customize your avatar shape, identity frame, and profile glow.</p>

            {/* Avatar Preview */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-lg) 0' }}>
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <Avatar src={avatarPreview} username={username} borderStyle={borderStyle} avatarShape={avatarShape} size="120px" />
                <button onClick={() => fileInputRef.current?.click()} className="hover-scale" style={{ position: 'absolute', bottom: '24px', right: '-8px', padding: '10px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.4)', zIndex: 10 }}>
                  <Camera size={18} />
                </button>
                <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: 'bold', opacity: 0.5, letterSpacing: '1px' }}>
                  {AVATAR_SHAPES.find(s => s.id === avatarShape)?.name.toUpperCase()} • {BORDER_STYLES.find(s => s.id === borderStyle)?.name.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Avatar Shape */}
            <div className="settings-card">
              <div className="settings-card-header">
                <Hexagon size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Avatar Shape</span>
              </div>
              <div className="settings-option-grid cols-5">
                {AVATAR_SHAPES.map(shape => (
                  <div key={shape.id} className={`settings-option-chip ${avatarShape === shape.id ? 'selected' : ''}`} onClick={() => setAvatarShape(shape.id)}>
                    <div style={{ width: '32px', height: '32px', background: avatarShape === shape.id ? 'var(--accent-color)' : 'var(--bg-tertiary)', clipPath: SHAPE_CLIPS[shape.id], WebkitClipPath: SHAPE_CLIPS[shape.id], transition: 'all 0.2s' }} />
                    <span className="chip-label">{shape.name.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Identity Frame */}
            <div className="settings-card">
              <div className="settings-card-header">
                <Sparkles size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Identity Frame</span>
              </div>
              <div className="settings-option-grid cols-3">
                {BORDER_STYLES.map(style => (
                  <div key={style.id} className={`settings-option-chip ${borderStyle === style.id ? 'selected' : ''}`} onClick={() => setBorderStyle(style.id)} style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: '12px', padding: '14px 16px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: style.preview, border: '1px solid var(--border-color)', flexShrink: 0 }} />
                    <span className="chip-label" style={{ fontSize: '11px' }}>{style.name.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ═══ STYLE & FLAIR TAB ═══ */}
        {activeSection === 'style' && (
          <div className="fade-in">
            <h2 className="settings-section-title">Style & Flair</h2>
            <p className="settings-section-subtitle">Personalize your name effect, status title, bio typography, and accent color.</p>

            {/* Name Effect */}
            <div className="settings-card">
              <div className="settings-card-header">
                <Type size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Display Name Effect</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ opacity: 0.4, fontSize: '11px', fontWeight: '900', letterSpacing: '1px', whiteSpace: 'nowrap' }}>PREVIEW:</span>
                <span style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'Space Grotesk', ...getNameEffectStyle(nameEffect) }}>{name || username || 'Your Name'}</span>
              </div>
              <div className="settings-option-grid cols-4">
                {NAME_EFFECTS.map(effect => (
                  <div key={effect.id} className={`settings-option-chip ${nameEffect === effect.id ? 'selected' : ''}`} onClick={() => setNameEffect(effect.id)}>
                    <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: effect.preview }} />
                    <span className="chip-label">{effect.name.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Title */}
            <div className="settings-card">
              <div className="settings-card-header">
                <Crown size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Status Title</span>
              </div>
              <p style={{ fontSize: '12px', opacity: 0.5, marginBottom: '12px' }}>A custom title displayed beneath your name on your profile.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {STATUS_TITLES.map(title => (
                  <button key={title} className={`settings-status-chip ${statusTitle === title ? 'selected' : ''}`} onClick={() => setStatusTitle(title)}>
                    {title || '✕ None'}
                  </button>
                ))}
              </div>
              <input type="text" value={statusTitle} onChange={e => setStatusTitle(e.target.value.slice(0, 24))} maxLength={24} className="settings-input" placeholder="Or type a custom title..." />
              <p style={{ fontSize: '10px', opacity: 0.3, marginTop: '6px', textAlign: 'right' }}>{statusTitle.length}/24</p>
            </div>

            {/* Bio Font */}
            <div className="settings-card">
              <div className="settings-card-header">
                <Type size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Bio Typography</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {BIO_FONTS.map(font => (
                  <div key={font.id} className={`settings-font-option ${bioFont === font.id ? 'selected' : ''}`} onClick={() => setBioFont(font.id)}>
                    <span style={{ fontFamily: font.family, fontSize: '14px', color: bioFont === font.id ? 'var(--accent-color)' : 'var(--text-primary)' }}>The quick brown fox jumps over the lazy dog</span>
                    <span style={{ fontSize: '10px', fontWeight: '900', opacity: 0.4, letterSpacing: '0.5px', whiteSpace: 'nowrap', marginLeft: '12px' }}>{font.name.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Identity Style / Profile Glow */}
            <div className="settings-card">
              <div className="settings-card-header">
                <Edit2 size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Profile Ambient Glow</span>
              </div>
              <p style={{ fontSize: '12px', opacity: 0.5, marginBottom: '12px' }}>A subtle thematic aura radiating from behind your profile picture.</p>
              <div className="settings-option-grid cols-4">
                {PROFILE_GLOW_STYLES.map(aura => (
                  <div key={aura.id} className={`settings-option-chip ${profileAura === aura.id ? 'selected' : ''}`} onClick={() => setProfileAura(aura.id)}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: aura.color, border: '1px solid var(--border-color)' }} />
                    <span className="chip-label">{aura.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Accent */}
            <div className="settings-card">
              <div className="settings-card-header">
                <Palette size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Profile Accent</span>
              </div>
              <p style={{ fontSize: '12px', opacity: 0.5, marginBottom: '12px' }}>Highlights your profile buttons and links with a personal color.</p>
              <div className="settings-option-grid cols-5">
                {PROFILE_ACCENTS.map(accent => (
                  <div key={accent.id} className={`settings-option-chip ${profileAccent === accent.id ? 'selected' : ''}`} onClick={() => setProfileAccent(accent.id)}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: accent.color, border: '2px solid var(--border-color)', boxShadow: profileAccent === accent.id ? `0 0 14px ${accent.color}` : 'none' }} />
                    <span className="chip-label">{accent.name.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ THEME TAB ═══ */}
        {activeSection === 'theme' && (
          <div className="fade-in">
            <h2 className="settings-section-title">Theme</h2>
            <p className="settings-section-subtitle">Change the platform's visual identity. Your aesthetic preferences are securely synchronized to your account.</p>
            <div className="settings-card">
              <ThemePanel />
            </div>

            {/* Reality Preview Section */}
            <div className="settings-card" style={{ marginTop: 'var(--space-md)', overflow: 'hidden' }}>
              <div className="settings-card-header">
                <Sparkles size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Profile Preview</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                See how your identity appears to others.
              </p>
              
              <div className="settings-reality-view" style={{ 
                padding: '30px', 
                borderRadius: '24px', 
                background: 'var(--bg-primary)',
                border: '1px solid var(--glass-border)',
                position: 'relative',
                boxShadow: 'var(--card-shadow, 0 20px 40px rgba(0,0,0,0.2))'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <Avatar src={avatarPreview} username={username} borderStyle={borderStyle} avatarShape={avatarShape} size="70px" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', ...getNameEffectStyle(nameEffect), textShadow: 'var(--text-glow)' }}>
                      {name || username || 'Profile Name'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '2px', opacity: 0.8 }}>
                      {statusTitle ? `◈ ${statusTitle.toUpperCase()}` : `@${username || 'username'}`}
                    </p>
                  </div>
                </div>
                <p style={{ marginTop: '16px', fontSize: '13px', opacity: 0.7, fontFamily: BIO_FONTS.find(f => f.id === bioFont)?.family || 'inherit' }}>
                  {bio || "Your bio will appear like this on your public profile..."}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <div style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--accent-color)', color: 'var(--bg-primary)', fontSize: '10px', fontWeight: '900' }}>FOLLOW</div>
                  <div style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(var(--accent-color-rgb), 0.1)', color: 'var(--accent-color)', fontSize: '10px', fontWeight: '900', border: '1px solid rgba(var(--accent-color-rgb), 0.2)' }}>MESSAGE</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SECURITY TAB ═══ */}
        {activeSection === 'security' && (
          <div className="fade-in">
            <h2 className="settings-section-title">Security</h2>
            <p className="settings-section-subtitle">Manage your password and identity verification.</p>

            <div className="settings-card">
              <div className="settings-card-header">
                <Shield size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Change Password</span>
              </div>
              <div className="settings-grid-2">
                <div>
                  <label className="settings-card-label" style={{ display: 'block', marginBottom: '8px' }}>New Password</label>
                  <input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="settings-input" placeholder="New identity key" />
                </div>
                <div>
                  <label className="settings-card-label" style={{ display: 'block', marginBottom: '8px' }}>Confirm Password</label>
                  <input type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="settings-input" placeholder="Confirm new password" />
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="settings-card">
              <div className="settings-card-header">
                <Shield size={16} color="var(--accent-color)" />
                <span className="settings-card-label">Identity Verification</span>
              </div>
              {verificationStatus === 'verified' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 20px', backgroundColor: 'rgba(0, 150, 255, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(0, 150, 255, 0.2)' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #00b4db, #0083B0)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0, 150, 255, 0.3)' }}>
                    <Shield size={36} color="white" />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#00b4db' }}>Verified Identity</h3>
                  <p style={{ textAlign: 'center', fontSize: '13px', opacity: 0.7, lineHeight: 1.6, maxWidth: '400px' }}>Your identity has been confirmed. The verified badge is permanently bound to your profile.</p>
                </div>
              ) : (
                <div style={{ padding: '24px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', opacity: 0.6, marginBottom: '16px' }}>Verification is not yet available for your account.</p>
                  <button className="exotic-gradient" style={{ padding: '14px 28px', borderRadius: 'var(--radius-md)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                    Apply for Verification
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ DANGER ZONE TAB ═══ */}
        {activeSection === 'danger' && (
          <div className="fade-in">
            <h2 className="settings-section-title" style={{ color: 'var(--danger-color)' }}>Danger Zone</h2>
            <p className="settings-section-subtitle">Irreversible actions. Proceed with extreme caution.</p>

            <div className="settings-danger-card">
              <div className="settings-card-header">
                <Trash2 size={16} color="var(--danger-color)" />
                <span className="settings-card-label" style={{ color: 'var(--danger-color)', opacity: 0.8 }}>Delete Account</span>
              </div>
              <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '20px', lineHeight: 1.6 }}>
                Deleting your account is irreversible. All posts, reposts, and connections will be permanently destroyed.
              </p>
              <button className="settings-danger-btn" onClick={async () => {
                if (window.confirm("CRITICAL WARNING: Are you absolutely sure? All data will be permanently erased.")) {
                  const res = await deleteAccount();
                  if (!res.success) showToast("Failed: " + res.message, "error");
                }
              }}>
                <Trash2 size={14} />
                Permanently Delete Account
              </button>
            </div>
          </div>
        )}

        {/* ── Sticky Save Bar ── */}
        {activeSection !== 'danger' && activeSection !== 'theme' && (
          <div className="settings-save-bar">
            <button onClick={() => navigate(-1)} className="settings-cancel-btn">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="settings-save-btn exotic-gradient">
              {loading ? 'Syncing...' : 'Save Changes'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
