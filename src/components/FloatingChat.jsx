import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, ChevronLeft, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useMessages } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import MessageList from './MessageList';
import '../styles/components/messagePanel.css';

const FloatingChat = () => {
  const { conversations, messages, activeChatId, setActiveChatId, sendMessage, fetchMessages, messagesLoading, hasMore, loadMoreMessages, isOtherTyping, sendTypingStatus } = useMessages();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [typingState, setTypingState] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    }
  }, [activeChatId, fetchMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeChatId) return;
    setTypingState(false);
    sendTypingStatus(false);
    await sendMessage(activeChatId, inputText.trim());
    setInputText('');
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!typingState) {
      setTypingState(true);
      sendTypingStatus(true);
    }
  };

  useEffect(() => {
    if (!typingState) return;
    const timeout = setTimeout(() => {
      setTypingState(false);
      sendTypingStatus(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [inputText, typingState, sendTypingStatus]);

  const activeConv = conversations.find(c => c.id === activeChatId);

  return (
    <div className="floating-chat">
      {!isOpen ? (
        <button className="chat-fab" onClick={() => setIsOpen(true)}>
          <MessageCircle size={24} />
          {conversations.length > 0 && (
            <span className="chat-fab-badge">{conversations.length}</span>
          )}
        </button>
      ) : (
        <div className="chat-panel">
          <div className="chat-header">
            {activeChatId ? (
              <>
                <button onClick={() => setActiveChatId(null)}><ChevronLeft size={20} /></button>
                <span>{activeConv?.username || 'Chat'}</span>
              </>
            ) : (
              <span>Messages</span>
            )}
            <button onClick={() => { setIsOpen(false); setActiveChatId(null); }}><X size={20} /></button>
          </div>
          <div className="chat-body">
            {!activeChatId ? (
              conversations.length === 0 ? (
                <div className="chat-empty">Your inbox is silent</div>
              ) : (
                conversations.map(conv => (
                  <div key={conv.id} className="chat-conv-item" onClick={() => setActiveChatId(conv.id)}>
                    <Avatar src={conv.avatar} username={conv.username} size="36px" borderStyle={conv.borderStyle} avatarShape="circle" />
                    <div className="chat-conv-info">
                      <span className="chat-conv-name">{conv.username}</span>
                      <span className="chat-conv-last">{conv.lastMessage}</span>
                    </div>
                  </div>
                ))
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <MessageList
                  messages={messages}
                  currentUser={currentUser}
                  loading={messagesLoading}
                  hasMore={hasMore}
                  loadMore={loadMoreMessages}
                  activeUser={activeConv}
                />
                {isOtherTyping && (
                  <div className="typing-indicator" style={{ padding: '4px 12px', fontSize: '0.8rem', opacity: 0.7, fontStyle: 'italic' }}>
                    {activeConv?.username || 'Someone'} is typing...
                  </div>
                )}
              </div>
            )}
          </div>
          {activeChatId && (
            <div className="chat-input" style={{ position: 'relative' }}>
              <input
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
              />
              <button
                onClick={() => setShowEmojiPicker(v => !v)}
                title="Emoji"
                style={{ color: showEmojiPicker ? 'var(--accent-color)' : 'var(--text-secondary)' }}
              >
                <Smile size={18} />
              </button>
              <button onClick={handleSend} disabled={!inputText.trim()}><Send size={18} /></button>
              {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 1000 }}>
                  {/* Click-away layer sits BEHIND the picker so clicking an
                      emoji does not immediately close it. */}
                  <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShowEmojiPicker(false)} />
                  <div style={{ position: 'relative', zIndex: 1000 }}>
                    <EmojiPicker
                      onEmojiClick={(emojiData) => setInputText(prev => prev + emojiData.emoji)}
                      theme="dark"
                      lazyLoadEmojis={true}
                      searchPlaceHolder="Search emoji"
                      width="100%"
                      height={300}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingChat;