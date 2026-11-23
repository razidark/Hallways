import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';
import { 
  Sparkles, Cloud, Zap, Wind, Moon, Sun, 
  Terminal, Cpu, Mountain, Orbit, Ghost, 
  Contrast, Shield, Snowflake, Palette 
} from 'lucide-react';

const ThemePanel = ({ className = '', style = {}, onSelect = () => {}, viewMode = 'compact' }) => {
  const { theme, setTheme } = useTheme();
  const { playSound } = useAudio();

  const isExpanded = viewMode === 'expanded';

  const THEMES = {
    CORE: [
      { key: 'rainbow', label: 'Rainbow', icon: Sparkles, bg: 'linear-gradient(135deg, #ff0000, #ff8700, #ffd300, #deff0a, #0aefff, #147df5)', color: 'white' },
      { key: 'nebula', label: 'Nebula', icon: Cloud, bg: '#06b6d4', color: 'white' },
      { key: 'solar', label: 'Solar', icon: Zap, bg: '#ea580c', color: 'white' },
      { key: 'aurora', label: 'Aurora', icon: Wind, bg: '#00ff87', color: 'black' },
      { key: 'dracula', label: 'Dracula', icon: Moon, bg: '#bd93f9', color: 'white' },
      { key: 'midnight', label: 'Midnight', icon: Sun, bg: '#2563eb', color: 'white' },
    ],
    CINEMA: [
      { key: 'matrix', label: 'Matrix', icon: Terminal, bg: '#00ff41', color: 'black' },
      { key: 'cyberpunk', label: 'Cyberpunk', icon: Cpu, bg: '#fdf001', color: 'black' },
      { key: 'ghibli', label: 'Ghibli', icon: Mountain, bg: '#87ceeb', color: 'white' },
      { key: 'interstellar', label: 'Interstellar', icon: Orbit, bg: '#000033', color: 'white' },
      { key: 'phantom', label: 'Phantom', icon: Ghost, bg: '#d946ef', color: 'white' },
      { key: 'noir', label: 'Noir', icon: Contrast, bg: '#1a1a1a', color: 'white' },
      { key: 'gotham', label: 'Gotham', icon: Shield, bg: '#facc15', color: 'black' },
      { key: 'hoth', label: 'Hoth', icon: Snowflake, bg: '#f0f8ff', color: 'black' },
      { key: 'sakura', label: 'Sakura', icon: Sparkles, bg: '#ff69b4', color: 'white' },
      { key: 'obsidian', label: 'Obsidian', icon: Moon, bg: 'linear-gradient(135deg, #1a0033, #a855f7)', color: 'white' },
      { key: 'copper', label: 'Copper', icon: Sun, bg: 'linear-gradient(135deg, #8b4513, #cd853f)', color: 'white' },
      { key: 'arctic', label: 'Arctic', icon: Snowflake, bg: 'linear-gradient(135deg, #7dd3fc, #0ea5e9)', color: 'white' },
    ]
  };

  const [ambientActive, setAmbientActive] = React.useState(false);
  const [ambientVolume, setAmbientVolume] = React.useState(0.1);
  const audioContextRef = React.useRef(null);
  const gainNodeRef = React.useRef(null);
  const oscRef = React.useRef(null);

  const startAmbient = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.value = ambientVolume;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.value = 55; 
      osc2.frequency.value = 110; 
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 150; 
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      
      audioContextRef.current = ctx;
      gainNodeRef.current = gain;
      oscRef.current = [osc1, osc2];
      setAmbientActive(true);
    } catch(e) {
      console.error(e);
    }
  };

  const stopAmbient = () => {
    if (audioContextRef.current) {
      if (oscRef.current) {
        oscRef.current.forEach(o => { try { o.stop(); } catch { /* ignore */ } });
      }
      try { audioContextRef.current.close(); } catch { /* ignore */ }
      audioContextRef.current = null;
      gainNodeRef.current = null;
      oscRef.current = null;
      setAmbientActive(false);
    }
  };

  React.useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = ambientVolume;
    }
  }, [ambientVolume]);

  React.useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        if (oscRef.current) {
          oscRef.current.forEach(o => { try { o.stop(); } catch { /* ignore */ } });
        }
        try { audioContextRef.current.close(); } catch { /* ignore */ }
      }
    };
  }, []);

  const handleThemeChange = (newTheme) => {
    playSound('warp');
    setTheme(newTheme);
    onSelect(newTheme);
  };

  return (
    <div className={`theme-panel-component ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? '32px' : '20px', ...style }}>
      {Object.entries(THEMES).map(([category, items]) => (
        <div key={category}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Palette size={isExpanded ? 14 : 12} style={{ opacity: 0.3 }} />
            <h4 style={{ fontWeight: '900', fontSize: isExpanded ? '11px' : '10px', opacity: 0.4, letterSpacing: '2px', textTransform: 'uppercase' }}>{category} IDENTITY</h4>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isExpanded ? 'repeat(auto-fill, minmax(130px, 1fr))' : 'repeat(2, 1fr)', 
            gap: isExpanded ? '16px' : '10px' 
          }}>
            {items.map(t => {
              const Icon = t.icon;
              const isActive = theme === t.key;
              return (
                <div
                  key={t.key}
                  onClick={() => handleThemeChange(t.key)}
                  className={`theme-opt ${isActive ? 'active-opt' : ''}`}
                  style={{ 
                    padding: isExpanded ? '20px 16px' : '16px 12px',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: isExpanded ? '12px' : '8px',
                    position: 'relative',
                    border: '1px solid transparent',
                    borderColor: isActive ? 'var(--accent-color)' : 'transparent',
                    backgroundColor: isActive ? 'rgba(var(--accent-color-rgb), 0.05)' : 'transparent',
                    transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)'
                  }}
                >
                  {/* Theme Color Indicator Dot */}
                  <div style={{
                    width: isExpanded ? '44px' : '32px',
                    height: isExpanded ? '44px' : '32px',
                    borderRadius: isExpanded ? 'var(--radius-md)' : 'var(--radius-sm)',
                    background: t.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? `0 8px 20px ${t.bg.includes('gradient') ? 'rgba(var(--accent-color-rgb), 0.3)' : t.bg + '66'}` : `0 4px 12px rgba(0,0,0,0.1)`,
                    transition: 'all 0.3s ease'
                  }}>
                    <Icon size={isExpanded ? 20 : 16} color={t.color} strokeWidth={2.5} />
                  </div>
                  
                  <span style={{ 
                    fontSize: isExpanded ? '12px' : '11px', 
                    fontWeight: '800', 
                    letterSpacing: '0.5px',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'color 0.3s ease'
                  }}>
                    {t.label.toUpperCase()}
                  </span>

                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-color)',
                      boxShadow: '0 0 10px var(--accent-color)'
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Ambient Soundscape Section */}
      <div style={{ marginTop: '12px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Palette size={isExpanded ? 14 : 12} style={{ opacity: 0.3 }} />
          <h4 style={{ fontWeight: '900', fontSize: isExpanded ? '11px' : '10px', opacity: 0.4, letterSpacing: '2px', textTransform: 'uppercase' }}>AMBIENT SOUNDSCAPE</h4>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Deep Synth Hum</span>
            <button 
              onClick={ambientActive ? stopAmbient : startAmbient} 
              style={{
                fontSize: '11px', 
                fontWeight: '900',
                padding: '6px 12px', 
                borderRadius: 'var(--radius-sm)',
                backgroundColor: ambientActive ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                color: ambientActive ? 'white' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              {ambientActive ? 'ACTIVE' : 'ACTIVATE'}
            </button>
          </div>
          
          {ambientActive && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', opacity: 0.5 }}>VOLUME: {Math.round(ambientVolume * 100)}%</span>
              <input 
                type="range" 
                min="0" 
                max="0.3" 
                step="0.01" 
                value={ambientVolume} 
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))} 
                style={{ width: '100%', cursor: 'pointer' }} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemePanel;
