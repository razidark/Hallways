/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const NotificationContext = createContext();

const NotificationProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 0. Manage current user internally to avoid circular AuthContext dependency
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      // Resilient hydration: Fetch actor data in a single batched query (N+1 fixed)
      const actorIds = [...new Set(data.map(n => n.actor_id).filter(Boolean))];
      let actorsMap = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, role, is_verified')
          .in('id', actorIds);
        if (profiles) {
          profiles.forEach(p => actorsMap[p.id] = p);
        }
      }

      const hydrated = data.map(n => ({ ...n, actor: actorsMap[n.actor_id] || null }));
      setNotifications(hydrated);
      setUnreadCount(hydrated.filter(n => !n.is_read).length);
    } else if (error) {
      console.error('Notification Fetch Error:', error);
    }
  }, [currentUser]);

  const handleInsert = async (payload) => {
    const { data: actorData } = await supabase
      .from('profiles')
      .select('username, avatar_url, role, is_verified')
      .eq('id', payload.new.actor_id)
      .single();

    const fullNotification = {
      ...payload.new,
      actor: actorData
    };

    setNotifications(prev => [fullNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const handleDelete = (payload) => {
    setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const insertRef = useRef(handleInsert);
  const deleteRef = useRef(handleDelete);

  useEffect(() => {
    insertRef.current = handleInsert;
    deleteRef.current = handleDelete;
  });

  // 1. Fetch & Subscribe
  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    // 2. Realtime Subscription
    const channel = supabase
      .channel(`user-notifications-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => insertRef.current(payload)
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => deleteRef.current(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, fetchNotifications]);

  const markAllAsRead = async () => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUser.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const createNotification = async (type, targetUserId, targetId = null) => {
    if (!currentUser || currentUser.id === targetUserId) return;

    await supabase
      .from('notifications')
      .insert([{
        user_id: targetUserId,
        actor_id: currentUser.id,
        type,
        target_id: targetId
      }]);
  };

  const removeNotification = async (type, targetUserId, targetId = null) => {
    if (!currentUser) return;
    await supabase
      .from('notifications')
      .delete()
      .match({
        user_id: targetUserId,
        actor_id: currentUser.id,
        type,
        target_id: targetId
      });
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, createNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

const useNotifications = () => useContext(NotificationContext);
export { NotificationProvider, useNotifications };