import { apiSlice } from "./apiSlice";

export interface Notification {
  notification_id: string;
  user_id: string;
  type: "job_application" | "application_status" | "job_posted" | "system";
  title: string;
  message: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  success: boolean;
  status: number;
  data: Notification;
  message: string;
}

export interface NotificationsListResponse {
  success: boolean;
  status: number;
  data: Notification[];
  message: string;
}

export interface UnreadCountResponse {
  success: boolean;
  status: number;
  data: { count: number };
  message: string;
}

export interface MarkAllReadResponse {
  success: boolean;
  status: number;
  data: { count: number };
  message: string;
}

export interface SendAdminNotificationRequest {
  title: string;
  message: string;
  target_mode: "specific" | "role";
  target_user_ids?: string[];
  target_roles?: Array<"student" | "employer">;
  send_email?: boolean;
}

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /notifications - Fetches all notification data from the database notifications table.
     * Call this when the user opens the Notifications page (e.g. by clicking the notification sidebar).
     * Optional: is_read (boolean), limit (number). Omit limit to get all notifications.
     */
    getNotifications: builder.query<
      NotificationsListResponse,
      { is_read?: boolean; limit?: number } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params && typeof params === "object") {
          if (params.is_read !== undefined) {
            queryParams.append("is_read", String(params.is_read));
          }
          if (params.limit != null && params.limit > 0) {
            queryParams.append("limit", String(params.limit));
          }
        }
        const queryString = queryParams.toString();
        return {
          url: `/notifications${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Notification"],
    }),

    // Get unread notification count
    getUnreadNotificationCount: builder.query<UnreadCountResponse, void>({
      query: () => ({
        url: "/notifications/unread/count",
        method: "GET",
      }),
      providesTags: ["Notification"],
    }),

    // Mark notification as read
    markNotificationAsRead: builder.mutation<
      NotificationResponse,
      string
    >({
      query: (notification_id) => ({
        url: `/notifications/${notification_id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    // Mark all notifications as read
    markAllNotificationsAsRead: builder.mutation<
      MarkAllReadResponse,
      void
    >({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    // Delete notification
    deleteNotification: builder.mutation<
      { success: boolean; status: number; message: string },
      string
    >({
      query: (notification_id) => ({
        url: `/notifications/${notification_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),

    sendAdminNotification: builder.mutation<
      {
        success: boolean;
        status: number;
        data: { sent_count: number; email_sent_count: number; target_mode: string };
        message: string;
      },
      SendAdminNotificationRequest
    >({
      query: (body) => ({
        url: "/notifications/send",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useLazyGetNotificationsQuery,
  useSendAdminNotificationMutation,
} = notificationApi;




