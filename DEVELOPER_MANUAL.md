# 📖 Hallway Developer Manual: The Blueprints

Welcome to the internal engineering manual for the Hallway platform. This document defines the core architecture, data patterns, and design principles used to maintain "Reality Sync" across the corridor.

---

## 🏗 Sector 1: Identity & Security
**Location**: `src/context/AuthContext.jsx` | `src/components/Avatar.jsx`

The Hallway uses a custom Identity system backed by Supabase Auth.
- **Profiles**: The `profiles` table stores extended metadata (bio, username, and the unique `border_style`).
- **Hexagonal Geometry**: We use a custom `clip-path` system instead of standard circular avatars. Every avatar in the system must use the `<Avatar />` component to ensure geometric consistency.
- **Identity Frames**: Premium frames (Cyber, Royalty, Void) are CSS-driven via HSL gradients applied to the hexagonal wrapper.

## 📡 Sector 2: The Data Mesh (Posts & Feed)
**Location**: `src/context/PostContext.jsx` | `src/components/Post.jsx`

The feed is a real-time reactive grid.
- **Optimistic UI**: Interactions like `toggleLike` and `toggleSavePost` update the local state *immediately* before database confirmation. This eliminates "lag" and prevents the scroll position from jumping.
- **Silent Sync**: `fetchPosts(true)` allows the app to refresh data in the background without triggering global loading spinners, preserving user scroll depth.
- **Global Strands**: A dedicated stream for high-traffic public posts, separated from the primary follow-feed.

## 💬 Sector 3: Real-time Comms (The Courier)
**Location**: `src/context/MessageContext.jsx` | `src/components/FloatingChat.jsx`

Messaging utilizes Supabase Realtime (PostgreSQL CDC).
- **Subscription**: The `MessageContext` listens for `INSERT` events on the `messages` table for the active user.
- **Media Support**: Whispers now support high-fidelity media uploads (images/videos) and native emoji expressions.
- **Zero-Blank Policy**: All messaging views must handle the empty state ("Your corridor is silent") to avoid rendering blank screens.

## 💓 Sector 4: The Pulse System (Notifications)
**Location**: `src/context/NotificationContext.jsx`

Global events are broadcast through the Pulse system.
- **Broadcasting**: Any social action (Like, Comment, Repost) triggers a `createNotification` event.
- **Aesthetics**: Notifications are rendered with high `z-index` (5000+) to ensure they float above all other modals and overlays.

## 🎨 Sector 5: The Aesthetic Engine
**Location**: `src/index.css` | `src/context/ThemeContext.jsx`

The Hallway is built on a **Glassmorphism & HSL** token system.
- **Variables**: Instead of hex codes, we use `var(--accent-color)` and HSL triplets to allow for dynamic opacity (`rgba(var(--accent-color-rgb), 0.1)`).
- **The Corridor Grid**: A multi-column glass layout consisting of a fixed Sidebar, a scrollable main feed, and a floating Suggestions column.
- **Hex Utility**: The `.hexagon-shape` CSS utility is the source of truth for all project clip-paths.

## 🪟 Sector 6: Overlay Architecture
**Location**: `src/context/UIContext.jsx`

Modals are treated as "Fragments" or "Overlays" that sit atop the Corridor.
- **State-based Rendering**: Search, Create, and Settings are controlled via `activeOverlay` state.
- **Backdrop Blur**: All overlays use a minimum of `40px` backdrop filter to maintain the immersive "glass" feel.

---

### 🛡️ Core Directives for Future Workers
1. **Never unmount the Corridor**: When possible, use overlays instead of page navigations to keep the user immersed in their scroll position.
2. **Sync Optimistically**: Always update the local state before the database.
3. **Respect the Geometry**: All new UI components should follow the hexagonal or rounded-rect (40px) design tokens.
4. **Speak the Lore**: In-app copy should use "Lore terms" (Corridor, Pulse, Identity, Strands) to maintain the brand aura.

---

## 🎞️ Sector 7: The Eternal Loop (Stories)
**Location**: `src/context/StoryContext.jsx` | `src/components/StoryViewer.jsx`

Stories provide transient, 24-hour visual updates.
- **Expiration**: Stories are automatically filtered by `expires_at` during fetch.
- **Resilient Schema**: Uses a dual-column fallback (`media_url` and `image_url`) to ensure data integrity across database migrations.
- **Atmospheric Backwash**: The `StoryViewer` uses a blurred, saturated version of the story media as a dynamic background layer to maintain immersion.

---

## 🛡️ Sector 8: Administrative Console & Overseer HUD
**Location**: `src/pages/Admin.jsx` | `src/components/AdminBadge.jsx` | `src/lib/utils.js`

The administrative panel governs the corridor's metrics and identity permissions.
- **Access Guard**: The `/admin` route is mapped inside `App.jsx` and protected by a double-layer guard. Access is allowed only for authenticated accounts whose role is recognized by `isUserAdmin(user)`.
- **System Overseer badge**: Admins display a glowing pink-red shield (`AdminBadge`) next to their usernames in profiles, feeds, suggestions, and searches.
- **Promotions & Privileges**: The Overseer Console enables admins to promote other user accounts to `admin` role or demote them to standard `user` status, persisting changes to Supabase via modified RLS update permissions.
- **Moderation Override**: Admins see a "Delete Post (Admin)" override in options menus of any post, bypassing standard ownership-only delete permissions.

---
*Operational Protocol v2.3.0*
