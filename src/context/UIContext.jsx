/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from './PostContext';
import { useTheme } from './ThemeContext';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const { setIsCreateModalOpen } = usePosts();
  const { toggleMode } = useTheme();
  const navigate = useNavigate();

  const showToast = (message, type = 'info') => {
    setToast(null); // Reset
    setTimeout(() => {
      setToast({ message, type });
    }, 10);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if typing in input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
        }
        return;
      }

      switch (e.key?.toLowerCase()) {
        case 'escape':
          setActiveOverlay(null);
          setThemePanelOpen(false);
          setIsCreateModalOpen(false);
          break;
        case 'n':
          setIsCreateModalOpen(true);
          break;
        case 'l':
          toggleMode();
          break;
        case 's':
          setActiveOverlay(activeOverlay === 'search' ? null : 'search');
          break;
        case 'h':
          navigate('/');
          break;
        case 'e':
          navigate('/explore');
          break;
        case 'r':
          navigate('/reels');
          break;
        case 'm':
          navigate('/messages');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeOverlay, setIsCreateModalOpen, toggleMode, navigate]);

  return (
    <UIContext.Provider value={{ 
      activeOverlay, 
      setActiveOverlay, 
      themePanelOpen, 
      setThemePanelOpen, 
      toast, 
      showToast,
      selectedPost,
      setSelectedPost
    }}>
      {children}
    </UIContext.Provider>
  );
};
