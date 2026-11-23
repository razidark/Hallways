import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, Shield, Camera, Edit2, Palette, Type, Crown, Hexagon, Globe, Layers, Zap } from 'lucide-react';
import Avatar from './Avatar';
import { SHAPE_CLIPS } from '../lib/avatarShapes';
import ThemePanel from './ThemePanel';
import { getDynamicAvatarUrl } from '../lib/utils';

const EditProfileModal = ({ onClose }) => {
  const { currentUser, updateProfile, updatePassword, uploadAvatar, deleteAccount } = useAuth();
  const [name, setName] = useState(currentUser.full_name || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [bio, setBio] = useState(currentUser.bio ?? "");
  const [status, setStatus] = useState(currentUser.status || "");
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatar_url);
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(currentUser.banner_url);
  const [bannerFile, setBannerFile] = useState(null);
  const [borderStyle, setBorderStyle] = useState(currentUser.border_style || 'normal');
  const [avatarShape, setAvatarShape] = useState(currentUser.avatar_shape || 'hexagon');
  const [profileAura, setProfileAura] = useState(currentUser.profile_aura || 'none');
  const [nameEffect, setNameEffect] = useState(currentUser.name_effect || 'none');
  const [statusTitle, setStatusTitle] = useState(currentUser.status_title || '');
  const [bioFont, setBioFont] = useState(currentUser.bio_font || 'default');
  const [profileAccent, setProfileAccent] = useState(currentUser.profile_accent || 'default');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [activeTab, setActiveTab] = useState('basic'); // basic, aesthetic, advanced
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(currentUser?.is_verified ? 'verified' : 'unverified');
  const fileInputRef = useRef(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const BORDER_STYLES = [
    { id: 'normal', name: 'Standard', preview: 'var(--border-color)' },
    { id: 'glass-morphism', name: 'Glass', preview: 'rgba(255,255,255,0.3)' },
    { id: 'matrix-code', name: 'Terminal', preview: 'linear-gradient(45deg, #004d00, #00ff00)' },
    { id: 'cyber-neon', name: 'Cyber', preview: 'linear-gradient(45deg, #fdf001, #ff00ff)' },
    { id: 'ghibli-nature', name: 'Nature', preview: 'linear-gradient(45deg, #7bc96f, #c6e48b)' },
    { id: 'noir-cinema', name: 'Cinema', preview: 'linear-gradient(45deg, #333, #000)' },
    { id: 'gotham-gold', name: 'Gold Accent', preview: 'linear-gradient(45deg, #111, #facc15)' },
    { id: 'liquid-plasma', name: 'Plasma', preview: 'linear-gradient(180deg, #6c5ce7, #d63031)' },
    { id: 'spectral-prism', name: 'Prism', preview: 'linear-gradient(45deg, #ff0000, #ff7f00, #00ff00, #0000ff, #8b00ff)' }
  ];

  const AVATAR_SHAPES = [
    { id: 'circle', name: 'Circle', icon: '●' },
    { id: 'rounded', name: 'Rounded', icon: '▢' },
    { id: 'squircle', name: 'Squircle', icon: '◼' },
    { id: 'hexagon', name: 'Hexagon', icon: '⬡' },
    { id: 'diamond', name: 'Diamond', icon: '◆' },
    { id: 'octagon', name: 'Octagon', icon: '⬣' },
    { id: 'shield', name: 'Shield', icon: '🛡' },
    { id: 'star', name: 'Star', icon: '★' },
    { id: 'pentagon', name: 'Pentagon', icon: '⬠' },
    { id: 'clover', name: 'Clover', icon: '✤' }
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

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setIsChanged(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setIsChanged(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    let finalAvatarUrl = avatarPreview;
    let finalBannerUrl = bannerPreview;

    // 1. Upload new avatar if selected
    if (avatarFile) {
      const uploadRes = await uploadAvatar(avatarFile, true); // true = skipMetadataSync
      if (uploadRes.success) {
        finalAvatarUrl = uploadRes.publicUrl;
      } else {
        setLoading(false);
        return alert("Avatar upload failed: " + uploadRes.message);
      }
    }

    // 2. Upload new banner if selected
    if (bannerFile) {
      const uploadRes = await uploadAvatar(bannerFile, true); 
      if (uploadRes.success) {
        finalBannerUrl = uploadRes.publicUrl;
      } else {
        setLoading(false);
        return alert("Banner upload failed: " + uploadRes.message);
      }
    }
    
    // 3. Update Profile metadata (this handles the final metadata sync)
    const updates = { 
      full_name: name, 
      username: username,
      bio: bio, 
      avatar_url: finalAvatarUrl,
      banner_url: finalBannerUrl,
      border_style: borderStyle,
      avatar_shape: avatarShape,
      profile_aura: profileAura,
      name_effect: nameEffect,
      status_title: statusTitle,
      bio_font: bioFont,
      profile_accent: profileAccent,
      website: website,
      status: status
    };
    const profileRes = await updateProfile(updates);
    // 3. Password handling
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setLoading(false);
        return alert("Passwords do not match!");
      }
      const passRes = await updatePassword(newPassword);
      if (!passRes.success) {
        setLoading(false);
        return alert("Profile updated, but password change failed: " + passRes.message);
      }
    }

    setLoading(false);
    if (profileRes.success) {
      onClose();
    } else {
      alert("Failed to sync identity: " + profileRes.message);
    }
  };

  const sectionStyle = {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: '24px',
    borderRadius: '24px',
    border: '1px solid var(--border-color)'
  };

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  };

  const sectionLabelStyle = {
    fontSize: '11px',
    fontWeight: '900',
    opacity: 0.4,
    letterSpacing: '1px'
  };

  const getNameEffectStyle = (effect) => {
    if (effect === 'none') return {};
    const ne = NAME_EFFECTS.find(n => n.id === effect);
    if (!ne || effect === 'none') return {};
    return {
      background: ne.preview,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      backgroundSize: effect === 'rainbow' ? '200% auto' : undefined,
      animation: effect === 'rainbow' ? 'rainbowFlow 4s linear infinite' : undefined
    };
  };

  const getBioFontFamily = (fontId) => {
    const f = BIO_FONTS.find(b => b.id === fontId);
    return f ? f.family : "'Outfit', sans-serif";
  };

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="edit-profile-modal-inner" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', width: '700px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', maxHeight: '90vh', border: '1px solid var(--border-color)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(16px, 3vw, 32px)', borderBottom: '1px solid var(--border-color)', gap: '12px' }}>
            <div style={{ minWidth: 0 }}>
             <h2 style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: '900', fontFamily: 'Space Grotesk' }}>Profile Settings</h2>
             <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px', letterSpacing: '1px' }}>
                STATUS: {isChanged ? 'UNSAVED_CHANGES' : 'IDENTITY_SYNC'}
             </p>
           </div>
           <button onClick={onClose} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', color: 'var(--text-primary)', flexShrink: 0 }} className="hover-scale"><X size={24} /></button>
        </div>

        {/* Pro Tabs */}
        <div className="edit-profile-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', overflowX: 'auto', scrollbarWidth: 'none' }}>
           <button onClick={() => setActiveTab('basic')} style={{ flex: '1 0 auto', padding: '14px 16px', border: 'none', background: activeTab === 'basic' ? 'rgba(var(--accent-color-rgb), 0.1)' : 'transparent', color: activeTab === 'basic' ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '11px', borderBottom: activeTab === 'basic' ? '2px solid var(--accent-color)' : '2px solid transparent', cursor: 'pointer', letterSpacing: '1px', whiteSpace: 'nowrap' }}>IDENTITY</button>
           <button onClick={() => setActiveTab('aesthetic')} style={{ flex: '1 0 auto', padding: '14px 16px', border: 'none', background: activeTab === 'aesthetic' ? 'rgba(var(--accent-color-rgb), 0.1)' : 'transparent', color: activeTab === 'aesthetic' ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '11px', borderBottom: activeTab === 'aesthetic' ? '2px solid var(--accent-color)' : '2px solid transparent', cursor: 'pointer', letterSpacing: '1px', whiteSpace: 'nowrap' }}>AVATAR & FRAME</button>
           <button onClick={() => setActiveTab('advanced')} style={{ flex: '1 0 auto', padding: '14px 16px', border: 'none', background: activeTab === 'advanced' ? 'rgba(var(--accent-color-rgb), 0.1)' : 'transparent', color: activeTab === 'advanced' ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '11px', borderBottom: activeTab === 'advanced' ? '2px solid var(--accent-color)' : '2px solid transparent', cursor: 'pointer', letterSpacing: '1px', whiteSpace: 'nowrap' }}>STYLE & FLAIR</button>
           <button onClick={() => setActiveTab('verification')} style={{ flex: '1 0 auto', padding: '14px 16px', border: 'none', background: activeTab === 'verification' ? 'rgba(var(--accent-color-rgb), 0.1)' : 'transparent', color: activeTab === 'verification' ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '11px', borderBottom: activeTab === 'verification' ? '2px solid var(--accent-color)' : '2px solid transparent', cursor: 'pointer', letterSpacing: '1px', whiteSpace: 'nowrap' }}>SECURITY & BADGES</button>
        </div>
        
        <div className="scrollbar-hidden" style={{ padding: 'clamp(16px, 3vw, 32px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 32px)' }}>
           {/* Global Hidden Input for Avatar Uploads */}
           <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ display: 'none' }} accept="image/*" />
           
           {activeTab === 'basic' ? (
             <>
               {/* LIVE PREVIEW CARD */}
               <div style={{ ...sectionStyle, backgroundColor: 'var(--bg-tertiary)', position: 'relative', overflow: 'hidden' }}>
                 
                 {bannerPreview && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '90px', backgroundImage: `url(${bannerPreview})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6 }}></div>
                 )}
                 <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1, marginTop: bannerPreview ? '40px' : '0' }}>
                   <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                     <div style={{ position: 'relative' }}>
                         <Avatar src={avatarPreview} username={username} borderStyle={borderStyle} avatarShape={avatarShape} size="80px" />
                         <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, padding: '8px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                             <Camera size={16} />
                         </button>
                     </div>
                     <div>
                       <h4 style={{ fontWeight: 'bold', fontSize: '18px', ...getNameEffectStyle(nameEffect), textShadow: bannerPreview ? '0 2px 10px rgba(0,0,0,0.8)' : 'none' }}>{name || username}</h4>
                       <p style={{ color: 'var(--accent-color)', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textShadow: bannerPreview ? '0 2px 10px rgba(0,0,0,0.8)' : 'none' }}>
                         {statusTitle ? `◈ ${statusTitle.toUpperCase()}` : 'MEMBER'}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* BANNERS SECTION */}
               <div style={sectionStyle}>
                 <div style={sectionHeaderStyle}>
                   <Palette size={16} color="var(--accent-color)" />
                   <h3 style={sectionLabelStyle}>HEADER BANNER</h3>
                 </div>
                 <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Upload a breathtaking ultra-wide vision to anchor your profile.</p>
                 <div style={{ display: 'flex', gap: '16px' }}>
                    <input type="file" id="banner-upload" onChange={onBannerChange} style={{ display: 'none' }} accept="image/*" />
                    <label htmlFor="banner-upload" className="exotic-gradient hover-scale" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                       {loading ? 'Uploading...' : 'Upload Image'}
                    </label>
                    {bannerPreview && (
                        <button onClick={() => {
                           setBannerPreview(null);
                           setBannerFile(null);
                           setIsChanged(true);
                        }} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(255,100,100,0.3)', background: 'rgba(255,100,100,0.1)', color: '#ff6b6b', fontWeight: 'bold', cursor: 'pointer' }}>
                           Dissolve Banner
                        </button>
                    )}
                 </div>
               </div>

               <div>
                 <div style={sectionHeaderStyle}>
                   <Shield size={16} color="var(--accent-color)" />
                   <h3 style={sectionLabelStyle}>PUBLIC DATA</h3>
                 </div>
               </div>

               <div className="edit-profile-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <h4 style={sectionLabelStyle}>DISPLAY NAME</h4>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', marginTop: '12px' }} />
                  </div>
                  <div>
                    <h4 style={sectionLabelStyle}>USERNAME (@)</h4>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', marginTop: '12px' }} />
                  </div>
               </div>

               <div>
                 <h4 style={{ ...sectionLabelStyle, marginBottom: '12px' }}>BIOGRAPHY</h4>
                 <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="3" style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: getBioFontFamily(bioFont) }}></textarea>
               </div>

               <div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                   <Globe size={14} color="var(--accent-color)" />
                   <h4 style={sectionLabelStyle}>WEBSITE</h4>
                 </div>
                 <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Zap size={14} color="var(--accent-color)" />
                    <h4 style={sectionLabelStyle}>STATUS MESSAGE (MOOD)</h4>
                  </div>
                  <input type="text" value={status} onChange={(e) => setStatus(e.target.value.slice(0, 60))} maxLength={60} placeholder="What's your current frequency?" style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
                  <p style={{ fontSize: '10px', opacity: 0.3, marginTop: '6px', textAlign: 'right' }}>{status.length}/60</p>
               </div>

               {/* Security Area */}
               <div style={sectionStyle}>
                  <div style={sectionHeaderStyle}>
                     <Shield size={16} color="var(--accent-color)" />
                     <h4 style={sectionLabelStyle}>SECURITY KEY (IDENTITY)</h4>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                     <div style={{ flex: 1, minWidth: '200px' }}>
                       <input type="password" autoComplete="new-password" placeholder="New Identity Key" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
                     </div>
                     <div style={{ flex: 1, minWidth: '200px' }}>
                       <input type="password" autoComplete="new-password" placeholder="Confirm New Key" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
                     </div>
                   </div>
               </div>

               {/* Danger Zone */}
               <div style={{...sectionStyle, border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)'}}>
                  <div style={sectionHeaderStyle}>
                     <Shield size={16} color="var(--danger-color)" />
                     <h4 style={{...sectionLabelStyle, color: 'var(--danger-color)', opacity: 0.8}}>DANGER ZONE</h4>
                  </div>
                  <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px', lineHeight: '1.5' }}>
                    Erasing your identity is irreversible. All of your posts, strands, echoes, and connections will be permanently destroyed.
                  </p>
                  <button 
                    onClick={async () => {
                      if (window.confirm("CRITICAL WARNING: Are you absolutely sure? This cannot be undone.")) {
                         const res = await deleteAccount();
                         if (!res.success) alert("Failed to delete account: " + res.message);
                      }
                    }} 
                    style={{ background: 'var(--danger-color)', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                     Delete Account
                  </button>
               </div>
             </>
           ) : activeTab === 'aesthetic' ? (
             <>
               {/* LIVE AVATAR PREVIEW */}
               <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar src={avatarPreview} username={username} borderStyle={borderStyle} avatarShape={avatarShape} size="120px" />
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      style={{ 
                        position: 'absolute', 
                        bottom: '24px', 
                        right: '-8px', 
                        padding: '10px', 
                        borderRadius: '50%', 
                        background: 'var(--accent-color)', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer', 
                        boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                        zIndex: 10
                      }}
                      className="hover-scale"
                    >
                      <Camera size={20} />
                    </button>
                    <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', fontWeight: 'bold', opacity: 0.5, letterSpacing: '1px' }}>
                      {AVATAR_SHAPES.find(s => s.id === avatarShape)?.name.toUpperCase()} • {BORDER_STYLES.find(s => s.id === borderStyle)?.name.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* DYNAMIC AVATAR GENERATOR */}
                <div style={sectionStyle}>
                   <div style={sectionHeaderStyle}>
                      <Sparkles size={16} color="var(--accent-color)" />
                      <h4 style={sectionLabelStyle}>DYNAMIC AVATAR GENERATOR</h4>
                   </div>
                   <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                     Discard custom uploads to generate a gorgeous, local geometric vector avatar.
                   </p>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                     {[
                       { id: 'vibrant', name: 'Cyber Vibrant' },
                       { id: 'light', name: 'Pastel Light' },
                       { id: 'dark', name: 'Neon Dark' },
                       { id: 'mono', name: 'Minimalist Mono' }
                     ].map(styleOpt => (
                       <button
                         key={styleOpt.id}
                         onClick={() => {
                           const generated = getDynamicAvatarUrl(username || currentUser.username, styleOpt.id);
                           setAvatarPreview(generated);
                           setAvatarFile(null);
                           setIsChanged(true);
                         }}
                         className="hover-scale hover-bright"
                         style={{
                           padding: '12px 10px',
                           borderRadius: '16px',
                           background: 'var(--bg-secondary)',
                           border: '1px solid var(--border-color)',
                           color: 'var(--text-primary)',
                           fontWeight: 'bold',
                           fontSize: '11px',
                           cursor: 'pointer',
                           textAlign: 'center',
                           transition: 'all 0.2s'
                         }}
                       >
                         {styleOpt.name}
                       </button>
                     ))}
                   </div>
                   {avatarPreview && avatarPreview.startsWith('data:image/svg+xml') && (
                     <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                       <button
                         onClick={() => {
                           setAvatarPreview(null);
                           setAvatarFile(null);
                           setIsChanged(true);
                         }}
                         style={{
                           padding: '6px 12px',
                           fontSize: '10px',
                           color: 'var(--danger-color)',
                           background: 'rgba(239,68,68,0.1)',
                           borderRadius: '8px',
                           border: '1px solid rgba(239,68,68,0.2)',
                           cursor: 'pointer'
                         }}
                       >
                         Clear Dynamic Preset
                       </button>
                     </div>
                   )}
                </div>

               {/* AVATAR SHAPE SELECTOR */}
               <div style={sectionStyle}>
                  <div style={sectionHeaderStyle}>
                     <Hexagon size={16} color="var(--accent-color)" />
                     <h4 style={sectionLabelStyle}>AVATAR SHAPE</h4>
                  </div>
                  <div className="edit-profile-shape-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
                     {AVATAR_SHAPES.map(shape => {
                       const clipPath = SHAPE_CLIPS[shape.id];
                       return (
                         <div 
                           key={shape.id} 
                           onClick={() => setAvatarShape(shape.id)}
                           style={{ 
                             padding: '12px 4px', 
                             borderRadius: '16px', 
                             border: avatarShape === shape.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', 
                             background: avatarShape === shape.id ? 'rgba(var(--accent-color-rgb), 0.1)' : 'var(--bg-secondary)',
                             cursor: 'pointer',
                             textAlign: 'center',
                             transition: 'all 0.2s ease',
                             display: 'flex',
                             flexDirection: 'column',
                             alignItems: 'center',
                             gap: '6px'
                           }}
                         >
                           <div style={{
                             width: '32px',
                             height: '32px',
                             background: avatarShape === shape.id ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                             clipPath: clipPath,
                             WebkitClipPath: clipPath,
                             transition: 'all 0.2s ease'
                           }} />
                           <span style={{ fontSize: '9px', fontWeight: '900', color: avatarShape === shape.id ? 'var(--accent-color)' : 'var(--text-secondary)', letterSpacing: '0.5px' }}>{shape.name.toUpperCase()}</span>
                         </div>
                       );
                     })}
                  </div>
               </div>

               {/* IDENTITY FRAMES */}
               <div style={sectionStyle}>
                  <div style={sectionHeaderStyle}>
                      <Sparkles size={16} color="var(--accent-color)" />
                      <h4 style={sectionLabelStyle}>PROFILE FRAME</h4>
                  </div>
                  <div className="edit-profile-frame-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                     {BORDER_STYLES.map(style => (
                        <div 
                          key={style.id} 
                          onClick={() => setBorderStyle(style.id)}
                          style={{ 
                            padding: '14px 8px', 
                            borderRadius: '16px', 
                            border: borderStyle === style.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', 
                            background: borderStyle === style.id ? 'rgba(var(--accent-color-rgb), 0.1)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            justifyContent: 'center'
                          }}
                        >
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: style.preview,
                            border: '1px solid var(--border-color)',
                            flexShrink: 0
                          }} />
                          <span style={{ fontSize: '11px', fontWeight: '900', color: borderStyle === style.id ? 'var(--accent-color)' : 'var(--text-primary)' }}>{style.name.toUpperCase()}</span>
                        </div>
                     ))}
                  </div>
                </div>

                {/* GLOBAL REALITY THEME (ACCESSIBILITY FOR MOBILE) */}
                <div style={sectionStyle}>
                   <div style={sectionHeaderStyle}>
                      <Layers size={16} color="var(--accent-color)" />
                      <h4 style={sectionLabelStyle}>GLOBAL REALITY THEME</h4>
                   </div>
                   <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                     Change the entire platform's visual identity. Changes are personal to your current session.
                   </p>
                   <ThemePanel />
                </div>

                <div style={sectionStyle}>
                   <div style={sectionHeaderStyle}>
                       <Edit2 size={16} color="var(--accent-color)" />
                       <h4 style={sectionLabelStyle}>PROFILE GLOW STYLES</h4>
                   </div>
                   <div className="edit-profile-glow-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px' }}>
                      {PROFILE_GLOW_STYLES.map(aura => (
                        <div 
                          key={aura.id} 
                          onClick={() => setProfileAura(aura.id)}
                          style={{ 
                            padding: '14px 8px', 
                            borderRadius: '16px', 
                            border: profileAura === aura.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', 
                            background: profileAura === aura.id ? 'rgba(var(--accent-color-rgb), 0.1)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: aura.color,
                            border: '1px solid var(--border-color)'
                          }} />
                          <span style={{ fontSize: '9px', fontWeight: '900', color: profileAura === aura.id ? 'var(--accent-color)' : 'var(--text-primary)', letterSpacing: '0.5px' }}>{aura.name}</span>
                        </div>
                     ))}
                  </div>
               </div>
             </>
           ) : activeTab === 'advanced' ? (
             <>
               {/* ADVANCED / STYLE & FLAIR TAB */}
               
               {/* NAME EFFECT */}
               <div style={sectionStyle}>
                  <div style={sectionHeaderStyle}>
                     <Type size={16} color="var(--accent-color)" />
                     <h4 style={sectionLabelStyle}>DISPLAY NAME EFFECT</h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <span style={{ opacity: 0.4, fontSize: '11px', fontWeight: '900', letterSpacing: '1px', whiteSpace: 'nowrap' }}>PREVIEW:</span>
                    <span style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'Space Grotesk', ...getNameEffectStyle(nameEffect) }}>{name || username || 'Your Name'}</span>
                  </div>
                  <div className="edit-profile-effect-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px' }}>
                     {NAME_EFFECTS.map(effect => (
                        <div 
                          key={effect.id} 
                          onClick={() => setNameEffect(effect.id)}
                          style={{ 
                            padding: '10px 6px', 
                            borderRadius: '14px', 
                            border: nameEffect === effect.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', 
                            background: nameEffect === effect.id ? 'rgba(var(--accent-color-rgb), 0.1)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{
                            width: '100%',
                            height: '4px',
                            borderRadius: '2px',
                            background: effect.preview,
                          }} />
                          <span style={{ fontSize: '9px', fontWeight: '900', color: nameEffect === effect.id ? 'var(--accent-color)' : 'var(--text-secondary)', letterSpacing: '0.5px' }}>{effect.name.toUpperCase()}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* STATUS TITLE */}
               <div style={sectionStyle}>
                  <div style={sectionHeaderStyle}>
                     <Crown size={16} color="var(--accent-color)" />
                     <h4 style={sectionLabelStyle}>STATUS TITLE</h4>
                  </div>
                  <p style={{ fontSize: '11px', opacity: 0.4, marginBottom: '12px' }}>A custom title displayed beneath your name on your profile.</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                     {STATUS_TITLES.map(title => (
                        <button
                          key={title}
                          onClick={() => setStatusTitle(title)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '12px',
                            border: statusTitle === title ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                            background: statusTitle === title ? 'rgba(var(--accent-color-rgb), 0.15)' : 'var(--bg-secondary)',
                            color: statusTitle === title ? 'var(--accent-color)' : 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {title || '✕ None'}
                        </button>
                     ))}
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <input 
                      type="text" 
                      placeholder="Or type a custom title..." 
                      value={statusTitle} 
                      onChange={(e) => setStatusTitle(e.target.value.slice(0, 24))}
                      maxLength={24}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }}
                    />
                    <p style={{ fontSize: '10px', opacity: 0.3, marginTop: '6px', textAlign: 'right' }}>{statusTitle.length}/24</p>
                  </div>
               </div>

               {/* BIO FONT */}
               <div style={sectionStyle}>
                  <div style={sectionHeaderStyle}>
                     <Type size={16} color="var(--accent-color)" />
                     <h4 style={sectionLabelStyle}>BIO TYPOGRAPHY</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {BIO_FONTS.map(font => (
                        <div
                          key={font.id}
                          onClick={() => setBioFont(font.id)}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '14px',
                            border: bioFont === font.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                            background: bioFont === font.id ? 'rgba(var(--accent-color-rgb), 0.1)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span style={{ fontFamily: font.family, fontSize: '14px', color: bioFont === font.id ? 'var(--accent-color)' : 'var(--text-primary)' }}>The quick brown fox jumps over the lazy dog</span>
                          <span style={{ fontSize: '10px', fontWeight: '900', opacity: 0.4, letterSpacing: '0.5px', whiteSpace: 'nowrap', marginLeft: '12px' }}>{font.name.toUpperCase()}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* PROFILE ACCENT COLOR */}
               <div style={sectionStyle}>
                  <div style={sectionHeaderStyle}>
                     <Palette size={16} color="var(--accent-color)" />
                     <h4 style={sectionLabelStyle}>PROFILE ACCENT</h4>
                  </div>
                  <p style={{ fontSize: '11px', opacity: 0.4, marginBottom: '12px' }}>Highlights your profile buttons and links with a personal color.</p>
                  <div className="edit-profile-accent-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
                     {PROFILE_ACCENTS.map(accent => (
                        <div
                          key={accent.id}
                          onClick={() => setProfileAccent(accent.id)}
                          style={{
                            padding: '12px 4px',
                            borderRadius: '14px',
                            border: profileAccent === accent.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                            background: profileAccent === accent.id ? 'rgba(var(--accent-color-rgb), 0.1)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: accent.color,
                            border: '2px solid var(--border-color)',
                            boxShadow: profileAccent === accent.id ? `0 0 12px ${accent.color}` : 'none'
                          }} />
                          <span style={{ fontSize: '9px', fontWeight: '900', color: profileAccent === accent.id ? 'var(--accent-color)' : 'var(--text-secondary)', letterSpacing: '0.5px' }}>{accent.name.toUpperCase()}</span>
                        </div>
                     ))}
                  </div>
               </div>

                <div style={{ padding: '20px', background: 'rgba(var(--accent-color-rgb), 0.05)', borderRadius: '24px', border: '1px solid rgba(var(--accent-color-rgb), 0.1)' }}>
                  <p style={{ fontSize: '12px', opacity: 0.7, fontStyle: 'italic', textAlign: 'center' }}>"Identity is not static, it is an ever-shifting fragment of the corridor."</p>
               </div>
             </>
           ) : activeTab === 'verification' ? (
             <>
               <div style={sectionStyle}>
                  <div style={sectionHeaderStyle}>
                     <Shield size={16} color="var(--accent-color)" />
                     <h4 style={sectionLabelStyle}>IDENTITY VERIFICATION (KYC)</h4>
                  </div>
                  
                  {verificationStatus === 'verified' && (
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 20px', backgroundColor: 'rgba(0, 150, 255, 0.05)', borderRadius: '20px', border: '1px solid rgba(0, 150, 255, 0.2)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #00b4db, #0083B0)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0, 150, 255, 0.3)' }}>
                           <Shield size={36} color="white" />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#00b4db' }}>Verified Identity</h2>
                        <p style={{ textAlign: 'center', fontSize: '13px', opacity: 0.7, lineHeight: 1.6, maxWidth: '400px' }}>
                          Your identity documents have been processed and confirmed. The verified badge is now permanently bound to your profile.
                        </p>
                     </div>
                  )}

                  {verificationStatus === 'pending' && (
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
                        <div className="spinner" style={{ position: 'relative', width: '60px', height: '60px', top: 'auto', left: 'auto', transform: 'none', borderTopColor: '#fdcb6e' }}></div>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fdcb6e', marginTop: '16px' }}>Verification Pending</h2>
                        <p style={{ textAlign: 'center', fontSize: '13px', opacity: 0.7, lineHeight: 1.6, maxWidth: '400px' }}>
                          Your application is currently being reviewed by our secured identity partner. This process may take up to 48 hours.
                        </p>
                     </div>
                  )}

                  {verificationStatus === 'unverified' && (
                     <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                           <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>Security Briefing</h4>
                           <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                             Hallway requires legitimate government-issued documentation to issue verified badges. By submitting an application, you agree to secure automated analysis by our verified identity provider.
                           </p>
                           
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>LEGAL FULL NAME</span>
                                <input type="text" placeholder="John Doe" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }} />
                              </label>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="hover-bright" style={{ flex: 1, padding: '24px', borderRadius: '16px', border: '2px dashed var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                   <Camera size={24} color="var(--text-secondary)" />
                                   <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Scan ID Front</span>
                                </button>
                                <button className="hover-bright" style={{ flex: 1, padding: '24px', borderRadius: '16px', border: '2px dashed var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                   <Camera size={24} color="var(--text-secondary)" />
                                   <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Scan Face</span>
                                </button>
                              </div>
                              <button 
                                onClick={() => {
                                  setLoading(true);
                                  setTimeout(() => {
                                    setLoading(false);
                                    setVerificationStatus('pending');
                                  }, 2000);
                                }}
                                className="exotic-gradient" 
                                style={{ padding: '16px', borderRadius: '14px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px' }}
                              >
                                SUBMIT FOR VERIFICATION
                              </button>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
              </>
            ) : null}

           <div className="edit-profile-footer" style={{ display: 'flex', gap: '12px', paddingBottom: 'clamp(16px, 3vw, 32px)', flexWrap: 'wrap' }}>
              <button 
                onClick={handleSave} 
                disabled={loading} 
                className={loading ? "" : "exotic-gradient"} 
                style={{ 
                  flex: 2, 
                  color: 'white', 
                  padding: '18px', 
                  borderRadius: '20px', 
                  fontWeight: '900', 
                  fontSize: '16px', 
                  border: 'none', 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  opacity: loading ? 0.7 : 1, 
                  boxShadow: loading ? 'none' : '0 20px 40px rgba(var(--accent-color-rgb), 0.3)' 
                }}
              >
                {loading ? 'SYNCING...' : 'SAVE TRANSFORMATION'}
              </button>
              <button onClick={onClose} style={{ flex: 1, color: 'var(--text-primary)', padding: '18px', borderRadius: '20px', fontWeight: 'bold', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>CANCEL</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
