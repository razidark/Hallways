import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';

const MessageList = ({ messages, currentUser, loading, hasMore, loadMore, activeUser }) => {
  const listRef = useRef(null);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle scrolling to the top to load older messages
  const handleScroll = () => {
    if (!listRef.current || loading || !hasMore || !loadMore) return;

    // In a chat, older messages are loaded when scrolling UP to the top (scrollTop === 0)
    if (listRef.current.scrollTop <= 10) {
      const currentScrollHeight = listRef.current.scrollHeight;
      const currentScrollTop = listRef.current.scrollTop;

      loadMore().then(() => {
        // Adjust scroll position after loading older messages so it doesn't jump
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight - currentScrollHeight + currentScrollTop;
        }
      });
    }
  };

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="chat-messages"
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        gap: '4px',
        maxHeight: '100%'
      }}
    >
      {hasMore && (
        <div style={{ textAlign: 'center', padding: '8px', fontSize: '0.75rem', opacity: 0.6 }}>
          {loading ? 'Loading older messages...' : 'Scroll up to load older messages'}
        </div>
      )}

      {messages.map((msg, index) => {
        const isMe = msg.sender_id === currentUser?.id;
        return (
          <MessageItem
            key={msg.id || msg.tempId || index}
            msg={msg}
            isMe={isMe}
            activeUser={activeUser}
          />
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
