# Hallways — Architecture Documentation

## Overview

Hallways is a full-stack social media platform built on **React + Vite** frontend with **Supabase** backend. It features real-time messaging, stories, notifications, and an immersive glassmorphism UI with a hexagonal identity system.

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser / Client                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Auth Pages  │  │  Main Feed   │  │  Modals/Overlays │  │
│  │  (Login,     │  │  (Home,      │  │  (Create Post,   │  │
│  │   Signup,    │  │   Explore,   │  │   Story Viewer,  │  │
│  │   Reset PW)  │  │   Profile)   │  │   Chat, Themes)  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │            │
│         └─────────────────┼────────────────────┘            │
│                           │                                 │
│                    ┌──────┴──────┐                          │
│                    │  Supabase   │                          │
│                    │  Client SDK │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────┼─────────────────────────────────┐
│                    ┌──────┴──────┐                          │
│                    │  Supabase   │                          │
│                    │  Services   │                          │
│  ┌────────────────┼─────────────┼──────────────────────┐   │
│  │                │             │                       │   │
│  │  ┌──────────┐  │  ┌──────────┐  ┌────────────────┐  │   │
│  │  │ Auth     │  │  │Database  │  │   Realtime     │  │   │
│  │  │ Service  │  │  │PostgreSQL│  │   Subscriptions│  │   │
│  │  └──────────┘  │  └──────────┘  └────────────────┘  │   │
│  │                │                                     │   │
│  │  ┌──────────┐  │  ┌──────────┐  ┌────────────────┐  │   │
│  │  │ Storage  │  │  │ Edge     │  │   Row Level    │  │   │
│  │  │ Buckets  │  │  │Functions │  │   Security     │  │   │
│  │  └──────────┘  │  └──────────┘  └────────────────┘  │   │
│  └────────────────┴─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite 8 | SPA with fast HMR and optimized builds |
| **Routing** | React Router v7 | Client-side routing with lazy loading |
| **Icons** | Lucide React | Consistent SVG icon system |
| **Styling** | Vanilla CSS (HSL vars) | Glassmorphism with dynamic theming |
| **Backend** | Supabase (BaaS) | Auth, Database, Realtime, Storage |
| **Database** | PostgreSQL | Relational data with Row Level Security |
| **Real-time** | Supabase Realtime | WebSocket subscriptions for live updates |
| **Auth** | Supabase Auth | Email/password, session management |
| **Audio** | Web Audio API | UI sound effects (clicks, pops, chimes) |

---

## Project Structure

```
src/
├── main.jsx                 # Entry point, providers setup
├── App.jsx                  # Root component, routing, auth gate
├── index.css                # Central CSS bridge
├── styles/                  # CSS modules
│   ├── base.css             # Variables, globals, themes
│   ├── nav.css              # Sidebar, mobile nav, docks
│   ├── identity.css         # Hex clips, frames, auras
│   ├── discovery.css        # Reels, explore grid, stories
│   ├── components.css       # Posts, suggestions, modals
│   └── settings.css         # Settings page styles
├── components/              # Reusable UI components
│   ├── Avatar.jsx           # Hexagonal avatar system
│   ├── Post.jsx             # Feed post card (~600 lines)
│   ├── Sidebar.jsx          # Navigation sidebar
│   ├── PostOverlay.jsx      # Post detail overlay
│   ├── CreatePostModal.jsx  # Post/reel creation modal
│   ├── StoryCarousel.jsx    # Story ring carousel
│   ├── StoryViewer.jsx      # Full-screen story viewer
│   ├── FloatingChat.jsx     # Floating chat widget
│   ├── SearchOverlay.jsx    # User search panel
│   ├── NotificationsOverlay.jsx # Notifications panel
│   ├── ThemeEngineModal.jsx # Theme customization
│   ├── ThemePanel.jsx       # Theme quick panel
│   ├── MobileNav.jsx        # Mobile bottom navigation
│   ├── CreationHub.jsx      # Quick creation hub
│   ├── NetworkModal.jsx     # Followers/following modal
│   ├── MediaViewer.jsx      # Media lightbox
│   ├── MusicSearch.jsx      # Music track search
│   ├── Suggestions.jsx      # User suggestions sidebar
│   ├── SplashScreen.jsx     # Animated launch screen
│   ├── ToastContainer.jsx   # Toast notifications
│   ├── ErrorBoundary.jsx    # React error boundary
│   ├── VerifiedBadge.jsx    # Verification badge
│   ├── AdminBadge.jsx       # Glowing Admin/Overseer shield badge
│   ├── EditProfileModal.jsx # Profile editor
│   ├── profile/             # Profile page sub-components
│   └── skeleton/            # Loading skeleton components
├── context/                 # React Context providers
│   ├── AuthContext.jsx      # Auth state, login, signup, profile
│   ├── PostContext.jsx      # Posts CRUD, likes, comments, reposts
│   ├── MessageContext.jsx   # Real-time messaging (Whispers)
│   ├── NotificationContext.jsx # Notification system (Pulse)
│   ├── StoryContext.jsx     # Story lifecycle management
│   ├── ThemeContext.jsx     # Theme/mode management
│   ├── UIContext.jsx        # UI state (overlays, modals, toasts)
│   └── AudioContext.jsx     # Web Audio sound effects
├── pages/                   # Route pages
│   ├── Home.jsx             # Main feed page
│   ├── Explore.jsx          # Discover grid
│   ├── Reels.jsx            # Vertical video feed
│   ├── Profile.jsx          # User profile
│   ├── Messages.jsx         # Full messaging page
│   ├── Global.jsx           # Global strand feed
│   ├── Notifications.jsx    # Full notifications page
│   ├── Settings.jsx         # Account settings
│   ├── HelpPage.jsx         # Help/documentation
│   ├── Login.jsx            # Auth pages
│   ├── ResetPassword.jsx    # Password reset
│   ├── Admin.jsx            # Admin console (Overseer console)
│   └── NotFound.jsx         # 404 page
└── lib/                     # Utility modules
    ├── supabaseClient.js    # Supabase client init
    ├── utils.js             # Shared utilities
    └── storageQuota.js      # Storage quota validation
```

