import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IConversation, IMessage } from '@/types/message.types';
import {
  ArrowDownTrayIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
  CheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';

interface ChatWindowProps {
  conversation: IConversation | null;
  messages: IMessage[];
  loading: boolean;
  loadingOlder?: boolean;
  hasMore?: boolean;
  onLoadOlder?: () => void;
  onSendMessage: (content: string, file?: File) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  sendLoading?: boolean;
  otherUserOnline?: boolean;
  otherUserLastSeenAt?: string | null;
  isOtherUserTyping?: boolean;
}

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

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateLabel = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
};

const isSameDay = (a: string, b: string) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const getLastSeen = (v?: string | null) => {
  if (!v) return 'Offline';
  const d = new Date(v);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Active just now';
  if (mins < 60) return `Active ${mins}m ago`;
  if (mins < 1440) return `Active ${Math.floor(mins / 60)}h ago`;
  return `Active ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
};

const resolveUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (import.meta.env.VITE_API_URL || 'https://api.ogera.sybellasystems.co.rw/api').replace('/api', '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
};

const Avatar: React.FC<{ name?: string; imageUrl?: string; size?: number }> = ({
  name, imageUrl, size = 32,
}) => {
  const [bg, fg] = getAvatarColors(name);
  const src = resolveUrl(imageUrl);
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: 10, background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {name?.slice(0, 1).toUpperCase() || '?'}
    </div>
  );
};

const MessageStatus: React.FC<{ status: string | null }> = ({ status }) => {
  if (!status) return null;
  return (
    <span style={{ fontSize: 11, color: status === 'Seen' ? '#6366f1' : '#9ca3af', display: 'flex', alignItems: 'center', gap: 2 }}>
      {status === 'Seen' ? (
        <><CheckCircleIcon style={{ width: 11, height: 11 }} /> Seen</>
      ) : status === 'Delivered' ? (
        <><CheckIcon style={{ width: 11, height: 11 }} /> Delivered</>
      ) : (
        <><CheckIcon style={{ width: 11, height: 11 }} /> Sent</>
      )}
    </span>
  );
};

const TypingIndicator: React.FC<{ name?: string }> = ({ name }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, padding: '4px 0 8px' }}>
    <div style={{ width: 28, height: 28, borderRadius: 9, background: '#f3f4f6', flexShrink: 0 }} />
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '16px 16px 16px 4px',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}>
      <style>{`
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        .tdot { width: 5px; height: 5px; border-radius: 50%; background: #9ca3af; animation: typing-bounce 1.2s ease-in-out infinite; }
        .tdot:nth-child(2) { animation-delay: 0.15s; }
        .tdot:nth-child(3) { animation-delay: 0.3s; }
      `}</style>
      <span className="tdot" />
      <span className="tdot" />
      <span className="tdot" />
    </div>
  </div>
);

const MessageSkeleton: React.FC<{ align: 'left' | 'right' }> = ({ align }) => (
  <div style={{ display: 'flex', justifyContent: align === 'right' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
    <style>{`
      .sk { animation: sk-shimmer 1.5s ease-in-out infinite; }
      @keyframes sk-shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
    `}</style>
    {align === 'left' && <div style={{ width: 28, height: 28, borderRadius: 9, background: '#f1f5f9', marginRight: 8, flexShrink: 0 }} className="sk" />}
    <div style={{ maxWidth: '55%' }}>
      <div style={{ height: 38, borderRadius: align === 'right' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: '#f1f5f9', marginBottom: 4 }} className="sk" />
      <div style={{ height: 10, width: '40%', background: '#f1f5f9', borderRadius: 4, marginLeft: align === 'right' ? 'auto' : 0 }} className="sk" />
    </div>
  </div>
);

const TEXTAREA_MAX_HEIGHT = 120;

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  loading,
  loadingOlder = false,
  hasMore = false,
  onLoadOlder,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  sendLoading = false,
  otherUserOnline = false,
  otherUserLastSeenAt,
  isOtherUserTyping = false,
}) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const currentUserId = useSelector((state: any) => state.auth.user?.user_id);

  const otherUser = useMemo(() => {
    if (!conversation) return null;
    return currentUserId === conversation.employer_id
      ? conversation.student
      : conversation.employer;
  }, [conversation, currentUserId]);

  // Auto-scroll on new messages
  const latestId = messages[messages.length - 1]?.message_id;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [latestId, conversation?.conversation_id]);

  // Reset on conversation switch
  useEffect(() => {
    setText('');
    setFile(null);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    if (isTypingRef.current) { onTypingStop?.(); isTypingRef.current = false; }
    textareaRef.current?.focus();
  }, [conversation?.conversation_id]);

  // Auto-grow textarea
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Resize
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, TEXTAREA_MAX_HEIGHT) + 'px';
    }

    // Typing state
    if (!onTypingStart || !onTypingStop) return;
    if (val.trim() && !isTypingRef.current) { isTypingRef.current = true; onTypingStart(); }
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      if (isTypingRef.current) { onTypingStop(); isTypingRef.current = false; }
    }, 1500);
    if (!val.trim() && isTypingRef.current) { onTypingStop(); isTypingRef.current = false; }
  }, [onTypingStart, onTypingStop]);

  const handleSend = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() && !file) return;
    onSendMessage(text, file || undefined);
    setText('');
    setFile(null);
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    if (isTypingRef.current) { onTypingStop?.(); isTypingRef.current = false; }
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [text, file, onSendMessage, onTypingStop]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const grouped = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const isOwn = msg.sender_id === currentUserId;
      const sameSenderAsPrev = prev?.sender_id === msg.sender_id;
      const sameSenderAsNext = next?.sender_id === msg.sender_id;
      const sameDayAsPrev = prev ? isSameDay(prev.created_at, msg.created_at) : false;
      const showDate = !sameDayAsPrev;
      const showAvatar = !sameSenderAsNext;
      // Message grouping: first, middle, last, solo
      const groupPosition = !sameSenderAsPrev && !sameSenderAsNext
        ? 'solo'
        : !sameSenderAsPrev ? 'first'
        : !sameSenderAsNext ? 'last'
        : 'middle';
      return { msg, isOwn, showDate, showAvatar, groupPosition };
    });
  }, [messages, currentUserId]);

  const getBubbleRadius = (isOwn: boolean, pos: string) => {
    const r = '18px';
    const small = '5px';
    if (pos === 'solo') return r;
    if (isOwn) {
      if (pos === 'first') return `${r} ${r} ${small} ${r}`;
      if (pos === 'middle') return `${r} ${small} ${small} ${r}`;
      if (pos === 'last') return `${r} ${small} ${r} ${r}`;
    } else {
      if (pos === 'first') return `${r} ${r} ${r} ${small}`;
      if (pos === 'middle') return `${small} ${r} ${r} ${small}`;
      if (pos === 'last') return `${small} ${r} ${r} ${r}`;
    }
    return r;
  };

  const renderStatus = (msg: IMessage) => {
    if (msg.sender_id !== currentUserId) return null;
    if (msg.read_status) return 'Seen';
    if (msg.delivered_at) return 'Delivered';
    return 'Sent';
  };

  if (!conversation) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#fafafa',
        flexDirection: 'column',
        gap: 16,
        padding: 32,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: '#eef2ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ChatBubbleOvalLeftEllipsisIcon style={{ width: 26, height: 26, color: '#6366f1' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#111827' }}>
            Select a conversation
          </p>
          <p style={{ margin: 0, fontSize: 13.5, color: '#9ca3af', maxWidth: 280, lineHeight: 1.6 }}>
            Choose from the sidebar to view messages and exchange updates in real time.
          </p>
        </div>
      </div>
    );
  }

  const canSend = (text.trim().length > 0 || !!file) && !sendLoading;

  return (
    <section
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <style>{`
        .msg-bubble { transition: opacity 0.15s; }
        .msg-bubble:hover .msg-meta { opacity: 1; }
        .msg-meta { opacity: 0; transition: opacity 0.15s; }
        .send-btn { border: none; cursor: pointer; transition: transform 0.12s, background 0.12s, opacity 0.15s; }
        .send-btn:hover:not(:disabled) { transform: scale(1.07); }
        .send-btn:active:not(:disabled) { transform: scale(0.96); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .load-older-btn { border: 1px solid #e5e7eb; background: #fff; padding: 6px 16px; border-radius: 20px; font-size: 12.5px; font-weight: 500; color: #6b7280; cursor: pointer; transition: background 0.12s, border-color 0.12s; }
        .load-older-btn:hover:not(:disabled) { background: #f9fafb; border-color: #d1d5db; }
        .load-older-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .icon-action { border: none; background: transparent; cursor: pointer; padding: 6px; border-radius: 8px; color: #9ca3af; display: flex; align-items: center; justify-content: center; transition: background 0.12s, color 0.12s; }
        .icon-action:hover { background: #f3f4f6; color: #374151; }
        .icon-action:disabled { opacity: 0.5; cursor: not-allowed; }
        .textarea-field { border: none; outline: none; background: transparent; resize: none; font-size: 14px; line-height: 1.55; color: #111827; width: 100%; min-height: 38px; max-height: ${TEXTAREA_MAX_HEIGHT}px; font-family: inherit; padding: 8px 0; }
        .textarea-field::placeholder { color: #9ca3af; }
        .drag-overlay { position: absolute; inset: 0; background: rgba(99,102,241,0.06); border: 2px dashed #a5b4fc; border-radius: 0; z-index: 10; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-animate { animation: fade-in-up 0.2s ease-out; }
        .online-dot { width: 8px; height: 8px; border-radius: 50%; }
      `}</style>

      {/* Header */}
      <header style={{
        padding: '14px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: '#fff',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar name={otherUser?.full_name} imageUrl={otherUser?.profile_image_url} size={38} />
            <span
              className="online-dot"
              style={{
                position: 'absolute', bottom: -1, right: -1,
                background: otherUserOnline ? '#22c55e' : '#d1d5db',
                border: '2px solid #fff',
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {otherUser?.full_name || 'Unknown'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: otherUserOnline ? '#16a34a' : '#9ca3af', marginTop: 1 }}>
              {isOtherUserTyping
                ? '✦ Typing…'
                : otherUserOnline
                  ? '● Online'
                  : getLastSeen(otherUserLastSeenAt)}
            </p>
          </div>
        </div>
        {conversation.job?.job_title && (
          <div style={{
            flexShrink: 0,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 12,
            color: '#64748b',
            fontWeight: 500,
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {conversation.job.job_title}
          </div>
        )}
      </header>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {isDragOver && (
          <div className="drag-overlay">
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#6366f1' }}>
              Drop file to attach
            </p>
          </div>
        )}

        {/* Load older */}
        {!loading && hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <button className="load-older-btn" onClick={onLoadOlder} disabled={loadingOlder}>
              {loadingOlder ? 'Loading…' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div>
            {[...Array(6)].map((_, i) => (
              <MessageSkeleton key={i} align={i % 3 === 0 ? 'right' : 'left'} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            paddingBottom: 40,
          }}>
            <div style={{ fontSize: 32 }}>👋</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#374151' }}>
              No messages yet
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
              Be the first to send a message — share an update, ask a question, or attach a file.
            </p>
          </div>
        )}

        {/* Messages */}
        {!loading && grouped.map(({ msg, isOwn, showDate, showAvatar, groupPosition }, idx) => {
          const status = renderStatus(msg);
          const isLast = idx === grouped.length - 1;
          const hasFile = !!msg.file_url;
          const isImage = msg.file_type?.startsWith('image/');

          return (
            <React.Fragment key={msg.message_id}>
              {showDate && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  margin: '16px 0 12px',
                }}>
                  <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#9ca3af',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}>
                    {formatDateLabel(msg.created_at)}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
                </div>
              )}

              <div
                className="msg-animate"
                style={{
                  display: 'flex',
                  flexDirection: isOwn ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 6,
                  marginBottom: groupPosition === 'last' || groupPosition === 'solo' ? 10 : 2,
                }}
              >
                {/* Avatar placeholder to maintain alignment */}
                <div style={{ width: 28, flexShrink: 0 }}>
                  {!isOwn && showAvatar && (
                    <Avatar
                      name={msg.sender?.full_name}
                      imageUrl={msg.sender?.profile_image_url}
                      size={28}
                    />
                  )}
                </div>

                <div
                  style={{
                    maxWidth: '68%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwn ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    className="msg-bubble"
                    style={{
                      position: 'relative',
                      background: isOwn ? '#6366f1' : '#f3f4f6',
                      color: isOwn ? '#fff' : '#111827',
                      borderRadius: getBubbleRadius(isOwn, groupPosition),
                      padding: hasFile && !msg.content ? '4px' : '9px 13px',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {hasFile && (
                      <div style={{ marginBottom: msg.content ? 8 : 0 }}>
                        {isImage ? (
                          <img
                            src={resolveUrl(msg.file_url)}
                            alt="Attachment"
                            style={{
                              maxWidth: 260,
                              maxHeight: 200,
                              borderRadius: 12,
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: isOwn ? 'rgba(255,255,255,0.12)' : '#fff',
                            borderRadius: 12,
                            padding: '8px 12px',
                            border: isOwn ? 'none' : '1px solid #e5e7eb',
                          }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 9,
                              background: isOwn ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <PaperClipIcon style={{ width: 16, height: 16, color: isOwn ? '#fff' : '#6b7280' }} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isOwn ? '#fff' : '#111827' }}>
                                {msg.file_name || 'Attachment'}
                              </p>
                              <p style={{ margin: 0, fontSize: 11, color: isOwn ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>
                                {msg.file_type || 'File'}
                              </p>
                            </div>
                            <a
                              href={resolveUrl(msg.file_url)}
                              download={msg.file_name || undefined}
                              style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: isOwn ? 'rgba(255,255,255,0.15)' : '#f9fafb',
                                border: isOwn ? 'none' : '1px solid #e5e7eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isOwn ? '#fff' : '#6b7280',
                                flexShrink: 0,
                              }}
                            >
                              <ArrowDownTrayIcon style={{ width: 13, height: 13 }} />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.content && (
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </p>
                    )}
                  </div>

                  {/* Meta: time + status (shown on last in a group or last overall) */}
                  {(showAvatar || isLast) && (
                    <div
                      className="msg-meta"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 3,
                        padding: '0 2px',
                        flexDirection: isOwn ? 'row-reverse' : 'row',
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>
                        {formatTime(msg.created_at)}
                      </span>
                      {isOwn && <MessageStatus status={status} />}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Typing indicator */}
        {!loading && isOtherUserTyping && (
          <TypingIndicator name={otherUser?.full_name?.split(' ')[0]} />
        )}

        <div ref={messagesEndRef} style={{ height: 1 }} />
      </div>

      {/* Input area */}
      <div style={{
        borderTop: '1px solid #e5e7eb',
        padding: '12px 16px',
        background: '#fff',
        flexShrink: 0,
      }}>
        {/* File preview */}
        {file && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '8px 12px',
            marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: '#eef2ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PaperClipIcon style={{ width: 14, height: 14, color: '#6366f1' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              className="icon-action"
              onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            >
              <XMarkIcon style={{ width: 15, height: 15 }} />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
            style={{ display: 'none' }}
            disabled={sendLoading}
          />

          {/* Action buttons */}
          <button
            type="button"
            className="icon-action"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendLoading}
            title="Attach file"
          >
            <PaperClipIcon style={{ width: 18, height: 18 }} />
          </button>
          <button
            type="button"
            className="icon-action"
            disabled={sendLoading}
            title="Emoji (coming soon)"
          >
            <FaceSmileIcon style={{ width: 18, height: 18 }} />
          </button>

          {/* Text input */}
          <div style={{
            flex: 1,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '0 14px',
            display: 'flex',
            alignItems: 'flex-end',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
            onFocus={() => {
              const el = textareaRef.current?.parentElement;
              if (el) { el.style.borderColor = '#a5b4fc'; el.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }
            }}
            onBlur={() => {
              const el = textareaRef.current?.parentElement;
              if (el) { el.style.borderColor = '#e2e8f0'; el.style.boxShadow = 'none'; }
            }}
          >
            <textarea
              ref={textareaRef}
              className="textarea-field"
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
              disabled={sendLoading}
              rows={1}
            />
          </div>

          {/* Send */}
          <button
            type="submit"
            className="send-btn"
            disabled={!canSend}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: canSend ? '#6366f1' : '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Send message"
          >
            {sendLoading ? (
              <div style={{
                width: 16,
                height: 16,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            ) : (
              <PaperAirplaneIcon style={{ width: 17, height: 17, color: canSend ? '#fff' : '#9ca3af' }} />
            )}
          </button>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#d1d5db', textAlign: 'center' }}>
          Shift+Enter for new line
        </p>
      </div>
    </section>
  );
};

export default ChatWindow;