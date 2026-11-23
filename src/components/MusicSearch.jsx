import React, { useState, useEffect, useRef } from 'react';
import { Search, Music2, X, Play, Pause, ChevronRight, Loader2 } from 'lucide-react';

const MusicSearch = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const audioRef = useRef(new Audio());
  const searchTimeout = useRef(null);

  // Audius Decentralized Search Integration (Open & Free)
  const searchMusic = async (term) => {
    if (!term) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      // Fetching from a healthy Audius host
      const resp = await fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(term)}&app_name=HALLWAY`);
      const payload = await resp.json();
      
      const tracks = (payload.data || []).map(item => ({
        id: item.id,
        title: item.title,
        artist: item.user.name,
        album_art: item.artwork ? item.artwork['480x480'] || item.artwork['150x150'] : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop',
        preview_url: `https://discoveryprovider.audius.co/v1/tracks/${item.id}/stream?app_name=HALLWAY`
      }));
      setResults(tracks);
    } catch (err) {
      console.error("Audius Sync Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (query.trim()) {
      searchTimeout.current = setTimeout(() => {
        searchMusic(query);
      }, 500);
    } else {
      setResults([]);
    }

    return () => clearTimeout(searchTimeout.current);
  }, [query]);

  const togglePreview = (track, e) => {
    e.stopPropagation();
    if (playingTrackId === track.id) {
      audioRef.current.pause();
      setPlayingTrackId(null);
    } else {
      audioRef.current.src = track.preview_url;
      audioRef.current.play().catch(() => console.warn("Audio preview blocked"));
      setPlayingTrackId(track.id);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  return (
    <div className="fade-in glass-overlay" style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      backgroundColor: 'var(--bg-secondary)',
      backdropFilter: 'blur(40px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input 
            autoFocus 
            placeholder="Search for music..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 48px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              outline: 'none',
              fontSize: '14px'
            }}
          />
          {loading && <Loader2 size={18} className="spin" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />}
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '10px' }}>
          <X size={24} />
        </button>
      </div>

      <div className="scrollbar-hidden" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {results.length > 0 ? results.map(track => (
          <div 
            key={track.id} 
            onClick={() => onSelect(track)}
            className="hover-bg" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              padding: '12px', 
              borderRadius: '16px', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
              <img src={track.album_art} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={track.title} />
              <div 
                onClick={(e) => togglePreview(track, e)}
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: playingTrackId === track.id ? 1 : 0, transition: 'opacity 0.2s' }}
                className="hover-opacity"
              >
                {playingTrackId === track.id ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-primary)' }}>{track.title}</span>
              <span style={{ fontSize: '12px', opacity: 0.6, color: 'var(--text-secondary)' }}>{track.artist}</span>
            </div>

            <ChevronRight size={18} style={{ opacity: 0.3 }} />
          </div>
        )) : query.trim() && !loading ? (
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
            <Music2 size={48} style={{ marginBottom: '16px' }} />
            <p>No songs found.</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
            <Music2 size={40} style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>FIND MUSIC</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicSearch;
