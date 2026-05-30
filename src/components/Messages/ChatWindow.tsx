import React, { useState, useEffect, useRef } from 'react';
import type { IConversation, IMessage } from '@/types/message.types';
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';

interface ChatWindowProps {
  conversation: IConversation | null;
  messages: IMessage[];
  loading: boolean;
  onSendMessage: (content: string, file?: File) => void;
  sendLoading?: boolean;
}

type ChatAuthUser = {
  user_id?: string;
  id?: string;
};

type ChatAuthState = {
  auth: {
    user?: ChatAuthUser;
    user_id?: string;
    id?: string;
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTime = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
};

const formatDateDivider = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
};

const sameDay = (a: string, b: string): boolean => {
  try {
    return new Date(a).toDateString() === new Date(b).toDateString();
  } catch {
    return false;
  }
};

const getInitials = (name?: string | null): string => {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
};

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

const isImageFile = (mimeType?: string | null) => mimeType?.startsWith('image/');
const isPdfFile = (mimeType?: string | null) => mimeType === 'application/pdf';

// ─── Sub-components ──────────────────────────────────────────────────────────

const Avatar: React.FC<{ name?: string | null; imageUrl?: string | null; size?: 'sm' | 'md' }> = ({
  name, imageUrl, size = 'sm',
}) => {
  const dim = size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  if (imageUrl) {
    return <img src={imageUrl} alt={name ?? ''} className={`${dim} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center flex-shrink-0 font-bold text-white`}>
      {getInitials(name)}
    </div>
  );
};

const MessageSkeleton: React.FC = () => (
  <div className="flex flex-col gap-4 p-4 animate-pulse">
    {[...Array(4)].map((_, i) => (
      <div key={i} className={`flex gap-3 items-end ${i % 2 === 0 ? 'justify-start' : 'justify-end flex-row-reverse'}`}>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
        <div className={`space-y-1.5 max-w-xs ${i % 2 === 0 ? '' : 'items-end flex flex-col'}`}>
          <div className={`h-10 rounded-2xl bg-gray-200 ${i % 2 === 0 ? 'w-48' : 'w-40'}`} />
          <div className="h-3 bg-gray-100 rounded-full w-16" />
        </div>
      </div>
    ))}
  </div>
);

const DateDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 my-4 px-2">
    <div className="flex-1 h-px bg-gray-100" />
    <span className="text-[11px] font-medium text-gray-400 px-2 py-1 bg-gray-50 rounded-full whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

// ─── Empty Chat State ─────────────────────────────────────────────────────────