---

## Context Architecture

### Provider Tree (in order)

```
AudioProvider         ← Sound effects engine
  ThemeProvider       ← Dynamic themes & light/dark mode
    NotificationProvider  ← Real-time notifications (Pulse)
      AuthProvider    ← Auth state, profile CRUD
        MessageProvider   ← Real-time messaging (Whispers)
          PostProvider    ← Posts, likes, comments, reposts
            UIProvider    ← Overlays, modals, toasts
              StoryProvider   ← Story lifecycle
                MainApp   ← Routes & app shell
```

### Data Flow

```
User Action → Context.setState() (Optimistic)
           → Database mutation (Supabase)
           → Realtime event (if applicable)
           → Context sync (fetchPosts(true))
```

---

## Key Features

### 1. Hexagonal Identity System
- Custom `clip-path` for hexagonal avatars
- Premium identity frames (Cyber, Royalty, Void)
- Dynamic auras with HSL gradients

### 2. Real-time Messaging (Whispers)
- Supabase Realtime subscriptions (CDC)
- Optimistic message sending
- Media uploads (images/videos)
- Read receipts, edit, delete

### 3. Stories (The Eternal Loop)
- 24-hour ephemeral content
- Auto-advancing viewer with progress bars
- View tracking
- Atmospheric blur background

### 4. Notification System (Pulse)
- Real-time push via Supabase Realtime
- Types: like, comment, follow, repost, message
- Grouped by actor with batched profile queries

### 5. Theme Engine
- Cyber-Aurora glassmorphism design system
- HSL variable tokens for dynamic theming
- Multiple accent color presets
- Dark/light mode toggle

---

## Database Schema

<details>
<summary>Click to expand SQL schema</summary>

```sql
-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  status TEXT,
  status_title TEXT,
  profile_aura TEXT DEFAULT 'nebula',
  border_style TEXT DEFAULT 'normal',
  avatar_shape TEXT DEFAULT 'hexagon',
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  image_url TEXT,
  caption TEXT,
  filter_class TEXT DEFAULT '',
  is_reel BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  music TEXT,
  music_url TEXT,
  repost_id UUID REFERENCES posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

-- Saves
CREATE TABLE saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(follower_id, following_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  is_edited BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  target_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  media_url TEXT,
  image_url TEXT,
  media_type TEXT DEFAULT 'image',
  caption TEXT,
  filter_class TEXT DEFAULT '',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story Views
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(story_id, viewer_id)
);
```
</details>

---

## Deployment

### Vercel (Frontend)

1. Connect GitHub repository to Vercel
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build command: `npm run build`
4. Output directory: `dist`

### Supabase (Backend)

1. Create a new Supabase project
2. Run the database schema SQL
3. Enable Realtime for: `messages`, `notifications`
4. Set up Auth settings:
   - Add site URL to redirect config
   - Configure email templates
5. Create storage buckets: `avatars`, `posts`, `stories`, `messages`
6. Enable Row Level Security policies

---

## Performance Optimizations

- **Route-level code splitting** with `React.lazy` and `Suspense`
- **Optimistic UI** updates for likes, saves, comments
- **Silent background sync** (`fetchPosts(true)`) to avoid loading spinners
- **Batch queries** for actor profiles in notifications (N+1 fixed)
- **Manual Vite chunk splitting** (react, supabase, icons)
- **Shimmer loading skeletons** for feed and profile
- **Intersection Observer** for reel auto-play/pause