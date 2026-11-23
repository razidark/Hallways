/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { useAudio } from './AudioContext';
import { sanitizeFilename } from '../lib/utils';
import { validateFileSize, checkQuota, removeObjectAndGetSize } from '../lib/storageQuota';

const MessageContext = createContext();

const MessageProvider = ({ children }) => {
  const { currentUser, updateStorageUsed } = useAuth();
  const { createNotification } = useNotifications();
  const { playSound } = useAudio();
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesLimit, setMessagesLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const roomChannelRef = useRef(null);

  // Fetch all conversations (unique users we've chatted with)
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    setConversationsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, created_at, media_url, media_type')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error("Whisper Fetch Error:", error);
        return;
      }

      if (data) {
        const usersMap = new Map();
        const otherIds = new Set();

        data.forEach(msg => {
          const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
          if (!usersMap.has(otherId)) {
            usersMap.set(otherId, {
              id: otherId,
              lastMessage: msg.content || (msg.media_url ? 'Sent an attachment' : 'Empty message'),
              timestamp: msg.created_at
            });
            otherIds.add(otherId);
          }
        });

        if (otherIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, border_style, avatar_shape, role, is_verified')
            .in('id', Array.from(otherIds));

          if (profiles) {
            profiles.forEach(p => {
              if (usersMap.has(p.id)) {
                const conv = usersMap.get(p.id);
                usersMap.set(p.id, {
                  ...conv,
                  username: p.username,
                  avatar: p.avatar_url,
                  borderStyle: p.border_style,
                  avatarShape: p.avatar_shape
                });
              }
            });
          }
        }

        setConversations(Array.from(usersMap.values()));
      }
    } catch (err) {
      console.error("Universal Whisper Error:", err);
    } finally {
      setConversationsLoading(false);
    }
  }, [currentUser]);

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (otherUserId, customLimit = 20) => {
    if (!currentUser || !otherUserId) return;
    setMessagesLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: false })
      .limit(customLimit);

    if (!error && data) {
      const chronological = [...data].reverse();
      setMessages(chronological);
      setHasMore(data.length === customLimit);
    }
    setMessagesLoading(false);
  }, [currentUser]);

  const loadMoreMessages = useCallback(async () => {
    if (!activeChatId || messagesLoading || !hasMore) return;
    const newLimit = messagesLimit + 20;
    setMessagesLimit(newLimit);
    await fetchMessages(activeChatId, newLimit);
  }, [activeChatId, messagesLoading, hasMore, messagesLimit, fetchMessages]);

  useEffect(() => {
    setMessagesLimit(20);
    setHasMore(true);
  }, [activeChatId]);

  useEffect(() => {
    if (!currentUser || !activeChatId) {
      setIsOtherTyping(false);
      return;
    }

    const roomId = [currentUser.id, activeChatId].sort().join('_');
    const channel = supabase.channel(`room:${roomId}`);
    roomChannelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== currentUser.id) {
          setIsOtherTyping(payload.isTyping);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      roomChannelRef.current = null;
    };
  }, [currentUser, activeChatId]);

  const sendTypingStatus = useCallback((isTyping) => {
    if (roomChannelRef.current) {
      roomChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id, isTyping }
      });
    }
  }, [currentUser]);

  const handleIncomingMessage = useCallback((payload) => {
    const { eventType, new: newMsg, old: oldMsg } = payload;

    if (eventType === 'INSERT') {
      const otherId = newMsg.sender_id === currentUser?.id ? newMsg.receiver_id : newMsg.sender_id;
      if (activeChatId === otherId) {
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          const exists = prev.find(m => m.tempId === newMsg.tempId);
          if (exists) return prev.map(m => m.tempId === newMsg.tempId ? newMsg : m);
          return [...prev, newMsg];
        });
      }
      fetchConversations();
    } else if (eventType === 'UPDATE') {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, ...newMsg } : m));
      fetchConversations();
    } else if (eventType === 'DELETE') {
      setMessages(prev => prev.filter(m => m.id !== oldMsg.id));
      fetchConversations();
    }
  }, [activeChatId, currentUser?.id, fetchConversations]);

  // Keep a ref to handleIncomingMessage to avoid stale closures in real-time callbacks
  const handleIncomingRef = useRef(handleIncomingMessage);
  useEffect(() => {
    handleIncomingRef.current = handleIncomingMessage;
  }, [handleIncomingMessage]);

  useEffect(() => {
    if (currentUser?.id) {
      // Using microtask to avoid "synchronous setState in effect" warning
      Promise.resolve().then(() => fetchConversations());

      // Real-time 2.0: Bidirectional Message Stream (INSERT, UPDATE, DELETE)
      const channel = supabase
        .channel(`whispers:${currentUser.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages'
        }, (payload) => {
          handleIncomingRef.current(payload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser?.id, fetchConversations]);

  const sendMessage = async (receiverId, content, file = null) => {
    if (!currentUser || (!content.trim() && !file)) return;
    playSound('whisper');

    let mediaUrl = null;
    let mediaType = null;
    let uploadedFileSize = 0;

    if (file) {
      // Same storage gate as posts and stories: size limit, then quota.
      const sizeCheck = validateFileSize(file);
      if (!sizeCheck.valid) return { success: false, message: sizeCheck.message };

      const quotaCheck = checkQuota(currentUser.storage_used, file.size);
      if (!quotaCheck.allowed) return { success: false, message: quotaCheck.message };

      const safeName = sanitizeFilename(file.name);
      const fileName = `${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage.from('messages').upload(`${currentUser.id}/${fileName}`, file);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('messages').getPublicUrl(`${currentUser.id}/${fileName}`);
        mediaUrl = publicUrl;
        mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        uploadedFileSize = file.size;
      }
    }

    const tempId = Date.now().toString();
    const optimisticMsg = {
      id: tempId,
      tempId,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    // Optimistic Push
    setMessages(prev => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: currentUser.id,
          receiver_id: receiverId,
          content,
          media_url: mediaUrl,
          media_type: mediaType
        }
      ])
      .select()
      .single();

    if (!error && data) {
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...data, status: 'sent' } : m));
      // Track the uploaded media so the quota reflects real usage.
      if (uploadedFileSize > 0) {
        await updateStorageUsed(uploadedFileSize);
      }
      fetchConversations();
      createNotification('message', receiverId);
      return { success: true };
    } else {
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
      return { success: false, error: error?.message };
    }
  };

  const deleteMessage = async (messageId) => {
    if (!currentUser) return;
    // Optimistic delete
    setMessages(prev => prev.filter(m => m.id !== messageId));

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', currentUser.id);

    if (error) {
      // Revert if error
      fetchMessages(activeChatId);
      return { success: false, error: error.message };
    }

    // Free the media bytes this message was holding, if it had any.
    const deletedMsg = messages.find(m => m.id === messageId);
    if (deletedMsg?.media_url && deletedMsg.media_url.includes('/messages/')) {
      const filePath = deletedMsg.media_url.split('/messages/').pop();
      if (filePath) {
        const freedBytes = await removeObjectAndGetSize('messages', filePath);
        if (freedBytes > 0) await updateStorageUsed(-freedBytes);
      }
    }
    fetchConversations();
    return { success: true };
  };

  const editMessage = async (messageId, newContent) => {
    if (!currentUser || !newContent.trim()) return;

    const { data, error } = await supabase
      .from('messages')
      .update({ content: newContent, is_edited: true })
      .eq('id', messageId)
      .eq('sender_id', currentUser.id)
      .select()
      .single();

    if (!error && data) {
      setMessages(prev => prev.map(m => m.id === messageId ? data : m));
      fetchConversations();
      return { success: true };
    }
    return { success: false, error: error?.message };
  };

  const markAsRead = async (messageId) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('receiver_id', currentUser.id);

    if (!error) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read_at: new Date().toISOString() } : m));
    }
  };

  const startChat = (user) => {
    // Navigate to the user's chat
    setActiveChatId(user.id);
    fetchMessages(user.id);
  };
  return (
    <MessageContext.Provider value={{
      conversations,
      messages,
      activeChatId,
      setActiveChatId,
      sendMessage,
      deleteMessage,
      editMessage,
      markAsRead,
      startChat,
      fetchMessages,
      fetchConversations,
      loading: conversationsLoading,
      conversationsLoading,
      messagesLoading,
      hasMore,
      loadMoreMessages,
      isOtherTyping,
      sendTypingStatus
    }}>
      {children}
    </MessageContext.Provider>
  );
};
const useMessages = () => useContext(MessageContext);
export { MessageProvider, useMessages };
