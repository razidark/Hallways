import React, { useState, useEffect } from 'react';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile, X, Trash2, Reply, Repeat2, Music2, Film } from 'lucide-react';
import Avatar from './Avatar';
import { formatDistanceToNow, isUserAdmin, isUserVerified } from '../lib/utils';
import { useUI } from '../context/UIContext';
import VerifiedBadge from './VerifiedBadge';
import AdminBadge from './AdminBadge';
import { useAudio } from '../context/AudioContext';
import MediaViewer from './MediaViewer';
import EmojiPicker from 'emoji-picker-react';

const COMMENT_MAX = 300;

const MusicVisualizer = () => (
  <div className="music-pulse-container" style={{ display: 'flex', gap: '2px', alignItems: 'center', height: '10px' }}>
    <div className="music-bar" style={{ width: '2px', height: '100%', backgroundColor: 'var(--accent-color)', borderRadius: 'var(--radius-sm)', animation: 'barPulse 0.6s infinite ease-in-out alternate' }}></div>
    <div className="music-bar" style={{ width: '2px', height: '100%', backgroundColor: 'var(--accent-color)', borderRadius: 'var(--radius-sm)', animation: 'barPulse 0.8s infinite ease-in-out alternate-reverse' }}></div>
    <div className="music-bar" style={{ width: '2px', height: '100%', backgroundColor: 'var(--accent-color)', borderRadius: 'var(--radius-sm)', animation: 'barPulse 0.7s infinite ease-in-out alternate 0.2s' }}></div>
  </div>
);

