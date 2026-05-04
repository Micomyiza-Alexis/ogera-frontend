import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  BellIcon,
  BellAlertIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useSendAdminNotificationMutation,
} from "../services/api/notificationApi";
import { useGetAllUsersQuery } from "../services/api/usersApi";

/** Light color themes for notification cards - each card gets a different tint */
const CARD_THEMES = [
  "from-violet-50 to-purple-50 border-violet-200/80",
  "from-sky-50 to-blue-50 border-sky-200/80",
  "from-emerald-50 to-teal-50 border-emerald-200/80",
  "from-amber-50 to-yellow-50 border-amber-200/80",
  "from-rose-50 to-pink-50 border-rose-200/80",
  "from-indigo-50 to-violet-50 border-indigo-200/80",
  "from-cyan-50 to-sky-50 border-cyan-200/80",
  "from-fuchsia-50 to-pink-50 border-fuchsia-200/80",
] as const;

const getCardTheme = (index: number) => CARD_THEMES[index % CARD_THEMES.length];

function getTypeIcon(type: string) {
  switch (type) {
    case "job_application":
      return BriefcaseIcon;
    case "application_status":
      return CheckCircleIcon;
    case "job_posted":
      return MegaphoneIcon;
    default:
      return BellIcon;
  }
}

/** Map backend notification title/message to translation keys so content changes with language */
function getNotificationTranslation(notification: any): {
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, string>;
} | null {
  const title = (notification.title || "").trim();
  const message = (notification.message || "").trim();
  const type = notification.type;

  if (title === "New Dispute Assigned" && message.includes("assigned to you for review")) {
    return { titleKey: "pages.notifications.types.newDisputeAssigned", messageKey: "pages.notifications.messages.disputeAssignedToYou" };
  }
  if (title === "Dispute Update") {
    if (message.includes("has been resolved")) return { titleKey: "pages.notifications.types.disputeUpdate", messageKey: "pages.notifications.messages.disputeResolved" };
    if (message.includes("has been filed")) return { titleKey: "pages.notifications.types.disputeUpdate", messageKey: "pages.notifications.messages.disputeFiled" };
    if (message.includes("moderator has been assigned")) return { titleKey: "pages.notifications.types.disputeUpdate", messageKey: "pages.notifications.messages.moderatorAssigned" };
    if (message.includes("escalated to a senior")) return { titleKey: "pages.notifications.types.disputeUpdate", messageKey: "pages.notifications.messages.disputeEscalated" };
    if (message.includes("update on your dispute")) return { titleKey: "pages.notifications.types.disputeUpdate", messageKey: "pages.notifications.messages.disputeUpdateGeneric" };
  }
  if (type === "application_status") {
    const jobTitle = notification.application?.job?.job_title || "";
    if (title === "Application Accepted") return { titleKey: "pages.notifications.types.applicationAccepted", messageKey: "pages.notifications.messages.applicationAccepted", messageParams: { jobTitle } };
    if (title === "Application Rejected") return { titleKey: "pages.notifications.types.applicationRejected", messageKey: "pages.notifications.messages.applicationRejected", messageParams: { jobTitle } };
  }
  if (type === "job_application" && title === "New Job Application") {
    const studentName = notification.application?.student?.full_name || "";
    const jobTitle = notification.application?.job?.job_title || "";
    return { titleKey: "pages.notifications.types.newJobApplication", messageKey: "pages.notifications.messages.newJobApplication", messageParams: { studentName, jobTitle } };
  }
  return null;
}

function parseAdminSource(notification: any): {
  sourceLabel: string | null;
  cleanTitle: string;
} {
  const rawTitle = String(notification?.title || "");
  if (rawTitle.startsWith("[SuperAdmin] ")) {
    return {
      sourceLabel: "From SuperAdmin",
      cleanTitle: rawTitle.replace(/^\[SuperAdmin\]\s*/, ""),
    };
  }
  if (rawTitle.startsWith("[Admin] ")) {
    return {
      sourceLabel: "From Admin",
      cleanTitle: rawTitle.replace(/^\[Admin\]\s*/, ""),
    };
  }
  return { sourceLabel: null, cleanTitle: rawTitle };
}

