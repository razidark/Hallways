/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { validateFileSize, checkQuota, removeObjectAndGetSize } from '../lib/storageQuota';
import { sanitizeFilename } from '../lib/utils';

const StoryContext = createContext();

/**
 * StoryProvider: Manages the social story lifecycle (fetching, uploading, and viewing).
 */
export const StoryProvider = ({ children }) => {
  const { currentUser, updateStorageUsed } = useAuth();
  const [stories, setStories] = useState([]); // grouped by user
  const [activeStoryGroup, setActiveStoryGroup] = useState(null); // { userId, stories, currentIndex }
  const [uploading, setUploading] = useState(false);

  // Fetch all active (non-expired) stories grouped by user
  const fetchStories = useCallback(async () => {
    if (!currentUser) return;

    try {
      // 1. Fetch stories first (no join to avoid schema error)
      const { data: rawStories, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (storyError) {
        console.error('FETCH STORIES ERROR:', storyError);
        return;
      }

      if (!rawStories || rawStories.length === 0) {
        setStories([]);
        return;
      }

      // 2. Extract unique user IDs
      const userIds = [...new Set(rawStories.map(s => s.user_id))];

      // 3. Fetch profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, border_style, avatar_shape, role, is_verified')
        .in('id', userIds);

      if (profileError) {
        console.error('fetchStories error (profiles):', profileError);
        return;
      }

      // 4. Create a profile map for easy lookups
      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      // 5. Merge profile data into stories
      const data = rawStories.map(s => ({
        ...s,
        user: profileMap[s.user_id]
      }));

      // 6. Fetch which stories the current user has viewed
      const storyIds = data.map(s => s.id);
      let viewedIds = new Set();

      if (storyIds.length > 0) {
        const { data: views } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('viewer_id', currentUser.id)
          .in('story_id', storyIds);

        if (views) {
          viewedIds = new Set(views.map(v => v.story_id));
        }
      }

      // 7. Group stories by user
      const grouped = {};
      data.forEach(story => {
        const uid = story.user_id;
        if (!grouped[uid]) {
          grouped[uid] = {
            userId: uid,
            username: story.user?.username || 'user',
            avatar_url: story.user?.avatar_url,
            border_style: story.user?.border_style || 'normal',
            avatar_shape: story.user?.avatar_shape || 'hexagon',
            stories: [],
            allViewed: true
          };
        }
        const isViewed = viewedIds.has(story.id);
        grouped[uid].stories.push({ ...story, isViewed });
        if (!isViewed) grouped[uid].allViewed = false;
      });

      // 8. Sort: current user first, then unviewed, then viewed
      const groupedArray = Object.values(grouped);
      groupedArray.sort((a, b) => {
        if (a.userId === currentUser.id) return -1;
        if (b.userId === currentUser.id) return 1;
        if (a.allViewed && !b.allViewed) return 1;
        if (!a.allViewed && b.allViewed) return -1;
        return 0;
      });

      setStories(groupedArray);
    } catch (e) {
      console.error('fetchStories error:', e);
    }
  }, [currentUser]);

  // Upload a new story
  const createStory = async (file, caption = '', filterClass = '') => {
    if (!currentUser || !file) return { success: false, message: 'No file provided' };

    setUploading(true);
    try {
      // STORAGE GATE: Validate file size
      const sizeCheck = validateFileSize(file);
      if (!sizeCheck.valid) {
        setUploading(false);
        return { success: false, message: sizeCheck.message };
      }

      // STORAGE GATE: Check quota
      const quotaCheck = checkQuota(currentUser.storage_used, file.size);
      if (!quotaCheck.allowed) {
        setUploading(false);
        return { success: false, message: quotaCheck.message };
      }

      // 1. Upload to Supabase Storage
      const safeName = sanitizeFilename(file.name);
      const fileName = `${currentUser.id}_${Date.now()}_${safeName}`;
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(`${currentUser.id}/${fileName}`, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('STORY UPLOAD ERROR:', uploadError);
        setUploading(false);
        return { success: false, message: uploadError.message };
      }

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('stories')
        .getPublicUrl(`${currentUser.id}/${fileName}`);

      const mediaUrl = urlData.publicUrl;

      // 3. Insert story record with explicit 24h expiration
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const storyData = {
        user_id: currentUser.id,
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption,
        filter_class: filterClass,
        expires_at: expiresAt
      };

      let { error: insertError } = await supabase
        .from('stories')
        .insert([storyData]);

      if (insertError) {
        console.error('STORY INSERT ERROR (Primary):', insertError);
        console.warn('Primary story insert failed, attempting legacy fallback (image_url):', insertError.message);
        // Fallback: If media_url failed, try image_url for legacy schema support
        const { error: fallbackError } = await supabase.from('stories').insert([{
           user_id: currentUser.id,
           image_url: mediaUrl,
           media_type: mediaType,
           caption: caption,
           filter_class: filterClass,
           expires_at: expiresAt
        }]);
        
        if (fallbackError) console.error('STORY INSERT ERROR (Fallback):', fallbackError);
        insertError = fallbackError;
      }

      if (insertError) {
        setUploading(false);
        return { success: false, message: insertError.message };
      }

      // 4. Refresh stories & track storage
      await updateStorageUsed(file.size);
      
      // Delay slightly to ensure Supabase indexing is ready, then fetch
      setTimeout(async () => {
        await fetchStories();
        setUploading(false);
      }, 500);

      return { success: true };

    } catch (e) {
      console.error('createStory error:', e);
      setUploading(false);
      return { success: false, message: e.message };
    }
  };

  // Mark a story as viewed
  const markStoryViewed = async (storyId) => {
    if (!currentUser) return;
    try {
      await supabase
        .from('story_views')
        .upsert({
          story_id: storyId,
          viewer_id: currentUser.id
        }, { onConflict: 'story_id,viewer_id' });
    } catch (e) {
      console.error('markStoryViewed error:', e);
    }
  };

  // Delete own story
  const deleteStory = async (storyId) => {
    if (!currentUser) return { success: false };
    try {
      // Grab the media path first so we can free the real bytes afterwards.
      const { data: existing } = await supabase
        .from('stories')
        .select('media_url')
        .eq('id', storyId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', currentUser.id);

      if (error) return { success: false, message: error.message };

      // Remove the media and free its ACTUAL size (not a fixed guess).
      if (existing?.media_url && existing.media_url.includes('/stories/')) {
        const filePath = existing.media_url.split('/stories/').pop();
        if (filePath) {
          const freedBytes = await removeObjectAndGetSize('stories', filePath);
          if (freedBytes > 0) await updateStorageUsed(-freedBytes);
        }
      }

      await fetchStories();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // Open a story group (start viewing)
  const openStoryGroup = (group) => {
    // Find first unviewed story, or start from 0
    const startIndex = group.stories.findIndex(s => !s.isViewed);
    setActiveStoryGroup({
      ...group,
      currentIndex: startIndex >= 0 ? startIndex : 0
    });
  };

  // Navigate within story group
  const nextStory = () => {
    if (!activeStoryGroup) return;
    const nextIdx = activeStoryGroup.currentIndex + 1;
    
    if (nextIdx >= activeStoryGroup.stories.length) {
      // Move to next user's stories
      const currentGroupIdx = stories.findIndex(g => g.userId === activeStoryGroup.userId);
      const nextGroup = stories[currentGroupIdx + 1];
      if (nextGroup) {
        openStoryGroup(nextGroup);
      } else {
        closeStoryViewer();
      }
    } else {
      setActiveStoryGroup(prev => ({ ...prev, currentIndex: nextIdx }));
    }
  };

  const prevStory = () => {
    if (!activeStoryGroup) return;
    const prevIdx = activeStoryGroup.currentIndex - 1;
    
    if (prevIdx < 0) {
      // Move to previous user's stories
      const currentGroupIdx = stories.findIndex(g => g.userId === activeStoryGroup.userId);
      const prevGroup = stories[currentGroupIdx - 1];
      if (prevGroup) {
        setActiveStoryGroup({
          ...prevGroup,
          currentIndex: prevGroup.stories.length - 1
        });
      }
    } else {
      setActiveStoryGroup(prev => ({ ...prev, currentIndex: prevIdx }));
    }
  };

  const closeStoryViewer = () => {
    setActiveStoryGroup(null);
  };

  // Keep a ref to the latest fetchStories to avoid stale closures in setInterval
  const fetchStoriesRef = useRef(fetchStories);
  useEffect(() => {
    fetchStoriesRef.current = fetchStories;
  }, [fetchStories]);

  // Fetch on mount and periodically
  useEffect(() => {
    if (currentUser?.id) {
      fetchStoriesRef.current();
      const interval = setInterval(() => {
        fetchStoriesRef.current();
      }, 60000); // Refresh every 60s
      return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  return (
    <StoryContext.Provider value={{
      stories,
      activeStoryGroup,
      uploading,
      createStory,
      deleteStory,
      markStoryViewed,
      openStoryGroup,
      nextStory,
      prevStory,
      closeStoryViewer,
      fetchStories
    }}>
      {children}
    </StoryContext.Provider>
  );
};

// High-Fidelity Story Hook
export const useStories = () => {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoryProvider');
  }
  return context;
};
