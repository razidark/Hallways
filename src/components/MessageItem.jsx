import React, { useState } from 'react';
import { Edit, Trash, X, Check, Lock } from 'lucide-react';
import { useMessages } from '../context/MessageContext';
import Avatar from './Avatar';
import { formatDistanceToNow } from '../lib/utils';

const MessageItem = React.memo(({ msg, isMe, activeUser }) => {
  const { deleteMessage, editMessage } = useMessages();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content || '');
  const [showActions, setShowActions] = useState(false);

  const handleUpdate = async () => {
    if (editContent.trim() && editContent.trim() !== msg.content) {
      await editMessage(msg.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this message?")) {
      await deleteMessage(msg.id);
    }
  };

  const handleDecrypt = () => {
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
  };

  return (
    <div
      className={`chat-msg-wrapper ${isMe ? 'mine' : 'other'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        width: '100%',
        margin: '4px 0',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: isMe ? 'row-reverse' : 'row', maxWidth: '85%' }}>
        {!isMe && activeUser && (
          <Avatar src={activeUser.avatar} username={activeUser.username} size="28px" borderStyle={activeUser.borderStyle} avatarShape="circle" />
        )}
        <div
          className={`chat-msg ${isMe ? 'mine' : 'other'}`}
          style={{
            padding: msg.media_url ? '6px' : '10px 14px',
            borderRadius: '12px',
            borderBottomRightRadius: isMe ? '2px' : '12px',
            borderBottomLeftRadius: !isMe ? '2px' : '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {msg.media_url ? (
            msg.media_type === 'video' ? (
              <video src={msg.media_url} controls style={{ maxWidth: '240px', borderRadius: '8px', display: 'block' }} />
            ) : (
              <img src={msg.media_url} alt="Attachment" style={{ maxWidth: '240px', borderRadius: '8px', display: 'block' }} />
            )
          ) : isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
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
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'inherit',
                  padding: '6px',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  resize: 'none',
                  outline: 'none',
                  width: '100%',
                  fontFamily: 'inherit'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', fontSize: '0.75rem', opacity: 0.7, cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
                <button onClick={handleUpdate} style={{ background: 'none', border: 'none', fontSize: '0.75rem', cursor: 'pointer', color: 'inherit' }}><Check size={14} /></button>
              </div>
            </div>
          ) : msg.content?.startsWith('[VOICE]:') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: 'bold' }}>🎙️ VOICE MESSAGE</span>
              <audio src={msg.content.slice(8)} controls style={{ maxHeight: '32px', maxWidth: '200px' }} />
            </div>
          ) : msg.content?.startsWith('[ENCRYPTED]:') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> Encrypted</span>
              <button
                onClick={handleDecrypt}
                style={{
                  fontSize: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: 'inherit',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Decrypt
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
              {msg.content}
              {msg.is_edited && <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '4px', fontStyle: 'italic' }}>(edited)</span>}
            </span>
          )}
        </div>
        {isMe && showActions && !isEditing && (
          <div style={{ display: 'flex', gap: '2px', alignSelf: 'center', opacity: 0.8 }} className="fade-in">
            <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }} title="Edit"><Edit size={12} /></button>
            <button onClick={handleDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }} title="Delete"><Trash size={12} /></button>
          </div>
        )}
      </div>
      <span style={{ fontSize: '0.7rem', opacity: 0.5, margin: '2px 4px', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
        {msg.created_at ? formatDistanceToNow(new Date(msg.created_at)) : 'Just now'}
      </span>
    </div>
  );
});

export default MessageItem;
