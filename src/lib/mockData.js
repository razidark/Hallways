// High-quality mock data for Hallways Offline Demo Mode
export const MOCK_USER = {
  id: 'demo_user_rzl_001',
  username: 'razor_developer',
  full_name: 'Razor RZL',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  bio: '⚡ Building state-of-the-art apps with Antigravity AI | Glassmorphism Fanatic',
  status: 'online',
  status_title: 'Architecting Monorepos',
  profile_aura: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
  border_style: 'neon',
  avatar_shape: 'hexagon',
  storage_used: 1250000
};

export const MOCK_POSTS = [
  {
    id: 'mock_post_1',
    user_id: 'demo_user_rzl_001',
    caption: 'Quantum glass design system initialized across all 13 workspace applications! 🚀 #Antigravity #WebDesign #UIUX',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
    filter_class: 'saturate',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    likes: 42,
    isLiked: true,
    isSaved: true,
    music: 'Lorn - Acid Rain',
    music_url: '',
    user: {
      username: 'razor_developer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      borderStyle: 'neon'
    },
    comments: [
      {
        id: 'comment_1',
        content: 'This glassmorphic aesthetic looks insanely clean!',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        user: {
          username: 'cyber_artist',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          borderStyle: 'gold',
          avatarShape: 'circle'
        }
      }
    ]
  },
  {
    id: 'mock_post_2',
    user_id: 'user_002',
    caption: 'Exploring deep synthwave textures for Melody Sketcher 🎹✨ #MusicProd #Synth',
    image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80',
    filter_class: 'cyber',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    likes: 28,
    isLiked: false,
    isSaved: false,
    music: 'Kavinsky - Nightcall',
    music_url: '',
    user: {
      username: 'synth_master',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      borderStyle: 'fire'
    },
    comments: []
  },
  {
    id: 'mock_post_3',
    user_id: 'user_003',
    caption: 'Crimson Descent Level 4 boss room complete! Ready for playtesting 🔥🎮 #IndieDev #Gaming',
    image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
    filter_class: '',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    likes: 95,
    isLiked: true,
    isSaved: false,
    music: 'Mick Gordon - BFG 10000',
    music_url: '',
    user: {
      username: 'pixel_slayer',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      borderStyle: 'rainbow'
    },
    comments: []
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif_1',
    type: 'like',
    actor: {
      username: 'cyber_artist',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
    },
    created_at: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 'notif_2',
    type: 'follow',
    actor: {
      username: 'pixel_slayer',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
    },
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];