const Notifications: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const role = useSelector((state: any) => state.auth.role);
  const roleNorm = role ? String(role).toLowerCase().trim() : "";
  const normalizedRole = roleNorm;
  const canSendAdminNotification = normalizedRole === "admin" || normalizedRole === "superadmin";
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [targetMode, setTargetMode] = React.useState<"specific" | "role">("role");
  const [targetRoles, setTargetRoles] = React.useState<Array<"student" | "employer">>(["student"]);
  const [targetUserIds, setTargetUserIds] = React.useState<string[]>([]);
  const [sendTitle, setSendTitle] = React.useState("");
  const [sendMessage, setSendMessage] = React.useState("");
  const [sendEmail, setSendEmail] = React.useState(true);

  // When user clicks the notification sidebar, they land here; we call GET /notifications to fetch all from DB
  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetNotificationsQuery(undefined, {
    // No skip: always call API when this page is open (e.g. after clicking sidebar)
    refetchOnMountOrArgChange: true,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const showRefreshSpinner = isRefreshing || isFetching;

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();
  const [sendAdminNotification, { isLoading: isSendingNotification }] = useSendAdminNotificationMutation();
  const { data: usersResponse, isFetching: isFetchingRecipients } = useGetAllUsersQuery(
    { page: 1, limit: 2000, type: "all" },
    { skip: !canSendAdminNotification }
  );

  // Backend returns { success, status, message, data: Notification[] } from notifications table
  const notifications = Array.isArray(apiResponse?.data) ? apiResponse.data : [];
  const allRecipientUsers = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
  const filteredRecipientUsers = allRecipientUsers.filter((user: any) => {
    const userRoleType = String(user?.role?.roleType || user?.role_type || "").toLowerCase();
    return userRoleType === "student" || userRoleType === "employer";
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      if (isNaN(date.getTime())) return t("pages.notifications.invalidDate");
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffInSeconds < 60) return t("header.justNow");
      if (diffInSeconds < 3600) return t("header.minutesAgo", { count: Math.floor(diffInSeconds / 60) });
      if (diffInSeconds < 86400) return t("header.hoursAgo", { count: Math.floor(diffInSeconds / 3600) });
      const locale = i18n.language || "en";
      const localeMap: Record<string, string> = { af: "af-ZA", zu: "zu-ZA", sw: "sw-KE", rw: "rw-RW", fr: "fr-FR" };
      const dateLocale = localeMap[locale] || `${locale}-${locale.toUpperCase()}`;
      return date.toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return t("header.recently");
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.notification_id).unwrap();
        refetch();
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    }
    if (notification.related_id) {
      if (notification.type === "job_application" && (roleNorm === "employer" || roleNorm === "superadmin")) {
        if (notification.application?.job?.job_id) {
          navigate(`/dashboard/jobs/${notification.application.job.job_id}/applications`);
        } else {
          navigate("/dashboard/jobs/applications");
        }
      } else if (notification.type === "application_status" && roleNorm === "student") {
        navigate("/dashboard/jobs/my-applications");
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const toggleRoleTarget = (roleType: "student" | "employer") => {
    setTargetRoles((prev) =>
      prev.includes(roleType) ? prev.filter((r) => r !== roleType) : [...prev, roleType]
    );
  };

  const toggleSpecificUserTarget = (userId: string) => {
    setTargetUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSendAdminNotification = async () => {
    const title = sendTitle.trim();
    const message = sendMessage.trim();
    if (!title || !message) {
      toast.error("Please enter both title and message.");
      return;
    }
    if (targetMode === "role" && targetRoles.length === 0) {
      toast.error("Please select at least one role.");
      return;
    }
    if (targetMode === "specific" && targetUserIds.length === 0) {
      toast.error("Please select at least one user.");
      return;
    }

    try {
      const response = await sendAdminNotification({
        title,
        message,
        target_mode: targetMode,
        target_roles: targetMode === "role" ? targetRoles : undefined,
        target_user_ids: targetMode === "specific" ? targetUserIds : undefined,
        send_email: sendEmail,
      }).unwrap();
      const sentCount = response?.data?.sent_count ?? 0;
      const emailCount = response?.data?.email_sent_count ?? 0;
      toast.success(`Notification sent to ${sentCount} users. Emails sent: ${emailCount}.`);
      setSendTitle("");
      setSendMessage("");
      setTargetUserIds([]);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "Failed to send notification.");
    }
  };

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25">
              <BellIcon className="h-6 w-6" />
            </span>
            {t("sidebar.notifications")}
          </h1>
          <p className="text-gray-500 mt-2">{t("pages.notifications.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || showRefreshSpinner}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            title={t("common.refresh")}
          >
            <ArrowPathIcon
              className={`h-5 w-5 shrink-0 origin-center ${showRefreshSpinner ? "animate-spin" : ""}`}
              aria-hidden
            />
            {t("common.refresh")}
          </button>
          {notifications.length > 0 && unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <BellAlertIcon className="h-5 w-5" />
              {isMarkingAll ? t("common.loading") : t("header.markAllAsRead")}
            </button>
          )}
        </div>
      </div>

      {canSendAdminNotification && (
        <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Send Notification</h2>
            <p className="text-sm text-gray-600">
              Send to selected users or to all students/employers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Title</span>
              <input
                type="text"
                value={sendTitle}
                onChange={(e) => setSendTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Notification title"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Target mode</span>
              <select
                value={targetMode}
                onChange={(e) => setTargetMode(e.target.value as "specific" | "role")}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="role">By role group</option>
                <option value="specific">Specific users</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Message</span>
            <textarea
              value={sendMessage}
              onChange={(e) => setSendMessage(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Write your notification message..."
            />
          </label>

          {targetMode === "role" ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Select recipient roles</p>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={targetRoles.includes("student")}
                    onChange={() => toggleRoleTarget("student")}
                  />
                  All students
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={targetRoles.includes("employer")}
                    onChange={() => toggleRoleTarget("employer")}
                  />
                  All employers
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Select specific users</p>
              <div className="max-h-52 overflow-auto rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                {isFetchingRecipients ? (
                  <p className="text-sm text-gray-500">Loading users...</p>
                ) : filteredRecipientUsers.length === 0 ? (
                  <p className="text-sm text-gray-500">No users found.</p>
                ) : (
                  filteredRecipientUsers.map((user: any) => (
                    <label
                      key={user.user_id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={targetUserIds.includes(user.user_id)}
                        onChange={() => toggleSpecificUserTarget(user.user_id)}
                      />
                      <span>
                        {user.full_name || user.email} (
                        {String(user?.role?.roleType || user?.role_type || "")})
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500">Selected users: {targetUserIds.length}</p>
            </div>
          )}

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Also send email
          </label>

          <div>
            <button
              type="button"
              onClick={handleSendAdminNotification}
              disabled={isSendingNotification}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSendingNotification ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-r-transparent" />
          <p className="text-gray-500 text-sm">{t("common.loading")}</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-8 text-center shadow-sm">
          <Cog6ToothIcon className="h-12 w-12 mx-auto mb-3 text-red-400" />
          <p className="font-medium text-red-700">{t("pages.notifications.failedToLoad")}</p>
          <p className="text-sm text-red-600 mt-1">{(error as any)?.data?.message || (error as any)?.message || ""}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            {t("common.retry")}
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 p-16 text-center">
          <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-lg">{t("header.noNotifications")}</p>
          <p className="text-gray-400 text-sm mt-1">{t("pages.notifications.subtitle")}</p>
        </div>
      ) : (
        <>
          {/* Summary score cards - text updates via t() when language changes, no key to avoid recreating cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200/80 p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("pages.notifications.total")}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{notifications.length}</p>
              <p className="text-xs text-gray-400 mt-1">{t("pages.notifications.totalCardDesc")}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200/80 p-5 shadow-sm">
              <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">
                {t("pages.notifications.unread")}
              </p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{unreadCount}</p>
              <p className="text-xs text-purple-500/80 mt-1">{t("pages.notifications.unreadCardDesc", { count: unreadCount })}</p>
            </div>
          </div>

          {/* All notifications - text updates via t() when language changes, no key to avoid recreating cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
            {notifications.map((notification: any, index: number) => {
              const theme = getCardTheme(index);
              const TypeIcon = getTypeIcon(notification.type);
              const trans = getNotificationTranslation(notification);
              const { sourceLabel, cleanTitle } = parseAdminSource(notification);
              const displayTitle = trans ? t(trans.titleKey) : cleanTitle;
              const displayMessage = trans
                ? (trans.messageParams ? t(trans.messageKey, trans.messageParams) : t(trans.messageKey))
                : notification.message;
              return (
                <article
                  key={notification.notification_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) => e.key === "Enter" && handleNotificationClick(notification)}
                  className={`
                    relative rounded-2xl border bg-gradient-to-br p-5 shadow-sm
                    hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer
                    ${theme}
                    ${!notification.is_read ? "ring-2 ring-purple-300/60" : ""}
                  `}
                >
                  {!notification.is_read && (
                    <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-purple-500 shadow-sm" />
                  )}
                  <div className="flex gap-4">
                    <span className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white/80 border border-white/60 shadow-sm">
                      <TypeIcon className="h-5 w-5 text-gray-600" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {sourceLabel && (
                        <p className="text-[11px] uppercase tracking-wide text-indigo-600 font-semibold mb-1">
                          {sourceLabel}
                        </p>
                      )}
                      <h3 className="font-semibold text-gray-900 leading-tight">{displayTitle}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{displayMessage}</p>
                      {notification.application && (
                        <div className="mt-3 space-y-1">
                          {notification.application.student &&
                            (roleNorm === "employer" || roleNorm === "superadmin") && (
                              <p className="text-xs text-gray-500">
                                {t("header.student")}:{" "}
                                <span className="font-medium text-gray-700">
                                  {notification.application.student.full_name}
                                </span>
                              </p>
                            )}
                          {notification.application.job && (
                            <p className="text-xs text-gray-500">
                              {t("header.job")}:{" "}
                              <span className="font-medium text-gray-700">
                                {notification.application.job.job_title}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-3 font-medium">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;
