import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import { X } from 'lucide-react';

const NetworkModal = ({ userId, type, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNetwork = async () => {
      setLoading(true);
      
      let query;
      if (type === 'followers') {
         query = supabase.from('follows').select('follower:profiles!follower_id(*)').eq('following_id', userId);
      } else {
         query = supabase.from('follows').select('following:profiles!following_id(*)').eq('follower_id', userId);
      }

      const { data, error } = await query;
      
      if (!error && data) {
         setUsers(data.map(d => type === 'followers' ? d.follower : d.following).filter(Boolean));
      }
      setLoading(false);
    };

    fetchNetwork();
  }, [userId, type]);

  return (
    <div className="fixed-overlay-pane fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
       <div className="network-modal-content" style={{ width: '400px', backgroundColor: 'var(--bg-primary)', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{type}</h3>
             <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
          </div>
          
          <div className="scrollbar-hidden" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
             {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }} className="spinner"></div>
             ) : users.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   {users.map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => { onClose(); navigate(`/profile/${u.username}`); }}>
                         <Avatar src={u.avatar_url} username={u.username} size="40px" borderStyle={u.border_style} />
                         <div>
                            <h4 style={{ fontWeight: 'bold', fontSize: '14px' }}>{u.username}</h4>
                            <p style={{ opacity: 0.5, fontSize: '12px' }}>{u.full_name}</p>
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5, fontSize: '14px' }}>
                   No {type} yet.
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default NetworkModal;
