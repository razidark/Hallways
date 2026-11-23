import React, { useEffect, useState, useMemo } from 'react';
import { Globe, Users, Zap, Heart, MessageCircle, MapPin } from 'lucide-react';
import { usePosts } from '../context/PostContext';
import Avatar from '../components/Avatar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Global = () => {
  const { globalPosts } = usePosts();
  const [metrics, setMetrics] = useState({ likes: 0, users: 0, posts: 0 });
  const [selectedPost, setSelectedPost] = useState(null);
  const navigate = useNavigate();

  // Map posts to coordinates on the world map
  const postNodes = useMemo(() => {
    return globalPosts.map(post => {
      // Use post.id hash to generate stable random coordinates
      let hash = 0;
      for (let i = 0; i < post.id.length; i++) {
        hash = post.id.charCodeAt(i) + ((hash << 5) - hash);
      }
      const x = (Math.abs(hash % 800) / 800) * 0.8 + 0.1; // 10% to 90%
      const y = (Math.abs((hash >> 8) % 600) / 600) * 0.6 + 0.2; // 20% to 80%
      
      return {
        ...post,
        x,
        y,
        pulseScale: 0.5 + ((Math.abs(hash >> 16) % 100) / 100) * 0.5
      };
    });
  }, [globalPosts]);

  useEffect(() => {
    const fetchRealMetrics = async () => {
      const { count: likesCount } = await supabase.from('likes').select('*', { count: 'exact', head: true });
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: postsCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
      
      setMetrics({ 
        likes: likesCount || 0, 
        users: usersCount || 0,
        posts: postsCount || globalPosts.length
      });
    };
    fetchRealMetrics();
  }, [globalPosts]);

  return (
    <div className="fade-in" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="evolved-layout" style={{ maxWidth: '1400px', width: '100%', padding: '40px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          <div style={{ textAlign: 'left', marginBottom: '40px' }}>
             <h1 style={{ fontSize: '48px', fontWeight: '900', fontFamily: 'Space Grotesk', marginBottom: '8px', letterSpacing: '-2px' }}>Global Activity</h1>
             <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px' }}>
                Visualizing all live active posts across the network in real-time.
             </p>
          </div>

          <div style={{ flex: 1, display: 'flex', gap: '32px', minHeight: '600px' }}>
             {/* THE GLOBAL MAP - CANVAS ENGINE */}
             <div style={{ flex: 2, position: 'relative', backgroundColor: 'rgba(var(--bg-secondary-rgb), 0.3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.3)', backdropFilter: 'blur(40px)' }}>
                <WorldMapCanvas nodes={postNodes} onNodeClick={setSelectedPost} selectedId={selectedPost?.id} />

                {/* Stats Overlay */}
                <div style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 10 }}>
                    <div style={{ display: 'flex', gap: '32px', background: 'rgba(0,0,0,0.2)', padding: '20px 32px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
                        <div>
                            <p style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '2.5px', marginBottom: '4px', fontWeight: 'bold' }}>TOTAL LIKES</p>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-color)' }}>{metrics.likes.toLocaleString()}</h3>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <div>
                            <p style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '2.5px', marginBottom: '4px', fontWeight: 'bold' }}>ACTIVE USERS</p>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#00ff87' }}>{metrics.users.toLocaleString()}</h3>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <div>
                            <p style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '2.5px', marginBottom: '4px', fontWeight: 'bold' }}>TOTAL POSTS</p>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#60efff' }}>{metrics.posts.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div style={{ position: 'absolute', bottom: '32px', right: '32px', display: 'flex', gap: '12px', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', fontSize: '11px', fontWeight: 'bold', color: 'white', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00ff87', boxShadow: '0 0 10px #00ff87' }} /> LIVE STATUS
                    </div>
                </div>
             </div>

             {/* Sidebar Detail Card */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {selectedPost ? (
                    <div className="fade-in" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Avatar src={selectedPost.user.avatar_url} username={selectedPost.user.username} borderStyle={selectedPost.user.border_style} size="56px" />
                            <div>
                                <h4 style={{ fontWeight: '900', fontSize: '18px' }}>{selectedPost.user.username}</h4>
                                <p style={{ fontSize: '12px', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} /> Active Network Node</p>
                            </div>
                        </div>

                        <div style={{ aspectRatio: '4/5', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <img src={selectedPost.image_url} alt="Post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} className={selectedPost.filter_class} />
                        </div>

                        <p style={{ fontSize: '15px', lineHeight: '1.6', opacity: 0.9 }}>{selectedPost.caption}</p>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={() => navigate(`/profile/${selectedPost.user.username}`)} className="exotic-gradient" style={{ flex: 2, padding: '14px', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>View Origin</button>
                            <button style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontWeight: 'bold', border: '1px solid var(--border-color)', cursor: 'pointer' }}><Heart size={20} /></button>
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '24px', opacity: 0.5 }}>
                        <Globe size={64} strokeWidth={1} style={{ opacity: 0.3 }} />
                        <div>
                            <h4 style={{ fontWeight: 'bold', fontSize: '18px' }}>Select a Post</h4>
                            <p style={{ fontSize: '14px', marginTop: '8px' }}>Click on any glowing point to view the post.</p>
                        </div>
                    </div>
                )}

                <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: '900', opacity: 0.4, letterSpacing: '1px' }}>LATEST ACTIVITY</h4>
                    <div className="scrollbar-hidden" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {postNodes.slice(0, 5).map(node => (
                            <div key={node.id} onClick={() => setSelectedPost(node)} className={`hover-bg ${selectedPost?.id === node.id ? 'active-opt' : ''}`} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <Avatar src={node.user.avatar_url} username={node.user.username} size="32px" />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '12px', fontWeight: 'bold' }}>{node.user.username}</p>
                                    <p style={{ fontSize: '11px', opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.caption}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};

const WorldMapCanvas = ({ nodes, onNodeClick, selectedId }) => {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const handleClick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        nodes.forEach(node => {
            const nx = node.x * canvas.width;
            const ny = node.y * canvas.height;
            const dist = Math.sqrt(Math.pow(mouseX - nx, 2) + Math.pow(mouseY - ny, 2));
            if (dist < 15) {
                onNodeClick(node);
            }
        });
    };

    window.addEventListener('resize', resize);
    canvas.addEventListener('click', handleClick);
    resize();

    const draw = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Spatial Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=80) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for(let i=0; i<canvas.height; i+=80) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Draw Connections (Connecting nearest neighbors)
      ctx.lineWidth = 1;
      nodes.forEach((n1, i) => {
        nodes.slice(i + 1).forEach(n2 => {
          const dist = Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
          if (dist < 0.25) {
            const grad = ctx.createLinearGradient(n1.x*canvas.width, n1.y*canvas.height, n2.x*canvas.width, n2.y*canvas.height);
            grad.addColorStop(0, 'rgba(129, 140, 248, 0)');
            grad.addColorStop(0.5, `rgba(129, 140, 248, ${0.1 * (1 - dist/0.25)})`);
            grad.addColorStop(1, 'rgba(129, 140, 248, 0)');
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(n1.x * canvas.width, n1.y * canvas.height);
            ctx.lineTo(n2.x * canvas.width, n2.y * canvas.height);
            ctx.stroke();
          }
        });
      });

      // Draw Nodes (Expanding Sonar Radar Pings)
      nodes.forEach((node, i) => {
        const x = node.x * canvas.width;
        const y = node.y * canvas.height;
        const isSelected = node.id === selectedId;
        const speedMultiplier = 0.0015;
        const pingTime = (time * speedMultiplier + i * 0.2) % 1.0;
        
        // Expanding ring
        ctx.strokeStyle = isSelected ? `rgba(0, 255, 135, ${1.0 - pingTime})` : `rgba(129, 140, 248, ${0.4 * (1.0 - pingTime)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, pingTime * 36, 0, Math.PI * 2);
        ctx.stroke();

        // Core dot
        ctx.fillStyle = isSelected ? '#00ff87' : 'rgba(129, 140, 248, 0.8)';
        ctx.shadowBlur = isSelected ? 15 : 6;
        ctx.shadowColor = isSelected ? '#00ff87' : 'rgba(129, 140, 248, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 6 : 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw(0);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, selectedId, onNodeClick]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair' }} />;
};

export default Global;
