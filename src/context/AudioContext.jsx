/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const audioCtxRef = useRef(null);

  // Optimized context management
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log('AudioContext forged.');
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => {
          console.log('AudioContext resonant.');
        });
      }

      // Once forged and resonant, we can remove listeners
      if (audioCtxRef.current.state === 'running') {
        window.removeEventListener('click', unlock);
        window.removeEventListener('mousedown', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      }
    };

    window.addEventListener('click', unlock);
    window.addEventListener('mousedown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);

    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('mousedown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  const playSound = (type) => {
    try {
      if (!audioCtxRef.current) return;
      
      const audioCtx = audioCtxRef.current;
      // Ensure context is running (can be suspended by browser)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      switch (type) {
        case 'like':
          // Glassy Warm Thud
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(150, now);
          oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.3);
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;

        case 'whisper':
          // Sharp Crystal Click
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(800, now);
          oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          oscillator.start(now);
          oscillator.stop(now + 0.05);
          break;

        case 'spark':
          // Ambient Chime
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(880, now); // A5
          oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.5); // E6
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          oscillator.start(now);
          oscillator.stop(now + 0.5);
          break;

        case 'pop':
          // UI Feedback Pop
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(400, now);
          oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          oscillator.start(now);
          oscillator.stop(now + 0.1);
          break;

        case 'warp':
          // Deep Space Transition
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(30, now);
          oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.8);
          gainNode.gain.setValueAtTime(0.0, now);
          gainNode.gain.linearRampToValueAtTime(0.2, now + 0.2);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
          oscillator.start(now);
          oscillator.stop(now + 0.8);
          break;

        default:
          break;
      }
    } catch {
      // Quietly consume errors until the next gesture for a seamless transition
    }
  };

  return (
    <AudioContext.Provider value={{ playSound }}>
      {children}
    </AudioContext.Provider>
  );
};