const Post = ({ post, index = 0, isOverlay = false, onOpenOverlay }) => {
  const navigate = useNavigate();
  const { toggleLike, toggleSavePost, togglePinPost, addComment, deleteComment, updatePost, deletePost, repostPost } = usePosts();
  const { currentUser } = useAuth();
  const { showToast } = useUI();
  const { playSound } = useAudio();

  // Verification comes from the DB flag (public.profiles.is_verified).
  // Never from a username literal -- usernames are chosen at signup.
  const isAdmin = isUserAdmin(post.user);
  const isVerified = isUserVerified(post.user) && !isAdmin;

  const [commentText, setCommentText] = useState("");
  const [showFeedComment, setShowFeedComment] = useState(false);
  const [showFeedEmoji, setShowFeedEmoji] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCaption, setNewCaption] = useState(post.caption || "");
  const [showHeart, setShowHeart] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id: string, username: string }
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMusicSearchOpen, setIsMusicSearchOpen] = useState(false);
  const [editMusic, setEditMusic] = useState({ title: post.music, url: post.music_url });
  const [viewerMedia, setViewerMedia] = useState(null); // { src, isVideo }
  const audioRef = React.useRef(null);
  const observerRef = React.useRef(null);
  const postRef = React.useRef(null);

  // High-Fidelity Proximity Playback (Refined for Hallway)
  useEffect(() => {
    const previewUrl = post.music_url || post.music_metadata?.preview_url;
    if (!previewUrl || isOverlay) return;

    audioRef.current = new Audio(previewUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = 0;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Sync with chosen trim
          if (audioRef.current) {
            audioRef.current.currentTime = post.music_metadata?.start_time || 0;
            audioRef.current.play().catch(() => { });
            setIsPlaying(true);

            let vol = 0;
            const fade = setInterval(() => {
              if (audioRef.current && vol < 0.3) {
                vol += 0.05;
                audioRef.current.volume = vol;
              } else {
                clearInterval(fade);
              }
            }, 50);
          }
        } else {
          // Fade-out
          if (audioRef.current) {
            let vol = audioRef.current.volume;
            const fade = setInterval(() => {
              if (audioRef.current && vol > 0.05) {
                vol -= 0.05;
                audioRef.current.volume = vol;
              } else {
                if (audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
                clearInterval(fade);
              }
            }, 50);
          }
        }
      });
    }, { threshold: 0.6 });

    if (postRef.current) observerRef.current.observe(postRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [post.id, post.music_url, post.music_metadata, isOverlay]);


  const handleLike = () => {
    playSound('like');
    toggleLike(post.id);
    if (!post.isLiked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
  };

  const handleComment = () => {
    if (commentText.trim() && commentText.length <= COMMENT_MAX) {
      addComment(post.id, commentText, replyingTo?.id);
      setCommentText("");
      setReplyingTo(null);
      setShowFeedComment(false);
      setShowFeedEmoji(false);
      showToast("Comment added", "success");
    }
  };

  const handleSaveEdit = async () => {
    const res = await updatePost(post.id, {
      caption: newCaption,
      music: editMusic.title,
      music_url: editMusic.url
    });
    if (res.success) {
      setIsEditing(false);
      setShowOptions(false);
      showToast("Post updated.");
    }
  };

  const handleTrackSelect = (track) => {
    setEditMusic({
      title: `${track.artist} - ${track.title}`,
      url: track.preview_url
    });
    setIsMusicSearchOpen(false);
  };

  // Group comments for nested threading
  const parentComments = post.comments?.filter(c => !c.parent_id) || [];
  const getReplies = (parentId) => post.comments?.filter(c => c.parent_id === parentId) || [];

  return (
    <div ref={postRef} className={`post ${isOverlay ? 'is-overlay' : 'fade-in'}`} style={isOverlay ? {
      border: 'none',
      borderRadius: 0,
      boxShadow: 'none',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      width: '100%'
    } : {
      animationDelay: `${index * 0.1}s`,
      animationFillMode: 'both'
    }}>
      <div className="post-header" style={{ padding: '14px' }}>
        <div className="post-owner" onClick={() => navigate(`/profile/${post.user?.username || 'user'}`)}>
          <Avatar src={post.user?.avatar_url || post.user?.avatar} username={post.user?.username} borderStyle={post.user?.borderStyle} size="36px" />
          <div className="post-header-info">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="post-username">{post.user?.username || 'hallway_user'}</span>
              {isAdmin && <AdminBadge size={14} />}
              {isVerified && <VerifiedBadge size={14} />}
              <span className="post-time" style={{ marginLeft: '8px', opacity: 0.5, fontSize: '12px' }}>{formatDistanceToNow(post.created_at)}</span>
            </div>
            {post.music_metadata && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', opacity: isPlaying ? 1 : 0.4, transition: 'opacity 0.5s' }}>
                <div className={isPlaying ? "vibrating-music-tag" : ""} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Music2 size={10} color="var(--accent-color)" />
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-color)', letterSpacing: '0.5px' }}>{post.music_metadata.artist} — {post.music_metadata.title}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="post-options-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Content Type Badge */}
          {post.is_reel && (
            <div className="glass-overlay" style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', color: 'var(--accent-color)', border: '1px solid rgba(var(--accent-color-rgb), 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Film size={10} /> REEL
            </div>
          )}
          {post.repost && (
            <div className="glass-overlay" style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', color: '#ffbd2e', border: '1px solid rgba(255, 189, 46, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Repeat2 size={10} /> REPOST
            </div>
          )}
          {!post.is_reel && !post.repost && (
            <div className="glass-overlay" style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              POST
            </div>
          )}

          <button className="post-more" onClick={() => setShowOptions(!showOptions)}>
            <MoreHorizontal size={20} />
          </button>

          {showOptions && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 99, cursor: 'default' }}
                onClick={(e) => { e.stopPropagation(); setShowOptions(false); }}
              />
              <div className="post-options-menu glass-overlay slide-down" style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '8px',
                zIndex: 100,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '160px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
              }}>
                {post.user_id === currentUser?.id ? (
                  <>
                    <button className="post-options-btn" style={{ padding: '12px 16px', textAlign: 'left', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 'bold' }} onClick={() => { togglePinPost(post.id); setShowOptions(false); }}>
                      {post.is_pinned ? 'Unpin Post' : 'Pin to Profile'}
                    </button>
                    <button className="post-options-btn" style={{ padding: '12px 16px', textAlign: 'left', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 'bold' }} onClick={() => { setIsEditing(true); setShowOptions(false); }}>
                      Edit Post
                    </button>
                    <button className="post-options-btn danger" style={{ padding: '12px 16px', textAlign: 'left', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--danger-color)' }} onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this post?')) {
                        const res = await deletePost(post.id);
                        if (!res.success) alert("Failed to delete: " + res.message);
                      }
                    }}>
                      Delete Post
                    </button>
                  </>
                ) : (
                  <>
                    {isUserAdmin(currentUser) && (
                      <button className="post-options-btn danger" style={{ padding: '12px 16px', textAlign: 'left', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--danger-color)' }} onClick={async () => {
                        if (window.confirm('OVERSEER COMMAND: Delete this post permanently?')) {
                          const res = await deletePost(post.id);
                          if (!res.success) alert("Failed to delete: " + res.message);
                          else setShowOptions(false);
                        }
                      }}>
                        Delete Post (Admin)
                      </button>
                    )}
                    <button className="post-options-btn" style={{ padding: '12px 16px', textAlign: 'left', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--danger-color)' }} onClick={() => { alert('Post reported.'); setShowOptions(false); }}>
                      Report Post
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {!isOverlay && (
        <>
          {/* Repost Context HUD */}
          {post.repost && (
            <div className="repost-indicator" style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6, fontSize: '12px' }}>
              <Repeat2 size={14} />
              <span>Reposting {post.repost.user?.username || 'user'}'s post</span>
            </div>
          )}

          <div className="post-image-container" onDoubleClick={handleLike}>
            {!imageLoaded && <div className="spinner"></div>}

            {/* ENHANCED VIDEO/IMAGE DETECTOR */}
            {(!post.image || post.image === "") && (!post.repost?.image || post.repost?.image === "") ? (
              <div style={{ padding: '60px 40px', textAlign: 'center', opacity: 0.3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Film size={32} />
                <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>MEDIA_SYNC_UNAVAILABLE</div>
              </div>
            ) : (post.is_reel || (post.image && (post.image.match(/\.(mp4|webm|mov)$/) || post.image.includes('video'))) && !post.image.includes('.gif')) ? (
              <video
                src={post.image || ""}
                className={`post-image ${post.filter_class || ''}`}
                autoPlay
                loop
                muted
                playsInline
                onLoadedData={() => setImageLoaded(true)}
                onClick={() => setViewerMedia({ src: post.image, isVideo: true })}
                style={{ opacity: imageLoaded ? 1 : 0, width: '100%', borderRadius: '32px', cursor: 'pointer' }}
              />
            ) : post.image ? (
              <img
                src={post.image}
                alt="Post"
                loading="lazy"
                className={`post-image ${post.filter_class || ''}`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.target.src = 'https://placehold.co/600x600/111111/444444?text=MEDIA_OFFLINE';
                  setImageLoaded(true);
                }}
                onClick={() => setViewerMedia({ src: post.image, isVideo: false })}
                style={{ opacity: imageLoaded ? 1 : 0, cursor: 'pointer' }}
              />
            ) : (post.repost?.image && post.repost.image !== "") ? (
              <div className="reposted-content-container" style={{ padding: '0 14px', width: '100%' }}>
                <div className="glass-overlay" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                  {(post.repost.is_reel || (post.repost.image?.match(/\.(mp4|webm|mov)$/) || post.repost.image?.includes('video'))) ? (
                    <video
                      src={post.repost.image || ""}
                      className={`post-image ${post.repost.filter_class || ''}`}
                      autoPlay
                      loop
                      muted
                      playsInline
                      onLoadedData={() => setImageLoaded(true)}
                      style={{ opacity: imageLoaded ? 1 : 0, width: '100%' }}
                    />
                  ) : (
                    <img
                      src={post.repost.image}
                      alt="Repost"
                      loading="lazy"
                      className={`post-image ${post.repost.filter_class || ''}`}
                      onLoad={() => setImageLoaded(true)}
                      style={{ opacity: imageLoaded ? 1 : 0 }}
                    />
                  )}
                  <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                    <Avatar src={post.repost.user?.avatar} username={post.repost.user?.username} borderStyle={post.repost.user?.borderStyle} size="20px" />
                    <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>{post.repost.user?.username}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {showHeart && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 30,
                pointerEvents: 'none'
              }}>
                <Heart
                  size={120}
                  fill="white"
                  color="white"
                  className="heart-pop-active"
                  style={{ filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.6))' }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* OVERLAY MODE: SCROLLABLE COMMENTS AREA */}
      <div className="post-scroll-area scrollbar-hidden" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 14px',
        display: isOverlay ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="post-caption" style={{ padding: '10px 0' }}>
          <span className="post-username" onClick={() => navigate(`/profile/${post.user?.username}`)}>{post.user?.username}</span>
          <div className="post-caption-text">{post.caption}</div>
        </div>

        <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
          {parentComments.map(c => (
            <div key={c.id} className="comment-thread-group">
              <div className="comment" style={{ display: 'flex', gap: '12px' }}>
                <Avatar
                  src={c.user?.avatar}
                  username={c.user?.username}
                  borderStyle={c.user?.borderStyle || 'normal'}
                  avatarShape={c.user?.avatarShape || 'hexagon'}
                  size="32px"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{c.user?.username}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatDistanceToNow(c.created_at)}</span>
                  </div>
                  <div style={{ fontSize: '14px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>{c.content}</div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button onClick={() => setReplyingTo({ id: c.id, username: c.user?.username })} style={{ color: 'var(--text-secondary)', opacity: 0.6 }} className="hover-bright"><Reply size={14} /></button>
                      {c.user_id === currentUser?.id && (
                        <button onClick={() => deleteComment(c.id)} style={{ color: 'var(--danger-color)', opacity: 0.4 }} className="hover-bright"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {getReplies(c.id).map(reply => (
                <div key={reply.id} className="comment reply" style={{ display: 'flex', gap: '12px', marginLeft: '44px', marginTop: '16px' }}>
                  <Avatar
                    src={reply.user?.avatar}
                    username={reply.user?.username}
                    borderStyle={reply.user?.borderStyle || 'normal'}
                    avatarShape={reply.user?.avatarShape || 'hexagon'}
                    size="24px"
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{reply.user?.username}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{formatDistanceToNow(reply.created_at)}</span>
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>{reply.content}</div>
                      {currentUser.id === reply.user_id && (
                        <button onClick={() => deleteComment(reply.id)} style={{ color: 'var(--danger-color)', opacity: 0.5, border: 'none', background: 'transparent', cursor: 'pointer' }} className="hover-scale"><Trash2 size={12} /></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Bottom Action Strip with Music Tag */}
          <div style={{ padding: '0 14px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                className="post-audio hover-bright"
                onClick={() => post.music_url && window.open(post.music_url, '_blank')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: post.music_url ? 'pointer' : 'default' }}
              >
                <Music2 size={12} style={{ opacity: 0.6 }} />
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{post.music || 'Original Audio'}</span>
                {post.music_url && <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />}
              </div>
              <span style={{ fontSize: '10px', opacity: 0.4, fontWeight: 'bold' }}>{formatDistanceToNow(post.created_at)}</span>
            </div>
          </div>

          {parentComments.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>No comments in this thread yet.</div>
          )}
        </div>
      </div>

      <div className="post-footer-dock" style={isOverlay ? { borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', marginTop: 'auto' } : {}}>
        <div className="post-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 14px' }}>
          <div className="post-actions-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={handleLike} className={`action-btn ${post.isLiked ? 'liked' : ''}`}>
              <Heart size={26} fill={post.isLiked ? "currentColor" : "none"} />
            </button>
            <button className="action-btn" onClick={() => isOverlay ? null : (onOpenOverlay ? onOpenOverlay() : null)}>
              <MessageCircle size={26} />
            </button>
            <button className="action-btn" onClick={async () => {
              const res = await repostPost(post.repost?.id || post.id);
              if (res?.success) {
                showToast("Post reposted!", "success");
              } else if (res?.message) {
                showToast(res.message, "error");
              }
            }}><Repeat2 size={26} /></button>
            <button className="action-btn" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/profile/${post.user?.username}?post=${post.id}`);
              showToast("Post link copied!", "success");
            }}><Send size={26} /></button>
          </div>
          <button className="action-btn" onClick={() => toggleSavePost(post.id)} style={{ color: post.isSaved ? 'var(--accent-color)' : 'inherit' }}>
            <Bookmark size={26} fill={post.isSaved ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="post-likes" style={{ padding: '0 14px 10px' }}>{post.likes || 0} likes</div>

        {!isOverlay && !isEditing && (
          <div className="post-caption" style={{ padding: '0 14px 10px' }}>
            <span className="post-username" onClick={() => navigate(`/profile/${post.user?.username}`)}>{post.user?.username}</span>
            <div className="post-caption-text">{post.caption}</div>

            {/* IN-FEED MUSIC TAG */}
            {post.music && (
              <div
                className={`post-audio-feed ${isPlaying ? 'active' : ''} hover-bright`}
                onClick={() => {
                  if (audioRef.current) {
                    if (isPlaying) {
                      audioRef.current.pause();
                      setIsPlaying(false);
                    } else {
                      audioRef.current.play().catch(() => { });
                      setIsPlaying(true);
                      audioRef.current.volume = 0.3;
                    }
                  } else if (post.music_url) {
                    // One-off play if proximity failed to init
                    audioRef.current = new Audio(post.music_url);
                    audioRef.current.play();
                    setIsPlaying(true);
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', cursor: 'pointer', width: 'fit-content', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Music2 size={12} className={isPlaying ? 'spin-slow' : ''} style={{ color: isPlaying ? 'var(--accent-color)' : 'var(--text-secondary)' }} />
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: isPlaying ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{post.music}</span>
                {isPlaying && <MusicVisualizer />}
                {!isPlaying && post.music_url && <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', opacity: 0.5 }} />}
              </div>
            )}

            {/* IN-FEED COMMENT PREVIEW */}
            {post.comments && post.comments.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {post.comments.length > 2 && (
                  <span
                    onClick={onOpenOverlay}
                    style={{ color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', marginBottom: '4px' }}
                    className="hover-bright"
                  >
                    View all {post.comments.length} comments
                  </span>
                )}
                {post.comments.slice(-2).map(comment => (
                  <div key={comment.id} style={{ fontSize: '13px', display: 'flex', gap: '6px' }}>
                    <strong
                      style={{ cursor: 'pointer', color: 'var(--text-primary)' }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/profile/${comment.user?.username}`); }}
                      className="hover-underline"
                    >
                      {comment.user?.username}
                    </strong>
                    <span style={{ color: 'var(--text-primary)' }}>{comment.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IN-FEED COMMENT BAR */}
        {!isOverlay && !isEditing && (
          <div style={{ padding: '0 14px 14px' }}>
            {!showFeedComment ? (
              <div
                onClick={() => setShowFeedComment(true)}
                style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px 0' }}
                className="hover-bright"
              >
                Add a comment...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {replyingTo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: 'rgba(var(--accent-color-rgb), 0.08)', borderRadius: '8px', fontSize: '11px' }}>
                    <span>Replying to <strong style={{ color: 'var(--accent-color)' }}>@{replyingTo.username}</strong></span>
                    <button onClick={() => setReplyingTo(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={12} /></button>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowFeedEmoji(!showFeedEmoji)} style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}><Smile size={20} /></button>
                    {showFeedEmoji && (
                      <div className="emoji-picker-pane glass-overlay slide-down" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '8px', zIndex: 1000, width: '320px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                        {/* Click-away layer sits BEHIND the picker so clicking an
                            emoji does not immediately close it. */}
                        <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShowFeedEmoji(false)} />
                        <div style={{ position: 'relative', zIndex: 1000 }}>
                          <EmojiPicker
                            onEmojiClick={(emojiData) => setCommentText(prev => prev + emojiData.emoji)}
                            theme="dark"
                            lazyLoadEmojis={true}
                            searchPlaceHolder="Search emoji"
                            width="100%"
                            height={320}
                            previewConfig={{ showPreview: false }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Write a comment..."}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value.slice(0, COMMENT_MAX))}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                    autoFocus
                    style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '20px', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', transition: 'border-color 0.2s' }}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    style={{ color: commentText.trim() ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: '900', border: 'none', background: 'transparent', cursor: commentText.trim() ? 'pointer' : 'default', opacity: commentText.trim() ? 1 : 0.4, fontSize: '13px', letterSpacing: '0.5px', transition: 'all 0.2s' }}
                  >
                    Post
                  </button>
                </div>
                {commentText.length > COMMENT_MAX * 0.8 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px', color: commentText.length >= COMMENT_MAX ? 'var(--danger-color)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
                      {commentText.length}/{COMMENT_MAX}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div className="post-edit-container" style={{ padding: '0 14px 14px', position: 'relative' }}>
            <textarea
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className="post-edit-input"
              style={{ width: '100%', minHeight: '80px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', resize: 'none', marginBottom: '12px' }}
            />

            <div
              onClick={() => setIsMusicSearchOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', marginBottom: '16px', border: '1px dashed rgba(255,255,255,0.2)' }}
              className="hover-bright"
            >
              <Music2 size={16} />
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{editMusic.title || 'Add music'}</span>
            </div>

            {isMusicSearchOpen && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
                <MusicSearch onSelect={handleTrackSelect} onClose={() => setIsMusicSearchOpen(false)} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSaveEdit} className="exotic-gradient" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Save Changes</button>
              <button onClick={() => setIsEditing(false)} style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancel</button>
            </div>
          </div>
        )}

        {isOverlay && (
          <div className="overlay-comment-input" style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {replyingTo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px' }}>
                <span>Replying to <strong style={{ color: 'var(--accent-color)' }}>@{replyingTo.username}</strong></span>
                <button onClick={() => setReplyingTo(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}><Smile size={24} /></button>
                {showEmojiPicker && (
                  <div className="emoji-picker-pane glass-overlay" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '8px', zIndex: 1000, width: '320px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                    {/* Click-away layer sits BEHIND the picker so clicking an
                        emoji does not immediately close it. */}
                    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShowEmojiPicker(false)} />
                    <div style={{ position: 'relative', zIndex: 1000 }}>
                      <EmojiPicker
                        onEmojiClick={(emojiData) => setCommentText(prev => prev + emojiData.emoji)}
                        theme="dark"
                        lazyLoadEmojis={true}
                        searchPlaceHolder="Search emoji"
                        width="100%"
                        height={320}
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                style={{ color: 'var(--accent-color)', fontWeight: 'bold', border: 'none', background: 'transparent', cursor: commentText.trim() ? 'pointer' : 'default', opacity: commentText.trim() ? 1 : 0.5 }}
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fade-in" style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeleteConfirm(false)}>
          <div className="glass-overlay slide-down" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Trash2 size={24} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.3px' }}>Delete this post?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '28px' }}>This action cannot be undone. All likes, comments, and saves will be permanently removed.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: '800', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.5px' }} className="hover-bright">Cancel</button>
              <button onClick={async () => {
                const res = await deletePost(post.id);
                setShowDeleteConfirm(false);
                if (res.success) showToast('Post deleted', 'success');
                else showToast('Failed to delete: ' + res.message, 'error');
              }} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: '#ef4444', border: 'none', color: 'white', fontWeight: '900', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.5px', boxShadow: '0 8px 20px rgba(239,68,68,0.3)' }} className="hover-scale">Delete</button>
            </div>
          </div>
        </div>
      )}
      {viewerMedia && (
        <MediaViewer
          src={viewerMedia.src}
          isVideo={viewerMedia.isVideo}
          onClose={() => setViewerMedia(null)}
        />
      )}
    </div>
  );
};

export default Post;