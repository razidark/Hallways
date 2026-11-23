import React from 'react';
import { Heart, UserPlus, MessageCircle, Zap, Repeat2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { formatDistanceToNow } from '../lib/utils';

const Notifications = () => {
  const { notifications, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  React.useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const getNotificationText = (type) => {
    switch (type) {
      case 'like': return 'liked your post.';
      case 'comment': return 'commented on your post.';
      case 'follow': return 'started following you.';
      case 'repost': return 'reposted your post.';
      case 'message': return 'sent you a message.';
      default: return 'interacted with your account.';
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'like': return '#ff3040';
      case 'follow': return '#0095f6';
      case 'comment': return '#10b981';
      case 'repost': return '#818cf8';
      default: return '#6366f1';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={10} color="white" fill="white" />;
      case 'follow': return <UserPlus size={10} color="white" />;
      case 'comment': return <MessageCircle size={10} color="white" />;
      case 'repost': return <Repeat2 size={10} color="white" />;
      default: return <Zap size={10} color="white" fill="white" />;
    }
  };

  return (
    <div className="fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%', padding: '40px 20px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'Space Grotesk' }}>Activity</h1>
            {notifications.length > 0 && (
              <button onClick={markAllAsRead} style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.5, color: 'var(--accent-color)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
         </div>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.length > 0 ? (
              <>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', opacity: 0.6 }}>Recent Activity</h4>
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className="notification-item hover-bg" 
                    onClick={() => {
                      if (n.actor?.username) navigate(`/profile/${n.actor.username}`);
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px', 
                      padding: '16px', 
                      borderRadius: '20px', 
                      cursor: 'pointer', 
                      transition: 'all 0.3s ease', 
                      opacity: n.is_read ? 0.6 : 1,
                      backgroundColor: n.is_read ? 'transparent' : 'rgba(var(--accent-color-rgb), 0.05)'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                       <Avatar 
                         src={n.actor?.avatar_url} 
                         username={n.actor?.username} 
                         size="44px" 
                         borderStyle="normal" 
                       />
                       <div style={{ 
                         position: 'absolute', 
                         bottom: '-4px', 
                         right: '-4px', 
                         width: '20px', 
                         height: '20px', 
                         borderRadius: '50%', 
                         backgroundColor: getIconBg(n.type), 
                         display: 'flex', 
                         alignItems: 'center', 
                         justifyContent: 'center', 
                         border: '2px solid var(--bg-primary)' 
                       }}>
                          {getIcon(n.type)}
                       </div>
                    </div>
                    <div style={{ flex: 1 }}>
                       <p style={{ fontSize: '14px', lineHeight: '1.4' }}>
                          {/* The space belongs in the markup, not in a margin: a
                              margin on inline elements does not show up in the
                              accessible/rendered text ("Razisent you a message"). */}
                          <strong style={{ color: 'var(--text-primary)' }}>{n.actor?.username || 'User'}</strong>{' '}
                          <span style={{ color: 'var(--text-secondary)' }}>{getNotificationText(n.type)}</span>
                       </p>
                       <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
                         {formatDistanceToNow(n.created_at)}
                       </p>
                    </div>
                    {n.type === 'follow' && (
                       <button className="exotic-gradient" style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>Follow Back</button>
                    )}
                    {!n.is_read && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', flexShrink: 0 }} />
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 20px', opacity: 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Zap size={40} />
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>No activity yet.</p>
                <p style={{ fontSize: '14px' }}>Like a post, follow someone, or leave a comment to see activity here.</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Notifications;
