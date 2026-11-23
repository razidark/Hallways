/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isOfflineDemoMode } from '../lib/supabaseClient';
import { MOCK_POSTS } from '../lib/mockData';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';
import { validateFileSize, checkQuota, removeObjectAndGetSize } from '../lib/storageQuota';
import { sanitizeFilename, isUserAdmin } from '../lib/utils';

const PostContext = createContext();

const PostProvider = ({ children }) => {
  const { createNotification, removeNotification } = useNotifications();
  const { currentUser, updateStorageUsed } = useAuth();

  const [posts, setPosts] = useState([]);
  const [globalPosts, setGlobalPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState('post');

  const openCreateModal = (type = 'post') => {
    setCreateModalType(type);
    setIsCreateModalOpen(true);
  };



  const fetchGlobalPosts = async () => {
    try {
      const { data } = await supabase
        .from('posts')
        .select('*, user:profiles(username, avatar_url, border_style, role, is_verified)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) setGlobalPosts(data);
    } catch (e) {
      console.error("fetchGlobalPosts error: ", e);
    }
  };

  const fetchPosts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (isOfflineDemoMode) {
      const saved = localStorage.getItem('hallways_demo_posts');
      const loadedPosts = saved ? JSON.parse(saved) : MOCK_POSTS;
      setPosts(loadedPosts);
      setGlobalPosts(loadedPosts);
      setLoading(false);
      return;
    }
    try {
      // 1. Fetch posts with ALL possible relations
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(username, avatar_url, border_style, role, is_verified),
          likes:likes(user_id),
          saves:saves(user_id),
          comments:comments(
            *,
            user:profiles(username, avatar_url, border_style, avatar_shape, role, is_verified),
            parent_id
          ),
          repost:repost_id(
            *,
            user:profiles(username, avatar_url, border_style, role, is_verified)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        const formattedPosts = data.map(post => {
          // Resilient Repost Extraction
          let repostData = null;
          if (post.repost) {
            const rawRepost = Array.isArray(post.repost) ? post.repost[0] : post.repost;
            if (rawRepost) {
              repostData = {
                ...rawRepost,
                image: rawRepost.image_url,
                user: {
                  username: rawRepost.user?.username || 'user',
                  avatar: rawRepost.user?.avatar_url,
                  borderStyle: rawRepost.user?.border_style || 'normal'
                }
              };
            }
          }

          return {
            ...post,
            image: post.image_url,
            user: { 
              username: post.user?.username || 'user', 
              avatar: post.user?.avatar_url,
              borderStyle: post.user?.border_style || 'normal'
            },
            likes: post.likes?.length || 0,
            isLiked: post.likes?.some(like => like.user_id === currentUser?.id) || false,
            isSaved: post.saves?.some(save => save.user_id === currentUser?.id) || false,
            repost: repostData,
            comments: (post.comments || []).map(c => ({
              ...c,
              user: {
                username: c.user?.username || 'user',
                avatar: c.user?.avatar_url,
                borderStyle: c.user?.border_style || 'normal',
                avatarShape: c.user?.avatar_shape || 'hexagon'
              }
            }))
          };
        });
        setPosts(formattedPosts);
      }
    } catch (err) {
      console.error('Core fetchPosts Error (Attempting minimal recovery):', err);
      // Minimal recovery select to at least show SOMETHING
      const { data: minimal } = await supabase
        .from('posts')
        .select('*, user:profiles(username, avatar_url, role, is_verified)')
        .limit(20);
      
      if (minimal) {
        setPosts(minimal.map(p => ({
          ...p,
          image: p.image_url,
          user: { username: p.user?.username || 'user', avatar: p.user?.avatar_url },
          likes: 0,
          isLiked: false,
          comments: []
        })));
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const addPost = async (file, caption, filterClass = "", type = "post", musicData = null) => {
    if (!currentUser) return { success: false, message: "Not authenticated" };

    try {
      let publicUrl = "";
      let uploadedFileSize = 0;

      if (typeof file === 'object' && file !== null) {
        // STORAGE GATE: Validate file size
        const sizeCheck = validateFileSize(file);
        if (!sizeCheck.valid) return { success: false, message: sizeCheck.message };

        // STORAGE GATE: Check quota
        const quotaCheck = checkQuota(currentUser.storage_used, file.size);
        if (!quotaCheck.allowed) return { success: false, message: quotaCheck.message };

        uploadedFileSize = file.size;
        const safeFileName = sanitizeFilename(file.name);
        const fileName = `${Date.now()}_${safeFileName}`;
        const { error: uploadError } = await supabase.storage.from('posts').upload(`${currentUser.id}/${fileName}`, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl: url } } = supabase.storage.from('posts').getPublicUrl(`${currentUser.id}/${fileName}`);
        publicUrl = url;
      } else {
        publicUrl = file;
      }

      const postPayload = {
        user_id: currentUser.id,
        image_url: publicUrl,
        caption,
        filter_class: filterClass,
        music: musicData?.title ? `${musicData.artist} - ${musicData.title}` : "Original Audio",
        music_url: musicData?.preview_url || "",
        is_reel: type === "reel"
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([postPayload])
        .select()
        .single();

      if (error) throw error;
      
      // Track storage usage for file uploads
      if (uploadedFileSize > 0) {
        await updateStorageUsed(uploadedFileSize);
      }

      fetchPosts();
      return { success: true, data };
    } catch (err) {
      console.error('AddPost Error:', err);
      return { success: false, message: err.message };
    }
  };

  const toggleLike = async (postId) => {
    if (!currentUser) return;
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const isLiking = !post.isLiked;

    // 1. Optimistic Update
    const updatedPosts = [...posts];
    updatedPosts[postIndex] = {
      ...post,
      isLiked: isLiking,
      likes: isLiking ? post.likes + 1 : Math.max(0, post.likes - 1)
    };
    setPosts(updatedPosts);

    // 2. Database Sync
    try {
      if (!isLiking) {
        await supabase.from('likes').delete().match({ post_id: postId, user_id: currentUser.id });
        removeNotification('like', post.user_id, postId);
      } else {
        await supabase.from('likes').insert([{ post_id: postId, user_id: currentUser.id }]);
        createNotification('like', post.user_id, postId);
      }
      // Silent sync to ensure reality matches
      fetchPosts(true);
    } catch (err) {
      console.error('Like Sync Error:', err);
      // Rollback on error
      setPosts(posts); 
    }
  };

  const toggleSavePost = async (postId) => {
    if (!currentUser) return;
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const isSaving = !post.isSaved;

    // 1. Optimistic Update
    const updatedPosts = [...posts];
    updatedPosts[postIndex] = {
      ...post,
      isSaved: isSaving
    };
    setPosts(updatedPosts);

    // 2. Database Sync
    try {
      if (!isSaving) {
        await supabase.from('saves').delete().match({ post_id: postId, user_id: currentUser.id });
      } else {
        await supabase.from('saves').insert([{ post_id: postId, user_id: currentUser.id }]);
      }
      fetchPosts(true);
    } catch (err) {
      console.error('Save Sync Error:', err);
      setPosts(posts); // Rollback
    }
  };

  const addComment = async (postId, text, parentId = null) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const { error } = await supabase
      .from('comments')
      .insert([{
        post_id: postId,
        user_id: currentUser.id,
        content: text,
        parent_id: parentId
      }]);

    if (!error) {
      createNotification('comment', post.user_id, postId);
      fetchPosts(true);
    }
  };

  const deleteComment = async (commentId) => {
    if (!currentUser) return;
    const { error } = await supabase.from('comments').delete().match({ id: commentId, user_id: currentUser.id });
    if (!error) fetchPosts(true);
  };

  // Only these fields may be changed through updatePost. Passing an
  // arbitrary object straight to .update() let a caller set user_id
  // (moving the post to another account) or other server-side fields.
  const EDITABLE_POST_FIELDS = ['caption', 'music', 'music_url'];

  const updatePost = async (postId, updates) => {
    if (!currentUser) return { success: false, message: 'Login required' };

    // Ownership check on the client. The database has the owner-scoped
    // UPDATE policy, but without this the request is sent, updates zero
    // rows, and the UI reports it as a success.
    const target = posts.find(p => p.id === postId);
    if (!target) return { success: false, message: 'Post not found' };
    if (target.user_id !== currentUser.id && !isUserAdmin(currentUser)) {
      return { success: false, message: 'You can only edit your own posts' };
    }

    const patch = {};
    for (const key of EDITABLE_POST_FIELDS) {
      if (updates && Object.prototype.hasOwnProperty.call(updates, key)) {
        patch[key] = updates[key];
      }
    }
    if (Object.keys(patch).length === 0) {
      return { success: false, message: 'Nothing to update' };
    }

    const { data, error } = await supabase
      .from('posts')
      .update(patch)
      .eq('id', postId)
      .select('id');
    if (error) return { success: false, message: error.message };
    // No row returned means the policy rejected it (or the post is gone).
    if (!data || data.length === 0) {
      return { success: false, message: 'You can only edit your own posts' };
    }

    fetchPosts(true);
    return { success: true };
  };

  const togglePinPost = async (postId) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post || post.user_id !== currentUser.id) return;
    await supabase.from('posts').update({ is_pinned: !post.is_pinned }).eq('id', postId);
    fetchPosts();
  };

  const repostPost = async (postId) => {
    if (!currentUser) return { success: false, message: "Login required" };
    
    // Prevent reposting own posts
    const originalPost = posts.find(p => p.id === postId);
    if (originalPost?.user_id === currentUser.id) {
      return { success: false, message: "Cannot repost your own post." };
    }
    
    // Check for duplicate reposts
    const { data: existingRepost } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('repost_id', postId)
      .single();
    
    if (existingRepost) {
      return { success: false, message: "Already reposted." };
    }
    
    const { error } = await supabase
      .from('posts')
      .insert([{
        user_id: currentUser.id,
        repost_id: postId,
        image_url: originalPost.image_url,
        caption: "",
        is_reel: originalPost.is_reel || false,
        filter_class: originalPost.filter_class || "",
        music: originalPost.music,
        music_url: originalPost.music_url
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Repost Error:', error);
      return { success: false, message: error.message };
    }
    
    fetchPosts();
    if (originalPost) {
      createNotification('repost', originalPost.user_id, postId);
    }
    return { success: true };
  };

  const deletePost = async (postId) => {
    // 1. Manually cascade delete relations to prevent Foreign Key blocks & orphaned data.
    //    These deletes are RLS-scoped to the row owner, so a normal user
    //    cannot remove the likes and comments that OTHER users left on
    //    their own post -- those rows would survive and keep the post
    //    visible in other people's feeds. The server-side cascade handles
    //    the rest; this is only a best-effort client cleanup.
    await supabase.from('likes').delete().eq('post_id', postId);
    await supabase.from('saves').delete().eq('post_id', postId);
    await supabase.from('comments').delete().eq('post_id', postId);
    await supabase.from('notifications').delete().eq('target_id', postId);
    
    // 2. Identify the image path to be scrubbed
    const targetPost = posts.find(p => p.id === postId);
    
    // 3. Delete the post record itself.
    //    .select() tells us whether a row was actually removed: a 204 with
    //    no rows means RLS rejected the delete, which must not be reported
    //    as a success.
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .select('id');
    
    if (!error && data && data.length > 0) {
      // 4. Scrub the image from the bucket & free storage.
      //    Read the real object size BEFORE removing it, so the quota counter
      //    reflects actual bytes instead of a fixed guess.
      if (targetPost && targetPost.image_url && targetPost.image_url.includes('/posts/')) {
         const filePath = targetPost.image_url.split('/posts/').pop(); // Extract user_id/filename
         if (filePath) {
           const freedBytes = await removeObjectAndGetSize('posts', filePath);
           if (freedBytes > 0) {
             await updateStorageUsed(-freedBytes);
           }
         }
      }
      
      fetchPosts();
      return { success: true };
    }
    return { success: false, message: error.message };
  };

  const fetchPostById = useCallback(async (postId) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(username, avatar_url, border_style, role, is_verified),
          likes:likes(user_id),
          saves:saves(user_id),
          comments:comments(
            *,
            user:profiles(username, avatar_url, border_style, avatar_shape, role, is_verified),
            parent_id
          ),
          repost:repost_id(
            *,
            user:profiles(username, avatar_url, border_style, role, is_verified)
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      if (data) {
        let repostData = null;
        if (data.repost) {
          const rawRepost = Array.isArray(data.repost) ? data.repost[0] : data.repost;
          if (rawRepost) {
            repostData = {
              ...rawRepost,
              image: rawRepost.image_url,
              user: {
                username: rawRepost.user?.username || 'user',
                avatar: rawRepost.user?.avatar_url,
                borderStyle: rawRepost.user?.border_style || 'normal'
              }
            };
          }
        }

        return {
          ...data,
          image: data.image_url,
          user: { 
            username: data.user?.username || 'user', 
            avatar: data.user?.avatar_url,
            borderStyle: data.user?.border_style || 'normal'
          },
          likes: data.likes?.length || 0,
          isLiked: data.likes?.some(like => like.user_id === currentUser?.id) || false,
          isSaved: data.saves?.some(save => save.user_id === currentUser?.id) || false,
          repost: repostData,
          comments: (data.comments || []).map(c => ({
            ...c,
            user: {
              username: c.user?.username || 'user',
              avatar: c.user?.avatar_url,
              borderStyle: c.user?.border_style || 'normal',
              avatarShape: c.user?.avatar_shape || 'hexagon'
            }
          }))
        };
      }
    } catch (err) {
      console.error('fetchPostById Error:', err);
    }
    return null;
  }, [currentUser]);

  const trendingTags = React.useMemo(() => {
    const counts = {};
    globalPosts.forEach(post => {
      if (post.caption) {
        const matches = post.caption.match(/#\w+/g);
        if (matches) {
          matches.forEach(tag => {
            const normalized = tag.toLowerCase();
            counts[normalized] = (counts[normalized] || 0) + 1;
          });
        }
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 5);
  }, [globalPosts]);

  useEffect(() => {
    fetchPosts();
    fetchGlobalPosts();
  }, [currentUser, fetchPosts]);

  return (
    <PostContext.Provider value={{ 
      posts, 
      globalPosts,
      fetchGlobalPosts,
      loading,
      toggleLike, 
      toggleSavePost,
      addComment, 
      deleteComment,
      updatePost,
      deletePost,
      repostPost,
      togglePinPost,
      isCreateModalOpen, 
      setIsCreateModalOpen, 
      createModalType,
      setCreateModalType,
      openCreateModal,
      addPost,
      fetchPostById,
      trendingTags
    }}>
      {children}
    </PostContext.Provider>
  );
};

const usePosts = () => useContext(PostContext);
export { PostProvider, usePosts };
