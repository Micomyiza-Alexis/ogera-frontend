import React, { useMemo } from 'react';
import type { IConversation } from '@/types/message.types';
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface ConversationListProps {
  conversations: IConversation[];
  selectedConversation: IConversation | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectConversation: (conversation: IConversation) => void;
  loading: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatTimestamp = (date: string | undefined): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return '';
  }
};

const getInitials = (name?: string | null): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

// Deterministic avatar gradient from name
const avatarGradients = [
  'from-violet-500 to-purple-700',
  'from-blue-500 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-700',
];

const getGradient = (name?: string | null): string => {
  const code = (name || '').charCodeAt(0) || 0;
  return avatarGradients[code % avatarGradients.length];
};

// ─── Skeleton ───────────────────────────────────────────────────────────────

const ConversationSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="w-11 h-11 rounded-full bg-gray-200 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-gray-200 rounded-full w-2/3" />
      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
      <div className="h-3 bg-gray-100 rounded-full w-3/4" />
    </div>
    <div className="h-3 bg-gray-200 rounded-full w-8 flex-shrink-0" />
  </div>
);

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ searching: boolean }> = ({ searching }) => (
  <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
    <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
      <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-400" />
    </div>
    <p className="text-sm font-semibold text-gray-800 mb-1">
      {searching ? 'No results found' : 'No conversations yet'}
    </p>
    <p className="text-xs text-gray-400 leading-relaxed max-w-[180px]">
      {searching
        ? 'Try a different name or job title'
        : 'Your conversations with employers and students will appear here'}
    </p>
  </div>
);

// ─── Avatar ──────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ name?: string | null; imageUrl?: string | null; size?: 'sm' | 'md' }> = ({
  name,
  imageUrl,
  size = 'md',
}) => {
  const dim = size === 'md' ? 'w-11 h-11 text-sm' : 'w-8 h-8 text-xs';
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name ?? ''}
        className={`${dim} rounded-full object-cover flex-shrink-0 ring-2 ring-white`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center flex-shrink-0 ring-2 ring-white font-bold text-white`}
    >
      {getInitials(name)}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  loading,
}) => {
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const name = conv.employer?.full_name || conv.student?.full_name || '';
      const job = conv.job?.job_title || '';
      return name.toLowerCase().includes(query) || job.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-3">Messages</h2>
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or role…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && filteredConversations.length === 0 && (
          <EmptyState searching={!!searchQuery.trim()} />
        )}

        {!loading && (
          <ul className="divide-y divide-gray-50" role="listbox" aria-label="Conversations">
            {filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.conversation_id === conv.conversation_id;
              const otherUser = conv.employer || conv.student;
              const role = conv.employer ? 'Employer' : 'Student';
              const preview = conv.lastMessage?.content || 'No messages yet';
              const hasUnread = conv.unreadCount && conv.unreadCount > 0;

              return (
                <li key={conv.conversation_id} role="option" aria-selected={isSelected}>
                  <button
                    onClick={() => onSelectConversation(conv)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-inset ${
                      isSelected
                        ? 'bg-purple-50 border-l-[3px] border-l-purple-600'
                        : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      <Avatar name={otherUser?.full_name} imageUrl={otherUser?.profile_image_url} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                          {otherUser?.full_name || 'Unknown'}
                        </span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">
                          {formatTimestamp(conv.last_message_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                          role === 'Employer'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-violet-50 text-violet-600'
                        }`}>
                          {role}
                        </span>
                        {conv.job?.job_title && (
                          <span className="text-xs text-gray-500 truncate">{conv.job.job_title}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate leading-snug ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                          {preview}
                        </p>
                        {hasUnread && (
                          <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                            {conv.unreadCount! > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationList;