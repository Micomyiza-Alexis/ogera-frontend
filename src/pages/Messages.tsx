import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ConversationList from '@/components/Messages/ConversationList';
import ChatWindow from '@/components/Messages/ChatWindow';
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useMarkConversationReadMutation,
  useSendMessageMutation,
} from '@/services/api/messagesApi';
import {
  emitTypingStart,
  emitTypingStop,
  getSocket,
  joinConversationRoom,
  leaveConversationRoom,
} from '@/utils/socket';
import type { IConversation, IMessage } from '@/types/message.types';

const PAGE_SIZE = 30;

const dedupeMessages = (items: IMessage[]) => {
  const seen = new Map<string, IMessage>();
  items.forEach((item) => seen.set(item.message_id, item));
  return Array.from(seen.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
};

const sortConversations = (items: IConversation[]) =>
  [...items].sort((a, b) => {
    const l = a.last_message_at || a.created_at;
    const r = b.last_message_at || b.created_at;
    return new Date(r).getTime() - new Date(l).getTime();
  });

const Messages: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConversationIdFromQuery = searchParams.get('conversationId');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    selectedConversationIdFromQuery
  );
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [messageOffset, setMessageOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [typingConversationIds, setTypingConversationIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [presenceByUserId, setPresenceByUserId] = useState<
    Record<string, { is_online: boolean; last_seen_at?: string | null }>
  >({});
  // Mobile: track whether we're showing the chat panel or the list panel
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const currentUserId = useSelector((state: any) => state.auth.user?.user_id);
  const userRole = useSelector((state: any) => state.auth.role);
  const accessToken = useSelector((state: any) => state.auth.accessToken);

  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations,
  } = useGetConversationsQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.conversation_id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const {
    data: messagesData,
    isLoading: messagesLoading,
    isFetching: isFetchingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    selectedConversation
      ? {
          conversationId: selectedConversation.conversation_id,
          limit: PAGE_SIZE,
          offset: messageOffset,
        }
      : skipToken,
    { refetchOnFocus: true, refetchOnReconnect: true }
  );

  const [sendMessage, { isLoading: sendLoading }] = useSendMessageMutation();
  const [markConversationRead] = useMarkConversationReadMutation();

  useEffect(() => {
    setConversations(sortConversations(conversationsData?.data || []));
  }, [conversationsData]);

  useEffect(() => {
    if (!selectedConversationIdFromQuery) return;
    setSelectedConversationId(selectedConversationIdFromQuery);
    setMessages([]);
    setMessageOffset(0);
  }, [selectedConversationIdFromQuery]);

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      const fallback =
        selectedConversationIdFromQuery &&
        conversations.some((c) => c.conversation_id === selectedConversationIdFromQuery)
          ? selectedConversationIdFromQuery
          : conversations[0].conversation_id;
      setSelectedConversationId(fallback);
      setSearchParams({ conversationId: fallback });
    }
  }, [conversations, selectedConversationId, selectedConversationIdFromQuery, setSearchParams]);

  useEffect(() => {
    if (!messagesData?.data) {
      if (!selectedConversation) { setMessages([]); setHasMoreMessages(false); }
      return;
    }
    const nextPage = dedupeMessages(messagesData.data);
    setHasMoreMessages((messagesData.total || 0) > messageOffset + nextPage.length);
    setMessages((prev) =>
      messageOffset === 0 ? nextPage : dedupeMessages([...nextPage, ...prev])
    );
  }, [messageOffset, messagesData, selectedConversation]);

  useEffect(() => {
    if (!selectedConversation?.conversation_id) return;
    if ((selectedConversation.unreadCount || 0) === 0) return;
    markConversationRead(selectedConversation.conversation_id)
      .unwrap()
      .then(() => refetchConversations())
      .catch(() => undefined);
  }, [markConversationRead, refetchConversations, selectedConversation]);

  useEffect(() => {
    if (!accessToken || !selectedConversation?.conversation_id) return;
    joinConversationRoom(selectedConversation.conversation_id, () => accessToken);
    return () => { leaveConversationRoom(selectedConversation.conversation_id, () => accessToken); };
  }, [accessToken, selectedConversation?.conversation_id]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(() => accessToken);
    if (!socket) return;

    const handleNewMessage = async (payload: { conversation_id?: string; message?: IMessage }) => {
      const incoming = payload.message;
      if (!incoming) return;

      setConversations((prev) =>
        sortConversations(
          prev.map((c) => {
            if (c.conversation_id !== incoming.conversation_id) return c;
            const isCurrent = c.conversation_id === selectedConversationId;
            const nextUnread =
              incoming.sender_id === currentUserId || isCurrent
                ? 0
                : (c.unreadCount || 0) + 1;
            return { ...c, lastMessage: incoming, last_message_at: incoming.created_at, unreadCount: nextUnread };
          })
        )
      );

      if (incoming.conversation_id === selectedConversationId) {
        setMessages((prev) => dedupeMessages([...prev, incoming]));
        if (incoming.sender_id !== currentUserId) {
          try {
            await markConversationRead(incoming.conversation_id).unwrap();
            await refetchConversations();
          } catch { /* best effort */ }
        }
      } else {
        refetchConversations();
      }
    };

    const handleMessagesRead = (payload: { conversation_id?: string }) => {
      if (payload.conversation_id !== selectedConversationId) return;
      setMessages((prev) =>
        prev.map((m) => m.sender_id === currentUserId ? { ...m, read_status: true } : m)
      );
    };

    const handleMessageDelivered = (payload: { message_id?: string; delivered_at?: string }) => {
      if (!payload.message_id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.message_id === payload.message_id
            ? { ...m, delivered_at: payload.delivered_at || new Date().toISOString() }
            : m
        )
      );
    };

    const handleTyping = (payload: { conversation_id?: string; user_id?: string; is_typing?: boolean }) => {
      if (!payload.conversation_id || !payload.user_id || payload.user_id === currentUserId) return;
      setTypingConversationIds((prev) => {
        const s = new Set(prev);
        payload.is_typing ? s.add(payload.conversation_id!) : s.delete(payload.conversation_id!);
        return Array.from(s);
      });
      setTypingUsers((prev) => ({ ...prev, [payload.user_id!]: Boolean(payload.is_typing) }));
    };

    const handlePresence = (payload: { user_id?: string; is_online?: boolean; last_seen_at?: string | null }) => {
      if (!payload.user_id) return;
      setPresenceByUserId((prev) => ({
        ...prev,
        [payload.user_id!]: { is_online: Boolean(payload.is_online), last_seen_at: payload.last_seen_at },
      }));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('messages:read', handleMessagesRead);
    socket.on('message:delivered', handleMessageDelivered);
    socket.on('conversation:typing', handleTyping);
    socket.on('conversation:presence', handlePresence);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('messages:read', handleMessagesRead);
      socket.off('message:delivered', handleMessageDelivered);
      socket.off('conversation:typing', handleTyping);
      socket.off('conversation:presence', handlePresence);
    };
  }, [accessToken, currentUserId, markConversationRead, refetchConversations, selectedConversationId]);

  const handleSelectConversation = async (conversation: IConversation) => {
    setSelectedConversationId(conversation.conversation_id);
    setSearchParams({ conversationId: conversation.conversation_id });
    setMessages([]);
    setMessageOffset(0);
    setMobileShowChat(true); // Switch to chat panel on mobile

    if ((conversation.unreadCount || 0) > 0) {
      try {
        await markConversationRead(conversation.conversation_id).unwrap();
        await refetchConversations();
      } catch { /* best effort */ }
    }
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!selectedConversation) return;
    try {
      const result = await sendMessage({
        conversationId: selectedConversation.conversation_id,
        content,
        file,
      }).unwrap();

      if (result.data) {
        setMessages((prev) => dedupeMessages([...prev, result.data]));
        setConversations((prev) =>
          sortConversations(
            prev.map((c) =>
              c.conversation_id === selectedConversation.conversation_id
                ? { ...c, lastMessage: result.data, last_message_at: result.data.created_at }
                : c
            )
          )
        );
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send message');
    }
  };

  const otherUser =
    selectedConversation && currentUserId === selectedConversation.employer_id
      ? selectedConversation.student
      : selectedConversation?.employer;

  const otherUserPresence = otherUser?.user_id ? presenceByUserId[otherUser.user_id] : undefined;

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div
      style={{
        height: 'calc(100vh - 80px)',
        minHeight: 480,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .msg-sidebar { display: ${mobileShowChat ? 'none' : 'flex'} !important; width: 100% !important; }
          .msg-chat { display: ${mobileShowChat ? 'flex' : 'none'} !important; width: 100% !important; }
          .msg-back-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .msg-sidebar { display: flex !important; width: 320px !important; }
          .msg-chat { display: flex !important; }
          .msg-back-btn { display: none !important; }
        }
        .msg-back-btn { display: none; align-items: center; gap: 6px; border: none; background: transparent; cursor: pointer; font-size: 13px; font-weight: 600; color: #6366f1; padding: 4px 8px; border-radius: 8px; transition: background 0.12s; }
        .msg-back-btn:hover { background: #eef2ff; }
      `}</style>

      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #f3f4f6',
        flexShrink: 0,
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Mobile back button */}
          <button
            type="button"
            className="msg-back-btn"
            onClick={() => setMobileShowChat(false)}
          >
            <ArrowLeftIcon style={{ width: 14, height: 14 }} />
            Back
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
                Messages
              </h1>
              {totalUnread > 0 && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  borderRadius: 10,
                  background: '#6366f1',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
              {userRole === 'employer'
                ? 'Manage conversations with approved students'
                : 'Stay connected with your employers'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isFetchingMessages && (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Syncing…</span>
          )}
          <button
            type="button"
            onClick={() => {
              refetchConversations();
              if (selectedConversation) refetchMessages();
            }}
            style={{
              border: '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: 9,
              padding: '6px 12px',
              fontSize: 12.5,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'background 0.12s, border-color 0.12s',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#fff';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error banners */}
      {conversationsError && (
        <div style={{
          margin: '8px 16px 0',
          padding: '9px 14px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          fontSize: 13,
          color: '#b91c1c',
          flexShrink: 0,
        }}>
          Failed to load conversations. Check your connection and try refreshing.
        </div>
      )}
      {messagesError && selectedConversation && (
        <div style={{
          margin: '8px 16px 0',
          padding: '9px 14px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          fontSize: 13,
          color: '#b91c1c',
          flexShrink: 0,
        }}>
          Failed to load messages for this conversation.
        </div>
      )}

      {/* Two-panel layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar */}
        <div
          className="msg-sidebar"
          style={{
            width: 320,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: '1px solid #e5e7eb',
          }}
        >
          <ConversationList
            conversations={conversations}
            currentUserId={currentUserId}
            selectedConversation={selectedConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectConversation={handleSelectConversation}
            loading={conversationsLoading}
            typingConversationIds={typingConversationIds}
            onlineUserIds={Object.entries(presenceByUserId)
              .filter(([, v]) => v.is_online)
              .map(([uid]) => uid)}
          />
        </div>

        {/* Chat panel */}
        <div
          className="msg-chat"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            loading={messagesLoading && messageOffset === 0}
            loadingOlder={isFetchingMessages && messageOffset > 0}
            hasMore={hasMoreMessages}
            onLoadOlder={() => setMessageOffset((prev) => prev + PAGE_SIZE)}
            onSendMessage={handleSendMessage}
            onTypingStart={() =>
              selectedConversation && accessToken
                ? emitTypingStart(selectedConversation.conversation_id, () => accessToken)
                : undefined
            }
            onTypingStop={() =>
              selectedConversation && accessToken
                ? emitTypingStop(selectedConversation.conversation_id, () => accessToken)
                : undefined
            }
            sendLoading={sendLoading}
            otherUserOnline={Boolean(otherUserPresence?.is_online)}
            otherUserLastSeenAt={otherUserPresence?.last_seen_at}
            isOtherUserTyping={Boolean(otherUser?.user_id && typingUsers[otherUser.user_id])}
          />
        </div>
      </div>
    </div>
  );
};

export default Messages;