import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Image, Video, X, ArrowLeft, Camera, Sparkles, Music2, UploadCloud, Maximize2, Minimize2, Grid, Clapperboard, PlusCircle } from 'lucide-react';
import { useStories } from '../context/StoryContext';
import MusicSearch from './MusicSearch';
import Avatar from './Avatar';
import { validateFileSize, checkQuota } from '../lib/storageQuota';

const FILTERS = [
  { name: 'Normal', class: '' },
  { name: 'Classic Vintage', class: 'filter-vaporwave' },
  { name: 'High Contrast Mono', class: 'filter-void' },
  { name: 'Warm Amber', class: 'filter-amber' },
  { name: 'Neon Accent', class: 'filter-cyber' },
  { name: 'Cold Lunar', class: 'filter-lunar' },
  { name: 'Vibrant Neon', class: 'filter-neon' },
  { name: 'Retro Synth', class: 'filter-synthwave' },
  { name: 'Digital Green', class: 'filter-matrix' },
  { name: 'Warm Crimson', class: 'filter-crimson' },
  { name: 'Frozen Blue', class: 'filter-frozen' }
];

const CreatePostModal = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, createModalType, addPost } = usePosts();
  const { createStory } = useStories();
  const { currentUser } = useAuth();
  const { showToast } = useUI();
  const [step, setStep] = useState(1); // 1: Upload (Drag&Drop), 2: Filter, 3: Caption
  const [postType, setPostType] = useState("post");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTrack] = useState(null);
  const [trimOffset] = useState(0); // 0 to 15s
  const [imageFit, setImageFit] = useState('cover'); // 'cover' or 'contain'
  const [previewAudio] = useState(new Audio());


  useEffect(() => {
    if (selectedTrack && previewAudio.src) {
      previewAudio.currentTime = trimOffset;
      previewAudio.play().catch(() => { });
    }
  }, [trimOffset, selectedTrack, previewAudio]);

  useEffect(() => {
    return () => {
      previewAudio.pause();
      previewAudio.src = '';
    };
  }, [previewAudio]);

  const handleClose = useCallback(() => {
    setIsCreateModalOpen(false);
    setStep(1);
    setCaption("");
    setImageUrl("");
    setImageFile(null);
    setSelectedFilter("");
    setIsSubmitting(false);
    setIsDragging(false);
  }, [setIsCreateModalOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isCreateModalOpen) {
      document.body.style.overflow = 'hidden';
      setPostType(createModalType || 'post');
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isCreateModalOpen, createModalType]);

  if (!isCreateModalOpen) return null;

  const processFile = (file) => {
    if (file) {
      // STORAGE GATE: Validate file size before preview
      const sizeCheck = validateFileSize(file);
      if (!sizeCheck.valid) {
        showToast(sizeCheck.message, 'error');
        return;
      }

      // STORAGE GATE: Check quota before preview
      const quotaCheck = checkQuota(currentUser?.storage_used, file.size);
      if (!quotaCheck.allowed) {
        showToast(quotaCheck.message, 'error');
        return;
      }

      // Determine if cinematic content (video or GIF) -> Reel treatment
      // (Unless the user specifically opened the modal in 'story' mode)
      if (postType !== 'story') {
        if (file.type.startsWith('video/') || file.type === 'image/gif') setPostType('reel');
        else setPostType('post');
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
        setStep(2); // Jump straight to filter step
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile && !imageUrl) {
      alert("Please select an image or paste a URL first.");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const musicData = selectedTrack ? {
        title: selectedTrack.title,
        artist: selectedTrack.artist,
        preview_url: selectedTrack.preview_url,
        album_art: selectedTrack.album_art,
        start_time: trimOffset,
        duration: 15
      } : null;

      let res;
      if (postType === 'story') {
        res = await createStory(imageFile, caption, selectedFilter);
      } else {
        res = await addPost(imageFile || imageUrl, caption, selectedFilter, postType, musicData);
      }
      if (res.success) {
        handleClose();
        showToast(postType === 'story' ? "Story Added" : "Post Shared", "success");
      } else {
        showToast(res.message || "Post failed to upload", "error");
      }
    } catch (err) {
      console.error("CreatePostModal Submit Error:", err);
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(30px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 6000 }}>

      <button onClick={handleClose} style={{ position: 'absolute', top: '24px', right: '32px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', zIndex: 6001 }} className="hover-bright"><X size={32} /></button>

      <div className="create-post-modal-inner" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', width: step === 3 ? '85vw' : '65vw', maxWidth: step === 3 ? '1200px' : '900px', height: '85vh', maxHeight: '900px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.8)', transition: 'width 0.3s ease' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          {step > 1 ? <button onClick={() => setStep(step === 3 ? 2 : 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><ArrowLeft size={24} /></button> : <div style={{ width: 24 }} />}
          <h3 style={{ fontWeight: '900', fontFamily: 'Space Grotesk', fontSize: '18px', letterSpacing: '-0.5px', textTransform: 'capitalize' }}>
            {step === 1 ? `Create new ${postType}` : step === 2 ? 'Edit Media' : `Finalize ${postType}`}
          </h3>
          {step === 2 && imageUrl ? (
            <button
              onClick={() => setStep(3)}
              className="hover-scale"
              style={{ background: 'var(--accent-color)', color: 'var(--bg-primary)', padding: '6px 16px', borderRadius: 'var(--radius-md)', fontSize: '11px', fontWeight: '900', border: 'none', cursor: 'pointer', letterSpacing: '1px' }}
            >
              NEXT
            </button>
          ) : (
            <div style={{ width: 24 }} />
          )}
        </div>

        {/* Step 1: TYPE SELECTION & UPLOAD */}
        {step === 1 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}
          >
            {/* Type Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: '30px 0 0' }}>
              <button
                onClick={() => setPostType('post')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: 'var(--radius-md)',
                  background: postType === 'post' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: postType === 'post' ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                  color: postType === 'post' ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all 0.3s'
                }}
                className="hover-bright"
              >
                <Grid size={18} />
                <span style={{ fontWeight: '900', fontSize: '12px', letterSpacing: '1px' }}>GRID POST</span>
              </button>
              <button
                onClick={() => setPostType('story')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: 'var(--radius-md)',
                  background: postType === 'story' ? 'rgba(var(--accent-color-rgb), 0.1)' : 'transparent',
                  border: postType === 'story' ? '1px solid rgba(var(--accent-color-rgb), 0.3)' : '1px solid transparent',
                  color: postType === 'story' ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all 0.3s'
                }}
                className="hover-bright"
              >
                <PlusCircle size={18} />
                <span style={{ fontWeight: '900', fontSize: '12px', letterSpacing: '1px' }}>STORY</span>
              </button>
              <button
                onClick={() => setPostType('reel')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: 'var(--radius-md)',
                  background: postType === 'reel' ? 'rgba(var(--accent-color-rgb), 0.1)' : 'transparent',
                  border: postType === 'reel' ? '1px solid rgba(var(--accent-color-rgb), 0.3)' : '1px solid transparent',
                  color: postType === 'reel' ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all 0.3s'
                }}
                className="hover-bright"
              >
                <Clapperboard size={18} />
                <span style={{ fontWeight: '900', fontSize: '12px', letterSpacing: '1px' }}>REEL</span>
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
              <div style={{ position: 'absolute', inset: '40px', border: isDragging ? '2px dashed var(--accent-color)' : '2px dashed transparent', borderRadius: 'var(--radius-xl)', pointerEvents: 'none', transition: 'all 0.2s', marginTop: '100px' }}></div>

              <UploadCloud size={80} style={{ color: isDragging ? 'var(--accent-color)' : 'var(--text-primary)', opacity: isDragging ? 1 : 0.4, marginBottom: '20px', transition: 'all 0.2s' }} />
              <h4 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Drag media here</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '32px' }}>High-fidelity {postType === 'reel' ? 'videos' : 'photos'} supported.</p>

              <label className="exotic-gradient hover-scale" style={{ padding: '14px 28px', borderRadius: 'var(--radius-lg)', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                Select file
                <input ref={fileInputRef} type="file" accept={postType === 'reel' ? "video/*" : postType === 'story' ? "image/*,video/*" : "image/*,video/*"} onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', marginTop: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '60%' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.3 }}>OR PASTE LINK</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
                </div>
                <input
                  type="text"
                  placeholder="Paste media URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && imageUrl) setStep(2);
                  }}
                  style={{ width: '60%', padding: '14px 20px', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', textAlign: 'center', fontSize: '13px' }}
                  className="focus-ring"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: FILTER & CROP PREVIEW */}
        {step === 2 && imageUrl && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
              {postType === 'reel' ? (
                <video src={imageUrl} controls className={selectedFilter} style={{ width: '100%', height: '100%', objectFit: imageFit }} />
              ) : (
                <img src={imageUrl} alt="Preview" className={selectedFilter} style={{ width: '100%', height: '100%', objectFit: imageFit }} />
              )}

              {/* Fit Toggle */}
              <button
                onClick={() => setImageFit(prev => prev === 'cover' ? 'contain' : 'cover')}
                style={{ position: 'absolute', bottom: '16px', left: '16px', padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}
                className="hover-bright"
                title={imageFit === 'cover' ? "Fit to canvas" : "Fill canvas"}
              >
                {imageFit === 'cover' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>

              <div className="exotic-gradient" style={{ position: 'absolute', bottom: '16px', right: '16px', padding: '10px', borderRadius: '50%', color: 'white' }}><Sparkles size={20} /></div>
            </div>

            {postType === 'post' && (
              <div style={{ height: '140px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '16px', overflowX: 'auto', padding: '0 24px', backgroundColor: 'rgba(0,0,0,0.3)' }} className="filter-tray-scrollbar">
                {FILTERS.map(f => (
                  <div key={f.name} onClick={() => setSelectedFilter(f.class)} style={{ cursor: 'pointer', textAlign: 'center', flexShrink: 0, opacity: selectedFilter === f.class ? 1 : 0.6 }} className="hover-bright">
                    <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: selectedFilter === f.class ? '3px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s', marginBottom: '8px' }}>
                      <img src={imageUrl} className={f.class} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={f.name} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{f.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Visual Guide: Step 2 Next Button */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setStep(3)}
                className="exotic-gradient hover-scale"
                style={{ padding: '14px 40px', borderRadius: 'var(--radius-lg)', color: 'white', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', letterSpacing: '1px' }}
              >
                NEXT
              </button>
            </div>
          </div>
        )}

        {/* Step 3: FINALIZATION */}
        {step === 3 && (
          <div className="create-post-step3" style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* Left: Preview */}
            <div style={{ width: '60%', minWidth: 0, backgroundColor: '#000', borderRight: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
              {imageUrl ? (
                postType === 'reel' ? (
                  <video src={imageUrl} className={selectedFilter} style={{ width: '100%', height: '100%', objectFit: imageFit }} autoPlay loop muted />
                ) : (
                  <img src={imageUrl} alt="Final Preview" className={selectedFilter} style={{ width: '100%', height: '100%', objectFit: imageFit }} />
                )
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>Initialising post...</div>
              )}

              {/* Fit Toggle in Step 3 too */}
              <button
                onClick={() => setImageFit(prev => prev === 'cover' ? 'contain' : 'cover')}
                style={{ position: 'absolute', bottom: '16px', left: '16px', padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', zIndex: 10 }}
                className="hover-bright"
                title={imageFit === 'cover' ? "Fit media" : "Fill media"}
              >
                {imageFit === 'cover' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>

            {/* Right: Text / Info (Scrollable) */}
            <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.1)' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="scrollbar-hidden">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <Avatar src={currentUser?.avatar_url || currentUser?.user_metadata?.avatar_url} username={currentUser?.username || currentUser?.user_metadata?.username} size="32px" borderStyle={currentUser?.border_style} avatarShape={currentUser?.avatar_shape} />
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{currentUser?.username || currentUser?.user_metadata?.username}</span>
                </div>

                <textarea
                  autoFocus
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '15px', outline: 'none', resize: 'none', lineHeight: '1.4' }}
                />

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>

                </div>
              </div>

              <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(10,10,10,0.4)', marginTop: 'auto' }}>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="exotic-gradient hover-scale"
                  style={{
                    width: '100%', padding: '18px', borderRadius: 'var(--radius-md)',
                    color: 'white', fontWeight: '900', border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    fontSize: '15px', letterSpacing: '2px',
                    display: 'block'
                  }}
                >
                  {isSubmitting ? 'SYNCHRONIZING...' : `SHARE ${postType.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePostModal;
