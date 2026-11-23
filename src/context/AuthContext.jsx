/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isOfflineDemoMode } from '../lib/supabaseClient';
import { MOCK_USER } from '../lib/mockData';
import { validateFileSize, checkQuota, removeObjectAndGetSize } from '../lib/storageQuota';
import { getDynamicAvatarUrl } from '../lib/utils';
import { validateUsername, friendlyAuthError } from '../lib/validation';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const setSession = async (session) => {
    try {
      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        // Safety Sync: ONLY create profile if it's explicitly MISSING (PGRST116)
        // If it's a generic error (timeout, network), we wait for the next sync
        if (profileError && profileError.code === 'PGRST116') {
          console.log("Identity not found, forging new profile...");
          const username = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User';
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              username: username,
              full_name: session.user.user_metadata?.full_name || username,
              avatar_url: getDynamicAvatarUrl(username),
              bio: 'Synchronizing with Hallway...'
            })
            .select()
            .single();
          
          if (newProfile) {
            // Re-fetch or use newProfile
            const identity = { ...session.user, ...newProfile };
            setCurrentUser(identity);
          }
        } else if (profile) {
          // Normal hydration
          const identity = {
            ...session.user,
            ...profile,
            avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url,
            username: profile.username || session.user.user_metadata?.username
          };
          setCurrentUser(identity);
        } else {
          // Error occurred but profile might exist, fallback to metadata for now to keep UI alive
          setCurrentUser({ ...session.user, ...session.user.user_metadata });
        }
        
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error("Session hydration error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOfflineDemoMode) {
      const savedUser = localStorage.getItem('hallways_demo_user');
      const user = savedUser ? JSON.parse(savedUser) : MOCK_USER;
      setCurrentUser(user);
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    return { success: true };
  };

  const signup = async (email, password, username, fullName) => {
    // 0. Validate the username BEFORE touching the database.
    //    Usernames are unique and user-chosen, so a bad or taken name must fail
    //    fast with a readable message rather than a raw Postgres error.
    const validation = validateUsername(username);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const cleanUsername = validation.username;

    // 1. Auth Signup
    const { user, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername,
          full_name: fullName
        }
      }
    }).then(res => ({ user: res.data?.user, error: res.error }));

    if (error) {
      return { success: false, message: friendlyAuthError(error) };
    }

    // 2. Profile Creation (usually handled by DB Trigger, but explicit here for safety).
    //    If the username was taken between the check above and now, the insert
    //    fails with a unique-violation. Surface that as a clear message AND
    //    clean up the auth user we just created, so the account is not left
    //    half-made (an auth user with no profile can never log in properly).
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: cleanUsername,
        full_name: fullName,
        avatar_url: getDynamicAvatarUrl(cleanUsername),
        bio: 'Just joined Hallway! Excited to connect.'
      });

    if (profileError) {
      console.error("Profile Error:", profileError);

      const isDuplicate = profileError.code === '23505'
        || /duplicate key|already exists/i.test(profileError.message || '');

      if (isDuplicate && user?.id) {
        // Remove the orphaned auth account so the email is free to retry with.
        await supabase.auth.admin?.deleteUser?.(user.id).catch?.(() => {});
        try {
          await supabase.from('profiles').delete().eq('id', user.id);
        } catch { /* best effort cleanup */ }
        return {
          success: false,
          message: `The username "${cleanUsername}" is already taken. Pick another one.`
        };
      }

      return {
        success: false,
        message: 'Your account was created but the profile could not be set up. Please try again.'
      };
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.clear(); // Nuke all cached Supabase tokens
    window.location.href = '/'; // Hard reload to clear all React Context memory
  };

  const updateProfile = async (updates, skipMetadataSync = false) => {
    if (!currentUser) return { success: false };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', currentUser.id);

    if (error) return { success: false, message: error.message };
    
    // REDUNDANCY SYNC: Pass key updates to Auth Metadata
    if (!skipMetadataSync) {
      const metadataUpdates = {};
      if (updates.avatar_url) metadataUpdates.avatar_url = updates.avatar_url;
      if (updates.username) metadataUpdates.username = updates.username;
      if (updates.full_name) metadataUpdates.full_name = updates.full_name;
      if (updates.status_title) metadataUpdates.status_title = updates.status_title;
      if (updates.status) metadataUpdates.status = updates.status;
      if (updates.profile_aura) metadataUpdates.profile_aura = updates.profile_aura;
      if (updates.border_style) metadataUpdates.border_style = updates.border_style;
      if (updates.avatar_shape) metadataUpdates.avatar_shape = updates.avatar_shape;
      
      if (Object.keys(metadataUpdates).length > 0) {
        await supabase.auth.updateUser({ data: metadataUpdates });
      }
    }

    setCurrentUser(prev => ({ ...prev, ...updates }));
    return { success: true };
  };

  // STORAGE QUOTA: Update the user's tracked storage usage
  const updateStorageUsed = async (delta) => {
    if (!currentUser) return;
    try {
      const newUsed = Math.max(0, (currentUser.storage_used || 0) + delta);
      await supabase.from('profiles').update({ storage_used: newUsed }).eq('id', currentUser.id);
      setCurrentUser(prev => ({ ...prev, storage_used: newUsed }));
    } catch (e) {
      console.warn('Storage tracking unavailable:', e.message);
    }
  };

  const uploadAvatar = async (file, skipMetadataSync = false) => {
    if (!currentUser) return { success: false };

    // STORAGE GATE: Validate file size
    const sizeCheck = validateFileSize(file);
    if (!sizeCheck.valid) return { success: false, message: sizeCheck.message };

    // STORAGE GATE: Check quota
    const quotaCheck = checkQuota(currentUser.storage_used, file.size);
    if (!quotaCheck.allowed) return { success: false, message: quotaCheck.message };
    
    // Extract extension or default to png
    const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'avatar.png';
    const fileName = `${currentUser.id}_${Date.now()}_${safeName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) return { success: false, message: uploadError.message };

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Remove the PREVIOUS avatar so replacing an avatar does not leave the
    // old file behind forever (the bucket key is unique per upload).
    // Only our own file, and only when it is in the avatars bucket.
    const previousUrl = currentUser.avatar_url;
    if (previousUrl && previousUrl.includes('/avatars/')) {
      const previousPath = previousUrl.split('/avatars/').pop();
      if (previousPath && previousPath.startsWith(`${currentUser.id}_`)) {
        const freedBytes = await removeObjectAndGetSize('avatars', previousPath);
        if (freedBytes > 0) await updateStorageUsed(-freedBytes);
      }
    }

    // Track storage usage
    await updateStorageUsed(file.size);

    // CRITICAL: Mirror to Auth Metadata immediately for cross-browser sync
    // ONLY if it's an actual avatar (not a banner or other file)
    if (!skipMetadataSync) {
      await supabase.auth.updateUser({ 
        data: { avatar_url: publicUrl } 
      });
    }

    return { success: true, publicUrl };
  };

  const getPublicProfile = async (username) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) return { success: false, message: error.message };
    return { success: true, data };
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { success: false, message: error.message };
    return { success: true };
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) return { success: false, message: error.message };
    return { success: true };
  };

  const toggleFollow = async (targetUserId) => {
    if (!currentUser) return { success: false, message: "Login required." };

    // Check if following
    const { data: followData } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', currentUser.id)
      .eq('following_id', targetUserId)
      .single();

    if (followData) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', followData.id);
      
      // REAL-TIME SYNC: Remove follow notification
      await supabase.from('notifications').delete().match({
        user_id: targetUserId,
        actor_id: currentUser.id,
        type: 'follow'
      });
      
      return { success: true, isFollowing: false, error };
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: currentUser.id, following_id: targetUserId }]);
      
      if (!error) {
        // Direct insertion to avoid circular dependency with NotificationContext
        await supabase.from('notifications').insert([{
          user_id: targetUserId,
          actor_id: currentUser.id,
          type: 'follow'
        }]);
      }
      return { success: true, isFollowing: true, error };
    }
  };

  const deleteAccount = async () => {
    // Check if the user really wants to delete their account
    const { error } = await supabase.rpc('delete_user');
    
    if (error) {
       console.error("Account deletion failed:", error);
       return { success: false, message: error.message };
    }
    
    // Complete local logout
    await logout();
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, loading, login, signup, logout, updateProfile, getPublicProfile, resetPassword, updatePassword, toggleFollow, uploadAvatar, deleteAccount, updateStorageUsed }}>
      {children}
    </AuthContext.Provider>
  );
};
