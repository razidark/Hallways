import React, { useRef } from 'react';
import { useStories } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { getDynamicAvatarUrl } from '../lib/utils';

const StoryCarousel = () => {
  const { stories, openStoryGroup, uploading } = useStories();
  const { currentUser } = useAuth();
  const { openCreateModal } = usePosts();
  const scrollRef = useRef(null);

  // Check if current user has active stories
  const myStoryGroup = stories.find(g => g.userId === currentUser?.id);

  return (
    <div className="stories-carousel fade-in" style={{
      padding: '20px 0 24px',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '32px'
    }}>
      <div
        ref={scrollRef}
        className="scrollbar-hidden"
        style={{
          display: 'flex',
          gap: '18px',
          overflowX: 'auto',
          padding: '4px 4px',
          scrollBehavior: 'smooth'
        }}
      >
        {/* YOUR STORY — always first */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
            cursor: 'pointer',
            width: '74px'
          }}
          className="hover-scale"
          onClick={() => {
            if (myStoryGroup && myStoryGroup.stories.length > 0) {
              openStoryGroup(myStoryGroup);
            } else {
              openCreateModal('story');
            }
          }}
        >
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              padding: '2.5px',
              background: myStoryGroup && myStoryGroup.stories.length > 0
                ? 'var(--exotic-gradient)'
                : 'linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: myStoryGroup && myStoryGroup.stories.length > 0 ? '0 0 20px rgba(var(--accent-color-rgb), 0.3)' : 'none',
              transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-tertiary)'
              }}>
                {myStoryGroup && myStoryGroup.stories.length > 0 && (myStoryGroup.stories[myStoryGroup.stories.length - 1].media_url.match(/\.(mp4|webm|mov)$/) || myStoryGroup.stories[myStoryGroup.stories.length - 1].type === 'video') ? (
                  <video
                    src={myStoryGroup.stories[myStoryGroup.stories.length - 1].media_url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: uploading ? 0.3 : 1 }}
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={myStoryGroup && myStoryGroup.stories.length > 0
                      ? myStoryGroup.stories[myStoryGroup.stories.length - 1].media_url
                      : (currentUser?.avatar_url || getDynamicAvatarUrl(currentUser?.username || 'H'))
                    }
                    alt="Your story"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: uploading ? 0.3 : 1, transition: 'all 0.5s ease' }}
                  />
                )}
                {uploading && <div className="spinner" style={{ position: 'absolute', width: '24px', height: '24px' }}></div>}
                {/* Visual overlay to make text readable over story preview */}
                {myStoryGroup && myStoryGroup.stories.length > 0 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))' }}></div>
                )}
              </div>
            </div>
            {/* Plus badge - always show if uploading or no active story, or show as smaller "add" button */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: (myStoryGroup && myStoryGroup.stories.length > 0) ? '20px' : '24px',
              height: (myStoryGroup && myStoryGroup.stories.length > 0) ? '20px' : '24px',
              borderRadius: '50%',
              background: 'var(--accent-color)',
              border: '2px solid var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bg-primary)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              zIndex: 10,
              opacity: uploading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
              onClick={(e) => {
                if (myStoryGroup && myStoryGroup.stories.length > 0) {
                  e.stopPropagation();
                  openCreateModal('story');
                }
              }}>
              <Plus size={(myStoryGroup && myStoryGroup.stories.length > 0) ? 10 : 14} strokeWidth={4} />
            </div>
          </div>
          <span style={{
            fontSize: '10px',
            fontWeight: '900',
            color: uploading ? 'var(--accent-color)' : 'var(--text-secondary)',
            letterSpacing: '1px',
            textAlign: 'center',
            marginTop: '4px'
          }}>
            {uploading ? 'SYNCING...' : 'YOUR STORY'}
          </span>
        </div>


        {/* OTHER USERS' STORIES */}
        {stories.filter(g => g.userId !== currentUser?.id).map(group => (
          <div
            key={group.userId}
            onClick={() => openStoryGroup(group)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
              cursor: 'pointer',
              width: '72px'
            }}
            className="hover-scale"
          >
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              padding: '2.5px',
              background: group.allViewed
                ? 'linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
                : 'var(--exotic-gradient)',
              backgroundSize: '200% 200%',
              animation: group.allViewed ? 'none' : 'exoticShift 6s ease infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: group.allViewed ? 'none' : '0 0 15px rgba(var(--accent-color-rgb), 0.2)',
              transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
              opacity: group.allViewed ? 0.6 : 1
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid var(--bg-primary)'
              }}>
                {group.stories[group.stories.length - 1].media_url.match(/\.(mp4|webm|mov)$/) || group.stories[group.stories.length - 1].type === 'video' ? (
                  <video
                    src={group.stories[group.stories.length - 1].media_url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={group.stories[group.stories.length - 1].media_url}
                    alt={group.username}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = group.avatar_url || getDynamicAvatarUrl(group.username);
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: '900',
              color: group.allViewed ? 'var(--text-secondary)' : 'var(--text-primary)',
              maxWidth: '72px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              letterSpacing: '0.5px'
            }}>
              {group.username.toUpperCase()}
            </span>
            {!group.allViewed && (
              <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '1px' }}>STORY</span>
            )}
          </div>
        ))}

        {/* Empty state hint */}
        {stories.filter(g => g.userId !== currentUser?.id).length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            borderRadius: '20px',
            backgroundColor: 'rgba(var(--accent-color-rgb), 0.05)',
            border: '1px dashed var(--border-color)',
            flexShrink: 0
          }}>
            <ImageIcon size={16} style={{ opacity: 0.4 }} />
            <span style={{ fontSize: '12px', opacity: 0.5, whiteSpace: 'nowrap' }}>
              Follow others to see their stories
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryCarousel;
