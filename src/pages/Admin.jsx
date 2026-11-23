import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isUserAdmin, isUserVerified } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';
import Avatar from '../components/Avatar';
import AdminBadge from '../components/AdminBadge';
import VerifiedBadge from '../components/VerifiedBadge';
import { useUI } from '../context/UIContext';
import { useAudio } from '../context/AudioContext';
import { Shield, Users, Image, MessageSquare, Search, Loader2, Award, ShieldAlert, ArrowLeft } from 'lucide-react';

const Admin = () => {
  const { currentUser } = useAuth();
  const { showToast } = useUI();
  const { playSound } = useAudio();
  
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    usersCount: 0,
    postsCount: 0,
    messagesCount: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      const [usersRes, postsRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true })
      ]);
      
      setStats({
        usersCount: usersRes.count || 0,
        postsCount: postsRes.count || 0,
        messagesCount: messagesRes.count || 0
      });
    } catch (err) {
      console.error("Telemetry Retrieval Failed:", err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // NOTE: profiles has NO `created_at` column (the live table has `updated_at`).
      // Ordering by `created_at` returned HTTP 400 "column profiles.created_at does
      // not exist", which threw and left the Node Directory permanently empty.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      if (data) setUsers(data);
    } catch (err) {
      console.error("Failed to fetch node directory:", err);
      showToast("Identity directory offline.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [fetchStats, fetchUsers]);

  const handleRoleToggle = async (targetUser) => {
    const isCurrentlyAdmin = isUserAdmin(targetUser);
    const newRole = isCurrentlyAdmin ? 'user' : 'admin';
    const actionLabel = isCurrentlyAdmin ? 'demote' : 'promote';

    // Prevent self-demotion or owner lockout
    if (targetUser.id === currentUser.id) {
      showToast("Cannot demote your own active session.", "error");
      return;
    }
    // Keep at least one admin in the system: never demote the last remaining admin.
    if (isCurrentlyAdmin) {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');
      if ((count || 0) <= 1) {
        showToast("Cannot demote the last remaining admin.", "error");
        return;
      }
    }

    if (!window.confirm(`Are you sure you want to ${actionLabel} ${targetUser.username} to ${newRole}?`)) {
      return;
    }

    setUpdatingUserId(targetUser.id);
    playSound('pop');

    try {
      // Persist the role change. The DB stores it in public.profiles.role;
      // an RLS guard (profiles_guard_role) only lets admins change it.
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUser.id);

      if (error) throw error;

      // Update local state list
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      
      showToast(`User successfully ${isCurrentlyAdmin ? 'demoted' : 'promoted'} to ${newRole}!`, "success");
      fetchStats(); // Refresh stats
    } catch (err) {
      console.error("Role update failed:", err);
      showToast("Failed to write privilege fragments. Check RLS policies.", "error");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleVerifiedToggle = async (targetUser) => {
    const newVerified = !targetUser.is_verified;

    setUpdatingUserId(targetUser.id);
    playSound('pop');

    try {
      // The DB enforces this too: guard_profile_role() rejects any change to
      // is_verified unless the caller is an admin.
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: newVerified })
        .eq('id', targetUser.id);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_verified: newVerified } : u));
      showToast(`${targetUser.username} is now ${newVerified ? 'verified' : 'unverified'}.`, "success");
    } catch (err) {
      console.error("Verification update failed:", err);
      showToast("Failed to write verification status. Check RLS policies.", "error");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Never demote the last remaining admin. Derived purely from the DB role
  // column — no hardcoded usernames.
  const adminCount = users.filter(u => isUserAdmin(u)).length;

  // Guard: if not admin, redirect home
  if (!currentUser || !isUserAdmin(currentUser)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="fade-in" style={{ padding: 'clamp(20px, 4vw, 40px)', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p className="rainbow-text" style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', marginBottom: '8px' }}>SECURE ACCESS CONSOLE</p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: '-2px', lineHeight: 1 }}>
            System Overseer HUD
          </h1>
        </div>
        <div className="glass-overlay" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '14px', border: '1px solid rgba(255, 0, 85, 0.2)', background: 'rgba(255, 0, 85, 0.05)' }}>
          <ShieldAlert size={16} color="#ff0055" />
          <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1px', color: '#ff0055' }}>SYSTEM INTEGRITY ONLINE</span>
        </div>
      </div>

      {/* METRICS & TELEMETRY SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Metric 1 */}
        <div className="glass-overlay hover-scale" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(var(--accent-color-rgb), 0.1)', color: 'var(--accent-color)' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '900', opacity: 0.5, letterSpacing: '1px' }}>TOTAL NODES</p>
            <h3 style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'Space Grotesk', marginTop: '4px' }}>{stats.usersCount}</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-overlay hover-scale" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(0, 242, 255, 0.1)', color: '#00f2ff' }}>
            <Image size={24} />
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '900', opacity: 0.5, letterSpacing: '1px' }}>TOTAL BROADCASTS</p>
            <h3 style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'Space Grotesk', marginTop: '4px' }}>{stats.postsCount}</h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-overlay hover-scale" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255, 0, 85, 0.1)', color: '#ff0055' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '900', opacity: 0.5, letterSpacing: '1px' }}>NET WHISPERS</p>
            <h3 style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'Space Grotesk', marginTop: '4px' }}>{stats.messagesCount}</h3>
          </div>
        </div>

      </div>

      {/* CORE OPERATIONAL CONSOLE (Users Promotion) */}
      <div className="glass-overlay" style={{ flex: 1, padding: 'clamp(20px, 3vw, 32px)', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'Space Grotesk' }}>Node Directory</h2>
            <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '2px' }}>Manage security privileges and system ranks of user nodes.</p>
          </div>
          
          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input 
              type="text" 
              placeholder="Filter nodes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 44px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', outline: 'none', color: 'var(--text-primary)', fontSize: '13px', transition: 'all 0.3s' }}
            />
          </div>
        </div>

        {/* Node list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
            <Loader2 size={32} className="spin" color="var(--accent-color)" />
            <p style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', opacity: 0.5 }}>SYNCHRONIZING SECURE ACCESS...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', opacity: 0.4 }}>
            <Users size={32} style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '13px', fontWeight: 'bold' }}>No matching user nodes found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: 0.5, fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px' }}>NODE PROFILE</th>
                  <th style={{ padding: '16px' }}>STATUS RANK</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>OPERATIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const isAdmin = isUserAdmin(user);
                  const isCurrent = user.id === currentUser.id;
                  // The last remaining admin cannot be demoted (no hardcoded usernames).
                  const isLastAdmin = isAdmin && adminCount <= 1;
                  
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background-color 0.2s' }} className="hover-bg-subtle">
                      
                      {/* User Avatar & Info */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <Avatar src={user.avatar_url} username={user.username} borderStyle={user.border_style} avatarShape={user.avatar_shape} size="40px" />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{user.username}</strong>
                              {isAdmin && <AdminBadge size={12} />}
                              {isUserVerified(user) && !isAdmin && <VerifiedBadge size={12} />}
                            </div>
                            <span style={{ fontSize: '11px', opacity: 0.5 }}>{user.full_name || 'Anonymous Node'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Rank tag */}
                      <td style={{ padding: '16px' }}>
                        {isAdmin ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '900', color: '#ff0055', background: 'rgba(255, 0, 85, 0.1)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255, 0, 85, 0.2)' }}>
                            SYSTEM OVERSEER
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            USER NODE
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleVerifiedToggle(user)}
                          title={user.is_verified ? 'Revoke verified badge' : 'Grant verified badge'}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            cursor: 'pointer',
                            color: user.is_verified ? '#00b4db' : 'rgba(255,255,255,0.45)',
                            backgroundColor: user.is_verified ? 'rgba(0, 180, 219, 0.12)' : 'transparent',
                            border: user.is_verified ? '1px solid rgba(0, 180, 219, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                            transition: 'all 0.2s'
                          }}
                          className="hover-bright"
                        >
                          {updatingUserId === user.id ? (
                            <Loader2 size={12} className="spin" />
                          ) : user.is_verified ? (
                            'Verified ✓'
                          ) : (
                            'Verify'
                          )}
                        </button>
                        <button
                          disabled={updatingUserId === user.id || isCurrent || isLastAdmin}
                          onClick={() => handleRoleToggle(user)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            cursor: (isCurrent || isLastAdmin) ? 'not-allowed' : 'pointer',
                            color: isCurrent || isLastAdmin ? 'rgba(255,255,255,0.2)' : 'white',
                            backgroundColor: isCurrent || isLastAdmin
                              ? 'transparent'
                              : (isAdmin ? 'rgba(239, 68, 68, 0.1)' : 'rgba(var(--accent-color-rgb), 0.15)'),
                            border: isCurrent || isLastAdmin
                              ? '1px solid rgba(255,255,255,0.05)'
                              : (isAdmin ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(var(--accent-color-rgb), 0.3)'),
                            transition: 'all 0.2s'
                          }}
                          className={isCurrent || isLastAdmin ? "" : "hover-bright"}
                        >
                          {updatingUserId === user.id ? (
                            <Loader2 size={12} className="spin" />
                          ) : isCurrent ? (
                            'Active Session'
                          ) : isLastAdmin ? (
                            'Last Admin'
                          ) : isAdmin ? (
                            'Demote to User'
                          ) : (
                            'Promote to Admin'
                          )}
                        </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;
