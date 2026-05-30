import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query/react';
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
import type { IConversation, IMessage } from '@/types/message.types';

type MessagesAuthState = {
  auth: {
    user?: { user_id?: string };
    role?: string;
  };
};

const Messages: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<IConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<IMessage[]>([]);

  const currentUserId = useSelector((state: MessagesAuthState) => state.auth.user?.user_id);
  const userRole = useSelector((state: MessagesAuthState) => state.auth.role);

  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useGetConversationsQuery();

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useGetMessagesQuery(
    selectedConversation
      ? { conversationId: selectedConversation.conversation_id }
      : skipToken,
  );

  useEffect(() => {
    if (import.meta.env.MODE !== 'production') {
      console.log('[Messages] Auth:', { currentUserId, userRole });
      if (conversationsError) console.error('[Messages] Conversations error:', conversationsError);
      if (messagesError) console.error('[Messages] Messages error:', messagesError);
    }
  }, [currentUserId, userRole, conversationsError, messagesError]);

  const [sendMessage, { isLoading: sendLoading }] = useSendMessageMutation();
  const [markConversationRead] = useMarkConversationReadMutation();

  useEffect(() => {
    if (messagesData?.data) {
      setMessages(messagesData.data);
    }
  }, [messagesData]);

  useEffect(() => {
    if (!selectedConversation) return;

    markConversationRead(selectedConversation.conversation_id).catch((error) => {
      if (import.meta.env.MODE !== 'production') {
        console.error('[Messages] Mark read error:', error);
      }
    });
  }, [markConversationRead, selectedConversation?.conversation_id]);

  // Reset messages when switching conversations
  useEffect(() => {
    setMessages([]);
  }, [selectedConversation?.conversation_id]);

  const handleSendMessage = async (content: string, file?: File) => {
    if (!selectedConversation) return;
    try {
      const result = await sendMessage({
        conversationId: selectedConversation.conversation_id,
        content,
        file,
      }).unwrap();
      if (result.data) {
        setMessages((prev) => [...prev, result.data]);
      }
      toast.success('Message sent');
    } catch (error: unknown) {
      const responseMessage =
        typeof error === 'object' && error !== null && 'data' in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      const errorMessage =
        typeof responseMessage === 'string' && responseMessage.trim().length > 0
          ? responseMessage
          : 'Failed to send message';
      console.error('Error sending message:', error);
      toast.error(errorMessage);
    }
  };

  const handleSelectConversation = (conv: IConversation) => {
    setSelectedConversation(conv);
  };

  const conversations = conversationsData?.data || [];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* ── Page Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Messages</h1>
          <p className="text-xs text-gray-500 mt-0.5">View and continue your conversations</p>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden p-0 md:p-4 md:gap-4 min-h-0">

        {/* ── Desktop: Side-by-side ── */}
        <div className="hidden md:flex gap-4 w-full min-h-0">
          {/* Sidebar */}
          <aside className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-gray-100">
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectConversation={handleSelectConversation}
              loading={conversationsLoading}
            />
          </aside>

          {/* Chat panel */}
          <main className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-gray-100 min-w-0">
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              loading={messagesLoading}
              onSendMessage={handleSendMessage}
              sendLoading={sendLoading}
            />
          </main>
        </div>

        {/* ── Mobile: Conditional panels ── */}
        <div className="md:hidden w-full flex flex-col min-h-0">
          {!selectedConversation ? (
            // Show conversation list
            <div className="flex-1 bg-white flex flex-col overflow-hidden">
              <ConversationList
                conversations={conversations}
                selectedConversation={selectedConversation}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectConversation={handleSelectConversation}
                loading={conversationsLoading}
              />
            </div>
          ) : (
            // Show chat with back nav
            <div className="flex-1 bg-white flex flex-col overflow-hidden">
              {/* Mobile back bar */}
              <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                  aria-label="Back to conversations"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back
                </button>
              </div>
              <ChatWindow
                conversation={selectedConversation}
                messages={messages}
                loading={messagesLoading}
                onSendMessage={handleSendMessage}
                sendLoading={sendLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Error banners ── */}
      {conversationsError && (
        <div
          role="alert"
          className="mx-4 mb-4 flex-shrink-0 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl"
        >
          <p className="font-semibold">Failed to load conversations</p>
          <p className="text-xs mt-1 opacity-75">
            {typeof conversationsError === 'object' && conversationsError !== null
              ? JSON.stringify(conversationsError)
              : String(conversationsError)}
          </p>
        </div>
      )}

      {messagesError && selectedConversation && (
        <div
          role="alert"
          className="mx-4 mb-4 flex-shrink-0 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl"
        >
          <p className="font-semibold">Failed to load messages</p>
          <p className="text-xs mt-1 opacity-75">
            {typeof messagesError === 'object' && messagesError !== null
              ? JSON.stringify(messagesError)
              : String(messagesError)}
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;