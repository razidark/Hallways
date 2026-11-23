import React from 'react';
import { Grid, PlaySquare, Repeat2, Bookmark } from 'lucide-react';

const ProfileTabs = ({ activeTab, setActiveTab, isCurrentUser }) => {
  const tabs = [
    { id: 'posts', label: 'POSTS', icon: Grid },
    { id: 'reels', label: 'REELS', icon: PlaySquare },
    { id: 'reposts', label: 'REPOSTS', icon: Repeat2 },
  ];

  if (isCurrentUser) {
    tabs.push({ id: 'saved', label: 'SAVED', icon: Bookmark });
  }

  return (
    <div className="profile-tab-bar glass-overlay" style={{ 
      display: 'flex', 
      width: 'fit-content',
      margin: '0 auto',
      justifyContent: 'center', 
      padding: '0 32px',
      gap: 'clamp(10px, 4vw, 40px)', 
      marginBottom: '32px', 
      position: 'sticky', 
      top: '20px', 
      background: 'rgba(255, 255, 255, 0.03)', 
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      zIndex: 100, 
      backdropFilter: 'blur(15px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
    }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <div 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '16px 8px', 
              cursor: 'pointer', 
              color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)', 
              fontSize: '11px', 
              fontWeight: '900', 
              letterSpacing: '2px', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
              whiteSpace: 'nowrap',
              textShadow: isActive ? '0 0 10px rgba(var(--accent-color-rgb), 0.3)' : 'none',
              transform: isActive ? 'translateY(-1px)' : 'none'
            }} 
            className="hover-bright"
          >
            <Icon size={15} /> <span>{tab.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileTabs;
