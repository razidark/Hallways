import React, { useState } from 'react';
import { Plus, Image, Film, Layout, X } from 'lucide-react';
import { usePosts } from '../context/PostContext';
import { useAudio } from '../context/AudioContext';

const CreationHub = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { openCreateModal } = usePosts();
  const { playSound } = useAudio();

  const handleAction = (type) => {
    playSound('pop');
    openCreateModal(type);
    setIsOpen(false);
  };

  return (
    <div className="creation-hub-container" style={{ position: 'fixed', bottom: '80px', left: '24px', zIndex: 4001 }}>

      {/* Action Menu (Expands Upwards) */}
      {isOpen && (
        <div className="creation-menu fade-in-up" style={{
          position: 'absolute',
          bottom: '70px',
          left: '0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '12px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-secondary)',
          backdropFilter: 'blur(40px)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
        }}>
          <button onClick={() => handleAction('post')} className="hub-item">
            <Layout size={18} /> <span>New Post</span>
          </button>
          <button onClick={() => handleAction('story')} className="hub-item">
            <Image size={18} /> <span>Add Story</span>
          </button>
          <button onClick={() => handleAction('reel')} className="hub-item">
            <Film size={18} /> <span>Create Reel</span>
          </button>
        </div>
      )}

      {/* Main Toggle Button */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          playSound('pop');
        }}
        className={`hub-trigger ${isOpen ? 'active' : ''}`}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--button-text, white)',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(var(--accent-color-rgb), 0.4)',
          transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
          transform: isOpen ? 'rotate(135deg)' : 'rotate(0deg)'
        }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </div>

      <style>{`
        .hub-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border-radius: 16px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .hub-item:hover {
          background: rgba(var(--accent-color-rgb), 0.1);
          color: var(--accent-color);
          transform: translateX(-4px);
        }
        .hub-trigger:hover {
          transform: scale(1.1) rotate(${isOpen ? '135deg' : '0deg'});
          box-shadow: 0 12px 40px rgba(var(--accent-color-rgb), 0.6);
        }
      `}</style>
    </div>
  );
};

export default CreationHub;
