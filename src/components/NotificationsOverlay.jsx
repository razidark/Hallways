import React, { useEffect } from 'react';
import { Heart, UserPlus, MessageCircle, Zap, X, Bell, TrendingUp, Radio } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useNotifications } from '../context/NotificationContext';
import { usePosts } from '../context/PostContext';
import { useMessages } from '../context/MessageContext';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import { formatDistanceToNow } from '../lib/utils';

const NotificationsOverlay = ({ onClose }) => {
  const { setActiveOverlay, setSelectedPost } = useUI();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const { posts } = usePosts();
  const { startChat } = useMessages();
  const navigate = useNavigate();

  const markRef = React.useRef(markAllAsRead);
  const unreadRef = React.useRef(unreadCount);

  useEffect(() => {
    markRef.current = markAllAsRead;
  });

  useEffect(() => {
    unreadRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    return () => {
      if (unreadRef.current > 0) {
        markRef.current();
      }
    };
  }, []);

  const handleNotificationClick = (n) => {
    if (onClose) onClose();
    else setActiveOverlay(null);

    switch (n.type) {
      case 'follow':
        navigate(`/profile/${n.actor?.username}`);
        break;
      case 'like':
      case 'comment':
      case 'repost':
        if (n.target_id) {
          const post = posts.find(p => p.id === n.target_id);
          if (post) {
            setSelectedPost(post);
          } else {
            // Pass placeholder with ID so PostOverlay knows to fetch it
            setSelectedPost({ id: n.target_id, _needsFetch: true });
          }
        }
        break;
      case 'message':
        if (n.actor) {
          startChat(n.actor);
          navigate('/messages');
        }
        break;
      default:
        navigate(`/profile/${n.actor?.username}`);
    }
  };

  const getNotificationDetails = (n) => {
    switch (n.type) {
      case 'like': return { text: 'liked your post.', icon: <Heart size={12} fill="white" />, color: '#ff3040' };
      case 'comment': return { text: 'commented on your post.', icon: <MessageCircle size={12} fill="white" />, color: '#10b981' };
      case 'follow': return { text: 'started following you.', icon: <UserPlus size={12} />, color: 'var(--accent-color)' };
      case 'message': return { text: 'sent you a message.', icon: <Radio size={12} />, color: '#6366f1' };
      case 'repost': return { text: 'reposted your post.', icon: <TrendingUp size={12} />, color: '#a855f7' };
      default: return { text: 'sent a notification.', icon: <Zap size={12} />, color: 'var(--accent-color)' };
    }
  };

  return (
    <div className="notifications-container fade-in" style={{ display: 'flex', flexDirection: 'column', background: 'transparent', maxHeight: 'inherit' }}>
      
      {/* Header Section: High-Performance Aesthetic */}
      <div style={{ padding: '32px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="rainbow-logo-container" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)' }}>
               <Bell size={18} color="white" />
            </div>
            <div>
               <h2 style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '1px', fontFamily: 'Space Grotesk' }}>NOTIFICATIONS</h2>
               <p style={{ fontSize: '10px', opacity: 0.5, fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>Real-time updates and activity</p>
            </div>
         </div>
         {unreadCount > 0 && (
            <div style={{ position: 'absolute', top: '32px', right: '24px', background: 'var(--accent-color)', color: 'var(--button-text, white)', padding: '4px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: '900', boxShadow: '0 0 15px rgba(var(--accent-color-rgb), 0.4)' }}>
               {unreadCount} NEW NOTIFICATIONS
            </div>
         )}
      </div>

      {/* Stream List */}
      <div className="scrollbar-hidden" style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
         {notifications.length > 0 ? notifications.map(n => {
            const details = getNotificationDetails(n);
            return (
              <div 
                key={n.id} 
                className="notification-item-glass hover-scale" 
                onClick={() => handleNotificationClick(n)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '16px', 
                  borderRadius: 'var(--radius-md)', 
                  marginBottom: '8px',
                  cursor: 'pointer',
                  backgroundColor: n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(var(--accent-color-rgb), 0.08)',
                  border: '1px solid',
                  borderColor: n.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(var(--accent-color-rgb), 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {!n.is_read && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-color)' }} />}
                
                <div style={{ position: 'relative', flexShrink: 0 }}>
                   <Avatar src={n.actor?.avatar_url} username={n.actor?.username} size="44px" borderStyle={n.actor?.border_style} />
                   <div style={{ 
                      position: 'absolute', 
                      bottom: '-4px', 
                      right: '-4px', 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      backgroundColor: details.color, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '2px solid var(--bg-secondary)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                   }}>
                      {details.icon}
                   </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                   <p style={{ fontSize: '13px', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                      <span style={{ fontWeight: '900' }}>{n.actor?.username}</span>
                      <span style={{ marginLeft: '6px', opacity: 0.8 }}>{details.text}</span>
                   </p>
                   <p style={{ fontSize: '11px', opacity: 0.4, marginTop: '4px', fontWeight: '700' }}>{formatDistanceToNow(n.created_at)} ago</p>
                </div>
              </div>
            );
         }) : (
            <div style={{ textAlign: 'center', padding: '100px 40px', opacity: 0.3 }}>
               <Radio size={48} className="pulse" style={{ marginBottom: '24px' }} />
               <h3 style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px' }}>NO NOTIFICATIONS</h3>
               <p style={{ fontSize: '11px', marginTop: '8px' }}>Your notifications feed is currently empty.</p>
            </div>
         )}
      </div>

      {/* Footer Actions */}
      <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
         <button 
           onClick={() => setActiveOverlay(null)}
           className="action-pill hover-scale"
           style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: '900', letterSpacing: '1px', fontSize: '12px' }}
         >
           DISMISS NOTIFICATIONS
         </button>
      </div>
    </div>
  );
};

export default NotificationsOverlay;
