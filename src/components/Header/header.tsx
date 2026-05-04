import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BellIcon, Bars3Icon, LanguageIcon, ChevronDownIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { logoutApi } from "../../services/api/logoutApi";
import i18n, { supportedLanguages } from "../../i18n";
import { useTheme } from "../../contexts/ThemeContext";
import {
  useGetUnreadNotificationCountQuery,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from "../../services/api/notificationApi";
import { hasAnyPermission } from "../../utils/permissionUtils";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const roleRaw = useSelector((state: any) => state.auth.role);
  const permissions = useSelector((state: any) => state.auth.permissions);
  /** Match sidebar: roleName/roleType casing varies (e.g. superAdmin vs superadmin). */
  const roleNorm = roleRaw ? String(roleRaw).toLowerCase().trim() : "";
  const seesNotificationBell =
    roleNorm === "employer" ||
    roleNorm === "student" ||
    roleNorm === "superadmin" ||
    roleNorm === "admin" ||
    hasAnyPermission(permissions, "/notifications", roleRaw);

  const user = useSelector((state: any) => state.auth.user);
  const userInitials = (user?.full_name || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  
  // Get unread notification count for employers/superadmins and students
  const { data: unreadCountData, refetch: refetchUnreadCount } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !seesNotificationBell,
    pollingInterval: 30000, // Poll every 30 seconds for new notifications
  });
  
  // Get notifications for dropdown - enabled for employers/superadmins and students
  const { data: notificationsData, refetch: refetchNotifications } = useGetNotificationsQuery(
    { limit: 10 },
    {
      skip: !seesNotificationBell,
    }
  );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

  const unreadCount = unreadCountData?.data?.count || 0;
  const notifications = notificationsData?.data || [];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationDropdownOpen(false);
      }
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageDropdownOpen(false);
      }
      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsThemeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Refetch notifications when dropdown opens to get latest data
  useEffect(() => {
    if (isNotificationDropdownOpen && seesNotificationBell) {
      refetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotificationDropdownOpen]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.notification_id).unwrap();
        // Force refetch both queries to update the UI
        await Promise.all([
          refetchUnreadCount(),
          refetchNotifications(),
        ]);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        // Optionally show user-friendly error message
      }
    }

    // Navigate based on notification type
    try {
      if (notification.related_id) {
        if (notification.type === "job_application" && (roleNorm === "employer" || roleNorm === "superadmin")) {
          // Employer clicks job application notification -> go to job applications page
          if (notification.application?.job?.job_id) {
            navigate(`/dashboard/jobs/${notification.application.job.job_id}/applications`);
          } else {
            navigate("/dashboard/jobs/applications");
          }
        } else if (notification.type === "application_status" && roleNorm === "student") {
          // Student clicks application status notification -> go to their applications page
          navigate("/dashboard/jobs/my-applications");
        }
        setIsNotificationDropdownOpen(false);
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      // Force refetch both queries to update the UI
      await Promise.all([
        refetchUnreadCount(),
        refetchNotifications(),
      ]);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Validate date
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return t("header.justNow");
      if (diffInSeconds < 3600) return t("header.minutesAgo", { count: Math.floor(diffInSeconds / 60) });
      if (diffInSeconds < 86400) return t("header.hoursAgo", { count: Math.floor(diffInSeconds / 3600) });
      const dateLocaleMap: Record<string, string> = { af: "af-ZA", zu: "zu-ZA", sw: "sw-KE", rw: "rw-RW", fr: "fr-FR" };
      const dateLocale = dateLocaleMap[i18n.language] || "en-US";
      return date.toLocaleDateString(dateLocale, { month: "short", day: "numeric" });
    } catch (error) {
      console.error("Error formatting date:", error);
      return t("header.recently");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setIsDropdownOpen(false);

      // Call logout API
      await dispatch(logoutApi() as any);

      // Navigate to login page
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Navigate to login even if logout API fails
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="w-full bg-white/80 backdrop-blur-lg h-16 shadow-md border-b border-gray-200/50 flex items-center justify-between px-4 md:px-6 relative z-30">
      {/* Left side - Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-700 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
        aria-label="Toggle menu"
        type="button"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Center - Role + Dashboard title */}
      <div className="text-gray-700 font-semibold text-lg capitalize hidden sm:block">
        {roleRaw ? `${String(roleRaw)} ${t("header.dashboard")}` : t("header.dashboard")}
      </div>

      {/* Right side (theme + language + notification + profile) */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Theme dropdown */}
        <div className="relative" ref={themeDropdownRef}>
          <button
            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            aria-label={t("theme.label")}
            type="button"
          >
            {theme === "dark" ? (
              <MoonIcon className="h-5 w-5" />
            ) : (
              <SunIcon className="h-5 w-5" />
            )}
            <span className="text-sm font-medium hidden sm:inline">
              {theme === "dark" ? t("theme.dark") : t("theme.bright")}
            </span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          {isThemeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn theme-dropdown">
              <button
                onClick={() => {
                  setTheme("bright");
                  setIsThemeDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors flex items-center gap-2 ${
                  theme === "bright" ? "text-purple-600 font-medium bg-purple-50/50" : "text-gray-700"
                }`}
              >
                <SunIcon className="h-4 w-4" />
                {t("theme.bright")}
              </button>
              <button
                onClick={() => {
                  setTheme("dark");
                  setIsThemeDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors flex items-center gap-2 ${
                  theme === "dark" ? "text-purple-600 font-medium bg-purple-50/50" : "text-gray-700"
                }`}
              >
                <MoonIcon className="h-4 w-4" />
                {t("theme.dark")}
              </button>
            </div>
          )}
        </div>

        {/* Language dropdown */}
        <div className="relative" ref={languageDropdownRef}>
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            aria-label={t("language.label")}
            type="button"
          >
            <LanguageIcon className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:inline">
              {supportedLanguages.find((l) => l.code === i18n.language)?.label ?? t("language.english")}
            </span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          {isLanguageDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn language-dropdown">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    setIsLanguageDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${
                    i18n.language === lang.code ? "text-purple-600 font-medium bg-purple-50/50" : "text-gray-700"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification icon with dropdown */}
        {seesNotificationBell && (
          <div className="relative" ref={notificationDropdownRef}>
            <button
              onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
              className="relative cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors group"
              aria-label={`${t("header.notifications")}${unreadCount > 0 ? ` (${t("header.unreadCount", { count: unreadCount })})` : ""}`}
              type="button"
            >
              <BellIcon className="h-6 w-6 text-gray-600 group-hover:text-purple-600 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-linear-to-r from-red-500 to-red-600 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center shadow-lg" aria-label={t("header.unreadCount", { count: unreadCount })}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationDropdownOpen && (
              <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto top-16 sm:top-auto sm:right-0 mt-0 sm:mt-2 w-auto sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] sm:max-w-none bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-xl shadow-2xl z-50 animate-fadeIn overflow-hidden notification-dropdown">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{t("header.notifications")}</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      {t("header.markAllAsRead")}
                    </button>
                  )}
                </div>
                <div className="max-h-[calc(100vh-8rem)] sm:max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <BellIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>{t("header.noNotifications")}</p>
                    </div>
                  ) : (
                    notifications.map((notification: any) => (
                      <div
                        key={notification.notification_id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          !notification.is_read ? "bg-purple-50/50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                              !notification.is_read ? "bg-purple-600" : "bg-transparent"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            {notification.application && (
                              <div className="mt-2 text-xs text-gray-500 space-y-1">
                                {notification.application.student && (roleNorm === "employer" || roleNorm === "superadmin") && (
                                  <p>
                                    {t("header.student")}: <span className="font-medium">{notification.application.student.full_name}</span>
                                  </p>
                                )}
                                {notification.application.job && (
                                  <p>
                                    {t("header.job")}: <span className="font-medium">{notification.application.job.job_title}</span>
                                  </p>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button
                      onClick={() => {
                        setIsNotificationDropdownOpen(false);
                        if (roleNorm === "student") {
                          navigate("/dashboard/jobs/my-applications");
                        } else {
                          navigate("/dashboard/jobs/applications");
                        }
                      }}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      {roleNorm === "student" ? t("header.viewMyApplications") : t("header.viewAllApplications")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Avatar with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="h-10 w-10 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center cursor-pointer border-2 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 ring-2 ring-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="User menu"
            type="button"
          >
            {user?.profile_image_url ? (
              <>
                <img
                  src={user.profile_image_url.startsWith("/") ? `${(import.meta.env.VITE_API_URL || "https://api.ogera.sybellasystems.co.rw/api").replace("/api", "")}${user.profile_image_url}` : user.profile_image_url}
                  alt={user.full_name || "User"}
                  className="h-full w-full rounded-full object-cover cursor-pointer"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="text-white text-sm font-bold select-none absolute inset-0 flex items-center justify-center" style={{ zIndex: -1 }}>{userInitials}</span>
              </>
            ) : (
              <span className="text-white text-sm font-bold select-none">{userInitials}</span>
            )}
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn overflow-hidden">
              <button
                className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-linear-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 flex items-center gap-2 group cursor-pointer"
                onClick={() => {
                  setIsDropdownOpen(false);
                  window.location.href = import.meta.env.VITE_LANDING_URL || "https://ogera.sybellasystems.co.rw";
                }}
              >
                <span className="group-hover:text-purple-600 transition-colors">Home</span>
              </button>
              <button
                className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-linear-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 flex items-center gap-2 group cursor-pointer"
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate("/dashboard/profile");
                }}
              >
                <span className="group-hover:text-purple-600 transition-colors">{t("header.profile")}</span>
              </button>
              <button
                className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-linear-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group cursor-pointer"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <span className="group-hover:text-red-600 transition-colors">
                  {isLoggingOut ? t("header.loggingOut") : t("header.logout")}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
