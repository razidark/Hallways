import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Edit, Send, Info, Phone, Video, MoreVertical, MessageCircle, Heart, Search, Smile, Image as ImageIcon, X, RotateCw, Lock, Unlock, Mic, Square } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useMessages } from '../context/MessageContext';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { formatDistanceToNow } from '../lib/utils';
import { useUI } from '../context/UIContext';
import { useAudio } from '../context/AudioContext';
import EmojiPicker from 'emoji-picker-react';

const MessageItem = React.memo(({ msg, isMe, idx, messagesCount, activeUser }) => {
  const { deleteMessage, editMessage } = useMessages();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content);
  const [showMenu, setShowMenu] = useState(false);

  const handleUpdate = async () => {
    if (editContent.trim() !== msg.content) {
      await editMessage(msg.id, editContent);
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this message?")) {
      await deleteMessage(msg.id);
    }
  };

  return (
    <div
      className={`message-wrapper ${isMe ? 'sent' : 'received'}`}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
      style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
        {!isMe && activeUser && (
          <Avatar src={activeUser.avatar} username={activeUser.username} size="28px" borderStyle={activeUser.borderStyle} avatarShape="circle" />
        )}
        <div
          className={`chat-bubble ${isMe ? 'sent' : 'received'}`}
          style={{
            padding: (msg.content?.startsWith('[MEDIA]') || msg.media_url) ? '8px' : '12px 18px',
            borderRadius: 'var(--radius-md)',
            borderBottomRightRadius: isMe ? '2px' : 'var(--radius-md)',
            borderBottomLeftRadius: !isMe ? '2px' : 'var(--radius-md)',
            backgroundColor: isMe ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
            background: isMe ? ((msg.content?.startsWith('[MEDIA]') || msg.media_url) ? 'rgba(0,0,0,0.1)' : 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary, #818cf8))') : 'var(--bg-tertiary)',
            color: isMe ? 'var(--button-text, white)' : 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: '1.5',
            boxShadow: isMe && !(msg.content?.startsWith('[MEDIA]') || msg.media_url) ? '0 8px 32px rgba(var(--accent-color-rgb), 0.15)' : '0 4px 16px rgba(0,0,0,0.05)',
            border: isMe ? 'none' : '1px solid var(--border-color)',
            position: 'relative',
            overflow: 'hidden',
            clipPath: 'none',
            WebkitClipPath: 'none',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {isMe && !(msg.media_url || msg.content?.startsWith('[MEDIA]')) && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent)', opacity: 0.3 }} />}

          {msg.media_url ? (
            msg.media_type === 'video' ? (
              <video src={msg.media_url} controls style={{ maxWidth: '280px', borderRadius: 'var(--radius-sm)', display: 'block' }} />
            ) : (
              <img src={msg.media_url} alt="Media" style={{ maxWidth: '280px', borderRadius: 'var(--radius-sm)', display: 'block' }} />
            )
          ) : isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleUpdate();
                  }
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)', padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: '14px', minWidth: '200px', resize: 'none', outline: 'none' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setIsEditing(false)} style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.7 }}>Cancel</button>
                <button onClick={handleUpdate} style={{ fontSize: '11px', fontWeight: 'bold', background: 'white', color: 'var(--accent-color)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>Save</button>
              </div>
            </div>
          ) : msg.content?.startsWith('[VOICE]:') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', opacity: 0.6, fontWeight: 'bold' }}>🎙️ VOICE MESSAGE</span>
              <audio src={msg.content.slice(8)} controls style={{ maxHeight: '36px', maxWidth: '240px' }} />
            </div>
          ) : msg.content?.startsWith('[ENCRYPTED]:') ? (
            <div style={{ fontStyle: 'italic', opacity: 0.9, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Lock size={12} /> Encrypted Message
              </div>
              <button 
                onClick={() => {
                  const key = window.prompt("Enter decryption key:");
                  if (key) {
                    try {
                      const cipher = msg.content.slice(12);
                      let decrypted = "";
                      for (let i = 0; i < cipher.length; i++) {
                        decrypted += String.fromCharCode(cipher.charCodeAt(i) ^ key.charCodeAt(i % key.length));
                      }
                      alert("Decrypted Message: " + decrypted);
                     } catch {
                       alert("Decryption failed. Please verify key.");
                     }
                  }
                }}
                style={{ fontSize: '11px', fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', color: 'inherit', marginTop: '4px', alignSelf: 'flex-start' }}
              >
                Decrypt
              </button>
            </div>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {msg.content}
              {msg.is_edited && <span style={{ fontSize: '9px', opacity: 0.5, marginLeft: '6px', fontStyle: 'italic' }}>(edited)</span>}
            </div>
          )}
        </div>

        {isMe && showMenu && !isEditing && (
          <div className="fade-in" style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            <button onClick={() => setIsEditing(true)} style={{ opacity: 0.5, padding: '4px' }} className="hover-scale"><Edit size={14} /></button>
            <button onClick={handleDelete} style={{ opacity: 0.5, padding: '4px' }} className="hover-scale"><X size={14} /></button>
          </div>
        )}
      </div>

      {/* Only show time for the last message in a sequence or every few messages */}
      {(idx === messagesCount - 1) && (
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', opacity: 0.6, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
          {isMe ? 'Seen' : 'Delivered'} • {msg.created_at ? formatDistanceToNow(new Date(msg.created_at)) : 'Just now'}
        </div>
      )}
    </div>
  );
});

const Messages = () => {
  const { currentUser } = useAuth();
  const { conversations, messages, activeChatId, setActiveChatId, sendMessage, fetchMessages, fetchConversations, loading } = useMessages();
  const { playSound } = useAudio();
  const [inputText, setInputText] = useState("");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [followers, setFollowers] = useState([]);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { setActiveOverlay } = useUI();

  const [isEncryptedMode, setIsEncryptedMode] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const toggleEncryption = () => {
    if (!isEncryptedMode) {
      const key = window.prompt("Set encryption key for this message:");
      if (key) {
        setEncryptionKey(key);
        setIsEncryptedMode(true);
      }
    } else {
      setIsEncryptedMode(false);
      setEncryptionKey("");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = reader.result;
          await sendMessage(activeChatId, `[VOICE]:${base64Data}`);
        };
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to record voice messages.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    }
  }, [activeChatId, fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, activeChatId]); // Only scroll when message count changes or switching chats

  useEffect(() => {
    if (showFollowers && followers.length === 0 && currentUser) {
      const loadFollowers = async () => {
        const { data } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUser.id);

        if (data && data.length > 0) {
          const ids = data.map(f => f.following_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', ids);
          if (profiles) setFollowers(profiles);
        }
      };
      loadFollowers();
    }
  }, [showFollowers, currentUser, followers.length]);

  const handleSend = async () => {
    if (inputText.trim() && activeChatId) {
      let textToSend = inputText;
      if (isEncryptedMode && encryptionKey) {
        let cipher = "";
        for (let i = 0; i < textToSend.length; i++) {
          cipher += String.fromCharCode(textToSend.charCodeAt(i) ^ encryptionKey.charCodeAt(i % encryptionKey.length));
        }
        textToSend = `[ENCRYPTED]:${cipher}`;
      }
      const res = await sendMessage(activeChatId, textToSend);
      if (res.success) {
        setInputText("");
        setIsEncryptedMode(false);
        setEncryptionKey("");
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChatId) return;
    const res = await sendMessage(activeChatId, "", file);
    if (res.success && fileInputRef.current) fileInputRef.current.value = '';
  };

  const [activeUserProfile, setActiveUserProfile] = useState(null);

  useEffect(() => {
    if (activeChatId) {
      const conv = conversations.find(c => c.id === activeChatId);
      if (conv) {
        setActiveUserProfile({
          id: conv.id,
          username: conv.username,
          avatar: conv.avatar,
          borderStyle: conv.borderStyle || 'normal'
        });
      } else {
        // Fetch profile if not in conversations
        const fetchProfile = async () => {
          const { data } = await supabase.from('profiles').select('id, username, avatar_url, border_style').eq('id', activeChatId).single();
          if (data) {
            setActiveUserProfile({
              id: data.id,
              username: data.username,
              avatar: data.avatar_url,
              borderStyle: data.border_style || 'normal'
            });
          }
        };
        fetchProfile();
      }
    } else {
      setActiveUserProfile(null);
    }
  }, [activeChatId, conversations]);

  const activeUser = activeUserProfile;

  return (
    <div className="messages-layout fade-in" style={{
      maxWidth: '1200px',
      margin: '20px auto',
      height: 'calc(100vh - 120px)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(30px)',
      display: 'flex'
    }}>
      {/* Left Pane: Chat List */}
      <div className={`messages-sidebar ${activeChatId ? 'has-active-chat' : ''}`} style={{
        width: '380px',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: 'clamp(24px, 4vw, 40px) 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: '-1px' }}>Messages</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { fetchConversations(); playSound('pop'); }}
              className="action-pill"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Sync Whispers"
            >
              <RotateCw size={18} className={loading ? 'spin' : ''} style={{ transition: 'none' }} />
            </button>
            <button onClick={() => setShowFollowers(!showFollowers)} className={`action-pill ${showFollowers ? 'active' : ''}`} style={{ background: showFollowers ? 'var(--accent-color)' : 'var(--bg-tertiary)', color: showFollowers ? 'white' : 'var(--text-primary)', width: '40px', height: '40px' }}>
              {showFollowers ? <X size={20} /> : <Edit size={20} />}
            </button>
          </div>
        </div>

        <div className="messages-chat-list scrollbar-hidden" style={{ overflowY: 'auto', flex: 1 }}>
          {showFollowers ? (
            <div className="fade-in">
              <div style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Start a Conversation</div>
              {followers.map(user => (
                <div
                  key={user.id}
                  onClick={() => {
                    setActiveChatId(user.id);
                    setShowFollowers(false);
                  }}
                  className="hover-bright"
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', cursor: 'pointer' }}
                >
                  <Avatar src={user.avatar_url} username={user.username} size="48px" />
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px' }}>{user.username}</h4>
                </div>
              ))}
              {followers.length === 0 && <div style={{ padding: '24px', textAlign: 'center', opacity: 0.5 }}>You aren't following anyone yet.</div>}
            </div>
          ) : loading ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', opacity: 1 - (i * 0.15) }}>
                <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '40%', height: '14px', borderRadius: '4px', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ width: '80%', height: '12px', borderRadius: '4px' }} />
                </div>
              </div>
            ))
          ) : conversations.length > 0 ? conversations.map(conv => (
            <div
              key={conv.id}
              className={`messages-chat-item ${activeChatId === conv.id ? 'active' : ''}`}
              onClick={() => setActiveChatId(conv.id)}
            >
              <Avatar src={conv.avatar} username={conv.username} borderStyle={conv.borderStyle} size="56px" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{conv.username}</h4>
                  <span style={{ fontSize: '10px', opacity: 0.5 }}>{formatDistanceToNow(conv.timestamp)}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  {conv.lastMessage}
                </p>
              </div>
            </div>
          )) : (
            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>
              <MessageCircle size={48} style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', fontWeight: 'bold' }}>Your messages are quiet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Active Chat */}
      <div className="messages-main" style={{ display: 'flex', flex: 1, flexDirection: 'column', backgroundColor: 'transparent' }}>
        {activeUser ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Avatar src={activeUser.avatar} username={activeUser.username} borderStyle={activeUser.borderStyle} size="40px" />
                <div>
                  <h3 style={{ fontWeight: 'bold', fontSize: '16px' }}>{activeUser.username}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00ff87', boxShadow: '0 0 10px #00ff87' }} />
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>ACTIVE NOW</p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)' }}>
                <Phone size={22} className="hover-scale pointer" />
                <Video size={22} className="hover-scale pointer" />
                <Info size={22} className="hover-scale pointer" />
              </div>
            </div>

            {/* Messages Stream */}
            <div className="scrollbar-hidden" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                  <Avatar src={activeUser.avatar} username={activeUser.username} borderStyle={activeUser.borderStyle} size="xl" style={{ margin: '0 auto 16px' }} />
                  <h2 style={{ fontSize: '24px', fontWeight: '900' }}>{activeUser.username}</h2>
                  <p style={{ fontSize: '14px' }}>Direct communication with {activeUser.username}</p>
                  <button onClick={() => navigate(`/profile/${activeUser.username}`)} className="hover-underline" style={{ marginTop: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)', background: 'transparent', border: 'none', cursor: 'pointer' }}>View Profile</button>
                </div>

                {messages.map((msg, idx) => (
                  <MessageItem
                    key={msg.id}
                    msg={msg}
                    isMe={msg.sender_id === currentUser.id}
                    idx={idx}
                    messagesCount={messages.length}
                    activeUser={activeUser}
                    currentUser={currentUser}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input Box */}
            <div style={{ padding: 'clamp(12px, 2vw, 24px)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255,255,255,0.03)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" style={{ display: 'none' }} />
                
                {isRecording ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4b4b', fontWeight: 'bold', fontSize: '13px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4b4b' }} className="pulse" />
                      RECORDING AUDIO MESSAGE...
                    </div>
                    <button onClick={stopRecording} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,75,75,0.1)', color: '#ff4b4b', border: '1px solid rgba(255,75,75,0.3)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 'bold' }}>
                      <Square size={12} fill="#ff4b4b" /> STOP & SEND
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => fileInputRef.current?.click()} style={{ color: 'var(--text-secondary)' }} className="hover-scale" title="Attach Media"><ImageIcon size={20} /></button>
                    <button onClick={startRecording} style={{ color: 'var(--text-secondary)' }} className="hover-scale" title="Record Voice"><Mic size={20} /></button>
                    <button onClick={toggleEncryption} style={{ color: isEncryptedMode ? 'var(--accent-color)' : 'var(--text-secondary)' }} className="hover-scale" title={isEncryptedMode ? "Encryption Enabled" : "Encrypt Message"}>
                      {isEncryptedMode ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                    <input
                      type="text"
                      placeholder={isEncryptedMode ? "Type encrypted message..." : "Type a message..."}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '14px', padding: '12px 0' }}
                    />
                    {inputText.trim() && (
                      <button onClick={handleSend} className="fade-in" style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '14px', background: 'transparent', border: 'none' }}>
                        Send
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-primary)', position: 'relative' }}>
                      <Smile
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        size={22}
                        className={`hover-scale pointer ${showEmojiPicker ? 'active-accent' : ''}`}
                        title="Emoji"
                      />
                      {showEmojiPicker && (
                        <div style={{ position: 'absolute', bottom: '50px', right: '0', zIndex: 1000 }}>
                          {/* Click-away layer. Sits BEHIND the picker (lower z-index)
                              so clicking an emoji does not hit this and close it. */}
                          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShowEmojiPicker(false)} />
                          <div className="fade-in" style={{ position: 'relative', zIndex: 1000 }}>
                            <EmojiPicker
                              onEmojiClick={(emojiData) => {
                                // Keep the picker open so several emoji can be added
                                // in a row; it closes on outside click.
                                setInputText(prev => prev + emojiData.emoji);
                              }}
                              theme="dark"
                              lazyLoadEmojis={true}
                              searchPlaceHolder="Search emoji"
                              skinTonesDisabled={false}
                              width="100%"
                              height={340}
                              previewConfig={{ showPreview: false }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '24px', opacity: 0.5 }}>
            <div className="rainbow-logo-container" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-lg)' }}>
              <MessageCircle size={40} color="white" fill="white" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)' }}>Your Messages</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>Send private photos and messages to a friend or group.</p>
            </div>
            <button onClick={() => setActiveOverlay('search')} className="exotic-gradient hover-scale cursor-pointer" style={{ padding: '12px 24px', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Send Message</button>
          </div>
        )}
      </div>
    </div>
  );
};
export default Messages;