const EmptyChatState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full px-8 select-none">
    {/* Illustration */}
    <div className="relative mb-6">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-inner">
        <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12a4 4 0 014-4h24a4 4 0 014 4v16a4 4 0 01-4 4H28l-8 6v-6H12a4 4 0 01-4-4V12z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 20h16M16 26h8" />
        </svg>
      </div>
      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center shadow-md">
        <span className="text-white text-xs">👋</span>
      </div>
    </div>

    <h3 className="text-base font-bold text-gray-900 mb-2 text-center">
      Your messages live here
    </h3>
    <p className="text-sm text-gray-500 text-center max-w-[240px] leading-relaxed">
      Select a conversation on the left to start messaging employers and students.
    </p>

    <div className="mt-8 flex flex-col gap-2 w-full max-w-[220px]">
      {['Applied for a role?', 'Got an interview invite?', 'Following up?'].map((label, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
          <span className="text-xs text-gray-600">{label}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  loading,
  onSendMessage,
  sendLoading = false,
}) => {
  const [messageContent, setMessageContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentUserId = useSelector((state: ChatAuthState) =>
    state.auth.user?.user_id || state.auth.user?.id || state.auth.user_id || state.auth.id
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [messageContent]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() && !selectedFile) return;
    onSendMessage(messageContent, selectedFile || undefined);
    setMessageContent('');
    setSelectedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!conversation) {
    return (
      <div className="flex flex-col h-full bg-white">
        <EmptyChatState />
      </div>
    );
  }

  const otherUser =
    currentUserId === conversation.employer_id
      ? conversation.student
      : conversation.employer;
  const role = currentUserId === conversation.employer_id ? 'Student' : 'Employer';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white shadow-sm flex-shrink-0">
        <Avatar name={otherUser?.full_name} imageUrl={otherUser?.profile_image_url} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900 truncate">
              {otherUser?.full_name || 'Unknown'}
            </h2>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
              role === 'Employer' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'
            }`}>
              {role}
            </span>
          </div>
          {conversation.job?.job_title && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              Re: {conversation.job.job_title}
            </p>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" role="log" aria-live="polite">
        {loading && <MessageSkeleton />}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
              <span className="text-xl">💬</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">No messages yet</p>
            <p className="text-xs text-gray-400">Send a message to start the conversation</p>
          </div>
        )}

        {!loading && messages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId;
          const prev = messages[index - 1];
          const next = messages[index + 1];

          // Group logic
          const isFirstInGroup = !prev || prev.sender_id !== message.sender_id;
          const isLastInGroup = !next || next.sender_id !== message.sender_id;
          // Date divider
          const showDateDivider = !prev || !sameDay(prev.created_at, message.created_at);

          // Bubble border radius
          const radius = isOwn
            ? `rounded-2xl ${isFirstInGroup ? 'rounded-tr-md' : ''} ${isLastInGroup ? 'rounded-br-md' : ''}`
            : `rounded-2xl ${isFirstInGroup ? 'rounded-tl-md' : ''} ${isLastInGroup ? 'rounded-bl-md' : ''}`;

          return (
            <React.Fragment key={message.message_id}>
              {showDateDivider && (
                <DateDivider label={formatDateDivider(message.created_at)} />
              )}

              <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}>
                {/* Other user avatar — only on last in group */}
                {!isOwn && (
                  <div className="w-8 flex-shrink-0">
                    {isLastInGroup ? (
                      <Avatar name={message.sender?.full_name} imageUrl={message.sender?.profile_image_url} size="sm" />
                    ) : null}
                  </div>
                )}

                <div className={`flex flex-col gap-1 max-w-[72%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  {/* Sender name for incoming messages (first in group only) */}
                  {!isOwn && isFirstInGroup && (
                    <span className="text-[11px] font-semibold text-gray-500 ml-1">
                      {message.sender?.full_name || 'Unknown'}
                    </span>
                  )}

                  {/* File attachment */}
                  {message.file_url && (
                    <div className={`overflow-hidden ${radius} ${
                      isOwn ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}>
                      {isImageFile(message.file_type) ? (
                        <img
                          src={message.file_url}
                          alt="attachment"
                          className="max-w-full max-h-60 object-cover block"
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isOwn ? 'bg-purple-500' : 'bg-gray-200'
                          }`}>
                            <DocumentIcon className={`w-5 h-5 ${isOwn ? 'text-purple-100' : 'text-gray-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{message.file_name}</p>
                            {isPdfFile(message.file_type) && (
                              <p className={`text-[11px] ${isOwn ? 'text-purple-200' : 'text-gray-500'}`}>PDF Document</p>
                            )}
                          </div>
                          <a
                            href={message.file_url}
                            download={message.file_name}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                              isOwn
                                ? 'bg-purple-500 hover:bg-purple-400 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                            }`}
                            aria-label="Download file"
                            title="Download"
                          >
                            ↓
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text bubble */}
                  {message.content && (
                    <div className={`px-4 py-2.5 ${radius} ${
                      isOwn
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  )}

                  {/* Timestamp — only on last in group */}
                  {isLastInGroup && (
                    <span className="text-[11px] text-gray-400 px-1 tabular-nums">
                      {formatTime(message.created_at)}
                    </span>
                  )}
                </div>

                {/* Own avatar spacer */}
                {isOwn && <div className="w-8 flex-shrink-0" />}
              </div>
            </React.Fragment>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer ── */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3">
        {/* File preview */}
        {selectedFile && (
          <div className="mb-2.5 flex items-center gap-3 px-3 py-2.5 bg-purple-50 border border-purple-100 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <DocumentIcon className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{selectedFile.name}</p>
              <p className="text-[11px] text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-purple-100 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          {/* File picker */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            disabled={sendLoading}
            className="hidden"
            aria-label="Attach file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendLoading}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            title="Attach a file"
            aria-label="Attach file"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              disabled={sendLoading}
              rows={1}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white disabled:cursor-not-allowed transition-all resize-none leading-relaxed overflow-hidden"
              style={{ minHeight: '40px' }}
              aria-label="Message input"
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={sendLoading || (!messageContent.trim() && !selectedFile)}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
            aria-label="Send message"
          >
            {sendLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <PaperAirplaneIcon className="w-4 h-4" />
            )}
          </button>
        </form>

        <p className="text-[10px] text-gray-300 text-center mt-1.5">Shift+Enter for new line</p>
      </div>
    </div>
  );
};

export default ChatWindow;