import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import { useParams, useNavigate } from 'react-router-dom';
import PostOverlay from '../components/PostOverlay';
import NetworkModal from '../components/NetworkModal';
import { useMessages } from '../context/MessageContext';
import { supabase } from '../lib/supabaseClient';
import SkeletonGrid from '../components/skeleton/SkeletonGrid';
import { useAudio } from '../context/AudioContext';
import { useUI } from '../context/UIContext';

// Modular Components
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileGrid from '../components/profile/ProfileGrid';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser, toggleFollow } = useAuth();
  const { posts, loading: postsLoading } = usePosts();
  const { startChat } = useMessages();
  const { playSound } = useAudio();
  const { showToast } = useUI();
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); 
  const [networkModal, setNetworkModal] = useState({ isOpen: false, type: 'followers' });
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [synthesizedAura, setSynthesizedAura] = useState(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!profileUser?.banner_url) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 20; 
    const y = (clientY / innerHeight - 0.5) * 20;
    setParallax({ x, y });
  };

  const isCurrentUser = currentUser?.id === profileUser?.id;

  const handleHarmonize = async () => {
    if (!synthesizedAura || !isCurrentUser) return;
    playSound('spark');
    showToast(`Identity Sync matched with ${synthesizedAura.name}`, "success");
  };

  const calculateAura = (userPosts) => {
    if (!userPosts || userPosts.length === 0) return null;
    const filterCounts = {};
    userPosts.forEach(p => {
      const f = p.filter_class || 'none';
      filterCounts[f] = (filterCounts[f] || 0) + 1;
    });
    const topFilter = Object.entries(filterCounts).sort((a,b) => b[1] - a[1])[0][0];
    
    const AURA_MAP = {
      'cyber': { name: 'Cyber Sync', class: 'gradient-neon', icon: '⚡' },
      'void': { name: 'Void Sync', class: 'gradient-void', icon: '🌑' },
      'amber': { name: 'Solar Sync', class: 'gradient-solar', icon: '☀️' },
      'vaporwave': { name: 'Sunset Sync', class: 'gradient-rose', icon: '🌸' },
      'lunar': { name: 'Oceanic Sync', class: 'gradient-ocean', icon: '🌊' },
      'none': { name: 'Base Sync', class: 'gradient-aurora', icon: '✨' }
    };
    return AURA_MAP[topFilter] || AURA_MAP['none'];
  };

  const fetchProfileData = React.useCallback(async () => {
    setLoading(true);
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (!userError && userData) {
      setProfileUser(userData);

      const { data: userPostsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userData.id);

      if (userPostsData) {
        const aura = calculateAura(userPostsData);
        setSynthesizedAura(aura);
      }

      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userData.id);
      
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userData.id);

      setFollowCounts({ followers: followersCount || 0, following: followingCount || 0 });

      if (currentUser && currentUser.id !== userData.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUser.id)
          .eq('following_id', userData.id)
          .single();
        setIsFollowing(!!followData);
      }
    }
    setLoading(false);
  }, [username, currentUser]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  if (loading || postsLoading) return (
    <div style={{ width: '100%', maxWidth: '935px', margin: '0 auto', padding: '20px' }}>
       <div className="shimmer" style={{ height: '300px', borderRadius: 'var(--radius-xl)', marginBottom: '40px', opacity: 0.3 }}></div>
       <SkeletonGrid count={6} />
    </div>
  );

  if (!profileUser) return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
       <h2>User not found</h2>
       <button onClick={() => navigate('/')} className="hover-underline">Home</button>
    </div>
  );

  const userPosts = posts
    .filter(p => p.user_id === profileUser.id)
    .sort((a,b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
  const postTotalCount = userPosts.filter(p => !p.repost_id && !p.repost).length;
  const repostTotalCount = userPosts.filter(p => p.repost_id || p.repost).length;
    
  const displayPosts = activeTab === 'saved' 
    ? posts.filter(p => p.isSaved && isCurrentUser) 
    : activeTab === 'reposts'
    ? userPosts.filter(p => p.repost_id || p.repost)
    : (activeTab === 'reels' ? userPosts.filter(p => p.is_reel) : userPosts.filter(p => !p.is_reel && !p.repost_id));

  const handleToggleFollow = async () => {
    if (!currentUser) return navigate('/login');
    setFollowLoading(true);
    const res = await toggleFollow(profileUser.id);
    if (res.success) {
        setIsFollowing(res.isFollowing);
        setFollowCounts(prev => ({ 
            ...prev, 
            followers: res.isFollowing ? prev.followers + 1 : Math.max(0, prev.followers - 1) 
        }));
    }
    setFollowLoading(false);
  };

  return (
    <div className="flex w-full" style={{ justifyContent: 'center' }} onMouseMove={handleMouseMove}>
      <div className="profile-container" style={{ padding: 'var(--space-lg) var(--space-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '1200px' }}>
        
        <ProfileHeader 
          profileUser={profileUser}
          isCurrentUser={isCurrentUser}
          isFollowing={isFollowing}
          followLoading={followLoading}
          handleToggleFollow={handleToggleFollow}
          startChat={startChat}
          navigate={navigate}
          parallax={parallax}
          synthesizedAura={synthesizedAura}
          handleHarmonize={handleHarmonize}
          followCounts={followCounts}
          setNetworkModal={setNetworkModal}
          postTotalCount={postTotalCount}
          repostTotalCount={repostTotalCount}
          setActiveTab={setActiveTab}
        />

        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} isCurrentUser={isCurrentUser} />

        <ProfileGrid displayPosts={displayPosts} setSelectedPost={setSelectedPost} />

      </div>

      {selectedPost && <PostOverlay post={selectedPost} onClose={() => setSelectedPost(null)} />}
      {networkModal.isOpen && <NetworkModal userId={profileUser.id} type={networkModal.type} onClose={() => setNetworkModal({ ...networkModal, isOpen: false })} />}
    </div>
  );
};

export default Profile;
