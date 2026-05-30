import { apiSlice } from './apiSlice';
import type {
  IConversation,
  IMessage,
  ICreateConversationRequest,
} from '@/types/message.types';

export const messagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all conversations for the authenticated user
    getConversations: builder.query<
      {
        success: boolean;
        data: IConversation[];
        total: number;
        limit: number;
        offset: number;
      },
      { limit?: number; offset?: number } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.append('limit', String(params.limit));
        if (params?.offset) searchParams.append('offset', String(params.offset));
        return `/messages/conversations?${searchParams.toString()}`;
      },
      providesTags: ['Messages'],
    }),

    // Get messages for a specific conversation
    getMessages: builder.query<
      {
        success: boolean;
        data: IMessage[];
        total: number;
        limit: number;
        offset: number;
      },
      { conversationId: string; limit?: number; offset?: number }
    >({
      query: ({ conversationId, limit, offset }) => {
        const searchParams = new URLSearchParams();
        if (limit) searchParams.append('limit', String(limit));
        if (offset) searchParams.append('offset', String(offset));
        return `/messages/${conversationId}?${searchParams.toString()}`;
      },
      providesTags: (_result, _error, { conversationId }) => [
        { type: 'Messages', id: conversationId },
      ],
    }),

    // Send a message (with optional file)
    sendMessage: builder.mutation<
      { success: boolean; data: IMessage; message: string },
      { conversationId: string; content: string; file?: File }
    >({
      query: ({ conversationId, content, file }) => {
        const formData = new FormData();
        formData.append('content', content);
        if (file) {
          formData.append('file', file);
        }

        return {
          url: `/messages/${conversationId}/send`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: 'Messages', id: conversationId },
        'Messages', // Also invalidate conversations for last_message_at update
      ],
    }),

    // Create or get a conversation
    createConversation: builder.mutation<
      { success: boolean; data: IConversation; message: string },
      ICreateConversationRequest
    >({
      query: (body) => ({
        url: '/messages/conversations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Messages'],
    }),

    // Get unread message count
    getUnreadCount: builder.query<
      { success: boolean; data: { unread_count: number } },
      string
    >({
      query: (conversationId) =>
        `/messages/${conversationId}/unread-count`,
      providesTags: (_result, _error, conversationId) => [
        { type: 'Messages', id: conversationId },
      ],
    }),

    // Mark a conversation as read for the authenticated user
    markConversationRead: builder.mutation<
      { success: boolean; data: { updated: number }; message: string },
      string
    >({
      query: (conversationId) => ({
        url: `/messages/${conversationId}/read`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, conversationId) => [
        { type: 'Messages', id: conversationId },
        'Messages',
      ],
    }),

    // Delete a conversation
    deleteConversation: builder.mutation<
      { success: boolean; data: { success: boolean }; message: string },
      string
    >({
      query: (conversationId) => ({
        url: `/messages/${conversationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Messages'],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useCreateConversationMutation,
  useGetUnreadCountQuery,
  useMarkConversationReadMutation,
  useDeleteConversationMutation,
  useLazyGetConversationsQuery,
  useLazyGetMessagesQuery,
} = messagesApi;
