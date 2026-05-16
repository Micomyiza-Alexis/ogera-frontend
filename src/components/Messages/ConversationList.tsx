import React, { useMemo, useRef } from 'react';
import type { IConversation } from '@/types/message.types';
import { MagnifyingGlassIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';

interface ConversationListProps {
  conversations: IConversation[];
  currentUserId?: string;
  selectedConversation: IConversation | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectConversation: (conversation: IConversation) => void;
  loading: boolean;
  typingConversationIds?: string[];
  onlineUserIds?: string[];
}

const resolveAvatarUrl = (value?: string) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  const base = (import.meta.env.VITE_API_URL || 'https://api.ogera.sybellasystems.co.rw/api').replace('/api', '');
  return `${base}${value.startsWith('/') ? value : `/${value}`}`;
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getPreview = (conversation: IConversation) => {
  const m = conversation.lastMessage;
  if (!m) return 'Start the conversation';
  if (m.content?.trim()) return m.content;
  if (m.file_name) return `📎 ${m.file_name}`;
  return 'Sent an attachment';
};

const AVATAR_COLORS = [
  ['#e0f2fe', '#0369a1'],
  ['#fce7f3', '#be185d'],
  ['#d1fae5', '#065f46'],
  ['#fef3c7', '#92400e'],
  ['#ede9fe', '#5b21b6'],
  ['#fee2e2', '#991b1b'],
];

const getAvatarColors = (name?: string) => {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const Avatar: React.FC<{
  name?: string;
  imageUrl?: string;
  size?: number;
  isOnline?: boolean;
}> = ({ name, imageUrl, size = 40, isOnline }) => {
  const [bg, fg] = getAvatarColors(name);
  const initial = name?.trim().slice(0, 1).toUpperCase() || '?';
  const resolvedUrl = resolveAvatarUrl(imageUrl);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {resolvedUrl ? (
        <img
          src={resolvedUrl}
          alt={name}
          style={{
            width: size,
            height: size,
            borderRadius: 12,
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 12,
            background: bg,
            color: fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: size * 0.375,
            letterSpacing: '-0.01em',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {initial}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 11,
            height: 11,
            borderRadius: '50%',
            background: isOnline ? '#22c55e' : '#d1d5db',
            border: '2px solid #fff',
          }}
        />
      )}
    </div>
  );
};

const SkeletonRow: React.FC = () => (
  <div style={{ padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f1f5f9', flexShrink: 0 }} className="skeleton" />
    <div style={{ flex: 1 }}>
      <div style={{ height: 13, width: '55%', background: '#f1f5f9', borderRadius: 4, marginBottom: 7 }} className="skeleton" />
      <div style={{ height: 12, width: '80%', background: '#f1f5f9', borderRadius: 4 }} className="skeleton" />
    </div>
    <div style={{ height: 11, width: 28, background: '#f1f5f9', borderRadius: 4 }} className="skeleton" />
  </div>
);

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUserId,
  selectedConversation,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  loading,
  typingConversationIds = [],
  onlineUserIds = [],
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const other = currentUserId === c.employer_id ? c.student : c.employer;
      return (
        other?.full_name?.toLowerCase().includes(q) ||
        c.job?.job_title?.toLowerCase().includes(q) ||
        getPreview(c).toLowerCase().includes(q)
      );
    });
  }, [conversations, currentUserId, searchQuery]);

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fafafa',
        borderRight: '1px solid #e5e7eb',
      }}
    >
      <style>{`
        .skeleton { animation: shimmer 1.4s ease-in-out infinite; }
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .conv-row { cursor: pointer; border: none; background: transparent; width: 100%; text-align: left; padding: 0; transition: background 0.12s; }
        .conv-row:hover .conv-inner { background: #f1f5f9; }
        .conv-row:focus-visible { outline: 2px solid #6366f1; outline-offset: -2px; }
        .conv-row.active .conv-inner { background: #eef2ff; }
        .conv-inner { padding: 10px 14px; display: flex; align-items: flex-start; gap: 11px; border-radius: 0; transition: background 0.12s; margin: 1px 8px; border-radius: 10px; }
        .active-bar { position: absolute; left: 0; top: 20%; height: 60%; width: 3px; background: #6366f1; border-radius: 0 2px 2px 0; }
        .conv-wrap { position: relative; }
        .conv-wrap.active .active-bar { opacity: 1; }
        .conv-wrap .active-bar { opacity: 0; }
        .badge { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #6366f1; color: #fff; font-size: 11px; font-weight: 600; line-height: 1; }
        .typing-dots { display: inline-flex; align-items: center; gap: 2px; }
        .typing-dots span { width: 4px; height: 4px; border-radius: 50%; background: #10b981; display: inline-block; animation: tdot 1.2s ease-in-out infinite; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes tdot { 0%, 80%, 100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-3px); opacity: 1; } }
        .search-input { width: 100%; border: 1px solid #e5e7eb; border-radius: 9px; padding: 8px 10px 8px 34px; font-size: 13.5px; background: #fff; color: #111; outline: none; transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box; }
        .search-input:focus { border-color: #a5b4fc; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .search-input::placeholder { color: #9ca3af; }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: '18px 16px 12px',
          borderBottom: '1px solid #f3f4f6',
          background: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
            Messages
          </h2>
          {conversations.length > 0 && (
            <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <MagnifyingGlassIcon
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 15,
              height: 15,
              color: '#9ca3af',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {loading && Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)}

        {!loading && filtered.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              color: '#9ca3af',
              gap: 10,
              textAlign: 'center',
            }}
          >
            <ChatBubbleOvalLeftIcon style={{ width: 28, height: 28, color: '#d1d5db' }} />
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: '#6b7280' }}>
              {searchQuery ? 'No results found' : 'No conversations yet'}
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: '#9ca3af', maxWidth: 200, lineHeight: 1.5 }}>
              {searchQuery
                ? 'Try a different name or keyword'
                : 'Conversations appear here once a job is approved'}
            </p>
          </div>
        )}

        {!loading &&
          filtered.map((conversation) => {
            const otherUser =
              currentUserId === conversation.employer_id
                ? conversation.student
                : conversation.employer;
            const isSelected =
              selectedConversation?.conversation_id === conversation.conversation_id;
            const isTyping = typingConversationIds.includes(conversation.conversation_id);
            const isOnline = otherUser?.user_id
              ? onlineUserIds.includes(otherUser.user_id)
              : false;
            const unread = conversation.unreadCount || 0;
            const preview = getPreview(conversation);
            const isEmployer = otherUser?.user_id === conversation.employer_id;
            const roleLabel = isEmployer ? 'Employer' : 'Student';

            return (
              <div key={conversation.conversation_id} className={`conv-wrap${isSelected ? ' active' : ''}`} style={{ position: 'relative' }}>
                <div className="active-bar" />
                <button
                  type="button"
                  className={`conv-row${isSelected ? ' active' : ''}`}
                  onClick={() => onSelectConversation(conversation)}
                  aria-label={`Open conversation with ${otherUser?.full_name || 'Unknown'}`}
                >
                  <div className="conv-inner">
                    <Avatar
                      name={otherUser?.full_name}
                      imageUrl={otherUser?.profile_image_url}
                      size={40}
                      isOnline={isOnline}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Row 1: Name + time */}
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginBottom: 1 }}>
                        <span
                          style={{
                            fontSize: 13.5,
                            fontWeight: unread > 0 ? 700 : 600,
                            color: '#111827',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '65%',
                          }}
                        >
                          {otherUser?.full_name || 'Unknown'}
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, flexShrink: 0 }}>
                          {formatTime(conversation.last_message_at)}
                        </span>
                      </div>

                      {/* Row 2: Role + job */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: isEmployer ? '#0369a1' : '#065f46',
                            background: isEmployer ? '#e0f2fe' : '#d1fae5',
                            padding: '1px 6px',
                            borderRadius: 4,
                            letterSpacing: '0.01em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {roleLabel}
                        </span>
                        {conversation.job?.job_title && (
                          <span
                            style={{
                              fontSize: 11.5,
                              color: '#6b7280',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 140,
                            }}
                          >
                            {conversation.job.job_title}
                          </span>
                        )}
                      </div>

                      {/* Row 3: Preview + badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        {isTyping ? (
                          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span className="typing-dots">
                              <span /><span /><span />
                            </span>
                            Typing…
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 12.5,
                              color: unread > 0 ? '#374151' : '#9ca3af',
                              fontWeight: unread > 0 ? 500 : 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {preview}
                          </span>
                        )}
                        {unread > 0 && (
                          <span className="badge">{unread > 99 ? '99+' : unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
      </div>
    </aside>
  );
};

export default ConversationList;