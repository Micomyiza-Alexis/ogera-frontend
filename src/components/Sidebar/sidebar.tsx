import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { hasAnyPermission } from "../../utils/permissionUtils";
import type { Role } from "../../utils/permissionUtils";
import { SIDEBAR_MENU_CONFIG } from "../../config/sidebarMenuConfig";
import { FEATURES } from "../../config/featureFlags";
import {
  HomeIcon,
  UserCircleIcon,
  UsersIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BellIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  XMarkIcon,
  CreditCardIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FolderIcon,
  FireIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ListBulletIcon,
  CpuChipIcon,
  ClipboardDocumentListIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";
import { useListCognitiveTestsAdminQuery } from "../../services/api/cognitiveTestApi";
import { useListProblemMetricsAdminQuery } from "../../services/api/problemMetricApi";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isActiveGroup = (prefix: string) => location.pathname.startsWith(prefix);

  const roleRaw = useSelector((state: any) => state.auth.role) as Role | string | undefined;
  const permissions = useSelector((state: any) => state.auth.permissions);
  const role = roleRaw ? String(roleRaw).toLowerCase().trim() : "";

  // Check if this is a built-in admin role (superadmin or exact "admin" roleName) that bypasses permissions
  // Note: Custom admin roles like "admin1", "admin2" etc. are NOT built-in admins and must check permissions
  const isBuiltInAdmin = role === "superadmin" || role === "admin";

  // Check if this is a custom admin role (has roleType "admin" but roleName is not exactly "admin")
  // For custom admin roles, we only check permissions, not role-based checks
  const isCustomAdmin = !isBuiltInAdmin && permissions && Array.isArray(permissions) && permissions.length > 0;

  // Filter menu items based on user permissions
  const visibleMenuItems = useMemo(() => {
    // For superadmin or exact "admin" roleName, show all menu items (they bypass permissions)
    // Custom admin roles (like "admin1", "admin2") must check permissions
    if (isBuiltInAdmin) {
      return SIDEBAR_MENU_CONFIG;
    }

    // For custom admin roles and other roles, only show items they have permissions for
    // If permissions are null or empty, show nothing (only Dashboard will be visible)
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return [];
    }

    // Filter based on permissions
    return SIDEBAR_MENU_CONFIG.filter((config) => {
      return hasAnyPermission(permissions, config.permissionRoute, role);
    });
  }, [permissions, isBuiltInAdmin]);

  // Log permissions on component mount/update
  React.useEffect(() => {
    console.log('🔍 [SIDEBAR] Sidebar rendered with:');
    console.log('  - Role:', role);
    console.log('  - Is built-in admin:', isBuiltInAdmin);
    console.log('  - Is custom admin:', isCustomAdmin);
    console.log('  - Permissions:', permissions);
    console.log('  - Permissions type:', typeof permissions);
    console.log('  - Permissions is array:', Array.isArray(permissions));
    console.log('  - Visible menu items:', visibleMenuItems.length);
    if (permissions && Array.isArray(permissions)) {
      console.log('  - Permission routes:', permissions.map(p => p.route));
    }
  }, [role, permissions, visibleMenuItems, isBuiltInAdmin, isCustomAdmin]);

  const showCognitiveAdmin =
    isBuiltInAdmin || hasAnyPermission(permissions, "/cognitive-tests", role);
  const showCognitiveStudent = role === "student";
  const showCognitiveSection =
    (showCognitiveAdmin || showCognitiveStudent) &&
    role !== "verifyDocAdmin" &&
    role !== "employer";

  const skipCognitiveAdminList =
    !showCognitiveAdmin || openMenu !== "cognitive";
  const { data: cognitiveAdminList } = useListCognitiveTestsAdminQuery(undefined, {
    skip: skipCognitiveAdminList,
  });
  const cognitiveTestsForMenu = cognitiveAdminList?.data ?? [];

  const showProblemMetricAdmin =
    isBuiltInAdmin || hasAnyPermission(permissions, "/problem-metrics", role);
  const showProblemMetricStudent = role === "student";
  const showProblemMetricSection =
    (showProblemMetricAdmin || showProblemMetricStudent) &&
    role !== "verifyDocAdmin" &&
    role !== "employer";

  const skipProblemMetricAdminList =
    !showProblemMetricAdmin || openMenu !== "problemMetrics";
  const { data: problemMetricAdminList } = useListProblemMetricsAdminQuery(undefined, {
    skip: skipProblemMetricAdminList,
  });
  const problemMetricsForMenu = problemMetricAdminList?.data ?? [];

  React.useEffect(() => {
    if (location.pathname.startsWith("/dashboard/cognitive-tests")) {
      setOpenMenu("cognitive");
    }
    if (location.pathname.startsWith("/dashboard/problem-metrics")) {
      setOpenMenu("problemMetrics");
    }
  }, [location.pathname]);

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Close sidebar on mobile after navigation
  };

  const currentPathWithSearch = `${location.pathname}${location.search}`;
  const employerTaskPath = "/dashboard/jobs/tasks";
  const employerApplicantsPath = "/dashboard/jobs/applications";
  const isEmployerTasksRoute =
    location.pathname === employerTaskPath || location.pathname.endsWith("/tasks");
  const isEmployerApplicantsRoute =
    location.pathname === employerApplicantsPath || location.pathname.endsWith("/applications");

  const employerJobsSubmenu = [
    { key: "create-job", label: "Create Job", path: "/dashboard/jobs/create", icon: PlusIcon },
    { key: "unfunded-jobs", label: "Unfunded Jobs", path: "/dashboard/jobs/unfunded", icon: ClockIcon },
    { key: "my-jobs", label: "My Jobs", path: "/dashboard/jobs/all", icon: BriefcaseIcon },
    { key: "active-jobs", label: "Active Jobs", path: "/dashboard/jobs/active", icon: FireIcon },
    { key: "closed-jobs", label: "Closed Jobs", path: "/dashboard/jobs/completed", icon: CheckCircleIcon },
  ];

  const employerPaymentsSubmenu = [
    { key: "wallet-balance", label: "Wallet / Balance", path: "/dashboard/transactions?view=wallet", icon: CreditCardIcon },
    { key: "send-payments", label: "Send Payments", path: "/dashboard/transactions/pay", icon: BanknotesIcon },
    { key: "payment-history", label: "Payment History", path: "/dashboard/transactions?view=history", icon: DocumentTextIcon },
  ];

  const employerResolutionSubmenu = [
    { key: "active-disputes", label: "Active Disputes", path: "/dashboard/disputes/my-disputes", icon: ExclamationTriangleIcon },
    { key: "payment-issues", label: "Payment Issues", path: "/dashboard/disputes/create?type=payment", icon: CreditCardIcon },
    { key: "work-task-disputes", label: "Work/Task Disputes", path: "/dashboard/disputes/create?type=task", icon: BriefcaseIcon },
    { key: "resolved-cases", label: "Resolved Cases", path: "/dashboard/disputes/resolved", icon: CheckCircleIcon },
  ];

  const employerSettingsSubmenu = [
    { key: "company-profile", label: "Company Profile", path: "/dashboard/profile", icon: BuildingOfficeIcon },
    { key: "account", label: "Account", path: "/dashboard/settings/account", icon: UserGroupIcon },
    { key: "security", label: "Security", path: "/dashboard/settings/security", icon: ShieldCheckIcon },
  ];

  const activeEmployerJobsItem =
    employerJobsSubmenu.find((item) => isActive(item.path))?.label ||
    (location.pathname.startsWith("/dashboard/jobs/") ? "Jobs" : "");

  const activeEmployerPaymentsItem =
    employerPaymentsSubmenu.find((item) => currentPathWithSearch === item.path)?.label ||
    (isActiveGroup("/dashboard/transactions") ? "Payments" : "");

  const activeEmployerResolutionItem =
    employerResolutionSubmenu.find((item) => currentPathWithSearch === item.path || location.pathname === item.path)?.label ||
    (isActiveGroup("/dashboard/disputes") ? "Resolution Center" : "");

  const activeEmployerSettingsItem =
    employerSettingsSubmenu.find((item) => currentPathWithSearch === item.path)?.label ||
    (isActiveGroup("/dashboard/profile") ? "Settings" : "");

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          h-screen w-64 bg-[#101828] text-white flex flex-col fixed left-0 top-0
          overflow-y-auto scrollbar-hide shadow-2xl z-50 transition-transform duration-300
          lg:translate-x-0 lg:rounded-tr-3xl lg:rounded-br-3xl border-r border-[#1D2939]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between p-6 border-b border-[#1D2939]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#7F56D9] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#7F56D9]/30">
              O
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                Ogera
              </h2>
                <p className="text-xs text-white/50 uppercase font-medium">
                {String(roleRaw || "").toUpperCase()}
              </p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1D2939]"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* ========================= ROLE-BASED MENU ========================= */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Dashboard - All Users */}
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
              isActive("/dashboard")
                ? "bg-[#9F7AEA]/15 text-white border-l-2 border-[#9F7AEA]"
                : "hover:bg-[#9F7AEA]/10"
            }`}
            onClick={() => handleNavigation("/dashboard")}
          >
            <HomeIcon className={`h-5 w-5 transition-colors ${isActive("/dashboard") ? "text-white" : "text-white/70 group-hover:text-white"}`} />
            <span className={`font-medium transition-colors ${isActive("/dashboard") ? "text-white" : "group-hover:text-white"}`}>
              {t("sidebar.dashboard")}
            </span>
          </div>

          {/* Profile - All Users */}
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
              isActive("/dashboard/profile")
                ? "bg-[#9F7AEA]/15 text-white border-l-2 border-[#9F7AEA]"
                : "hover:bg-[#9F7AEA]/10"
            }`}
            onClick={() => handleNavigation("/dashboard/profile")}
          >
            <UserCircleIcon className={`h-5 w-5 transition-colors ${isActive("/dashboard/profile") ? "text-white" : "text-white/70 group-hover:text-white"}`} />
            <span className={`font-medium transition-colors ${isActive("/dashboard/profile") ? "text-white" : "group-hover:text-white"}`}>
              {t("sidebar.profile")}
            </span>
          </div>

          {/* Interviews - Students only */}
          {role === "student" && (
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                isActive("/dashboard/interviews")
                  ? "bg-[#9F7AEA]/15 text-white border-l-2 border-[#9F7AEA]"
                  : "hover:bg-[#9F7AEA]/10"
              }`}
              onClick={() => handleNavigation("/dashboard/interviews")}
            >
              <CalendarDaysIcon className={`h-5 w-5 transition-colors ${isActive("/dashboard/interviews") ? "text-white" : "text-white/70 group-hover:text-white"}`} />
              <span className={`font-medium transition-colors ${isActive("/dashboard/interviews") ? "text-white" : "group-hover:text-white"}`}>
                {t("sidebar.interviews")}
              </span>
            </div>
          )}

          {/* Notifications - All Users */}
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
              isActive("/dashboard/notifications")
                ? "bg-[#9F7AEA]/15 text-white border-l-2 border-[#9F7AEA]"
                : "hover:bg-[#9F7AEA]/10"
            }`}
            onClick={() => handleNavigation("/dashboard/notifications")}
          >
            <BellIcon className={`h-5 w-5 transition-colors ${isActive("/dashboard/notifications") ? "text-white" : "text-white/70 group-hover:text-white"}`} />
            <span className={`font-medium transition-colors ${isActive("/dashboard/notifications") ? "text-white" : "group-hover:text-white"}`}>
              {t("sidebar.notifications")}
            </span>
          </div>

          {/* Employer-specific Jobs menu — replaces the shared Jobs menu below for employers */}
          {role === "employer" && (
            <>
              <div>
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                    isActiveGroup("/dashboard/jobs") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"
                  }`}
                  onClick={() => toggleMenu("employer-jobs")}
                >
                  <div className="flex items-center gap-3">
                    <BriefcaseIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-white transition-colors">Jobs</span>
                      {isActiveGroup("/dashboard/jobs") && openMenu !== "employer-jobs" && (
                        <span className="text-xs text-[#9F7AEA] font-medium">
                          {activeEmployerJobsItem}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                      openMenu === "employer-jobs" ? "rotate-180 text-white" : ""
                    }`}
                  />
                </div>

                {openMenu === "employer-jobs" && (
                  <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                    {employerJobsSubmenu.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <li
                          key={item.key}
                          className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                            isActive(item.path)
                              ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                              : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                          }`}
                          onClick={() => handleNavigation(item.path)}
                        >
                          <ItemIcon
                            className={`h-4 w-4 transition-colors ${
                              isActive(item.path)
                                ? "text-[#9F7AEA]"
                                : "text-white/40 group-hover/item:text-[#9F7AEA]"
                            }`}
                          />
                          <span
                            className={`transition-colors ${
                              isActive(item.path) ? "text-white font-medium" : "group-hover/item:text-white"
                            }`}
                          >
                            {item.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                  isEmployerTasksRoute
                    ? "bg-[#9F7AEA]/15 text-white border-l-2 border-[#9F7AEA]"
                    : "hover:bg-[#9F7AEA]/10"
                }`}
                onClick={() => handleNavigation(employerTaskPath)}
              >
                <ListBulletIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                <span className="font-medium group-hover:text-white transition-colors">
                  Tasks
                </span>
              </div>

              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                  isEmployerApplicantsRoute
                    ? "bg-[#9F7AEA]/15 text-white border-l-2 border-[#9F7AEA]"
                    : "hover:bg-[#9F7AEA]/10"
                }`}
                onClick={() => handleNavigation(employerApplicantsPath)}
              >
                <EyeIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                <span className="font-medium group-hover:text-white transition-colors">
                  Applicants
                </span>
              </div>

              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                  isActive("/dashboard/messages")
                    ? "bg-[#9F7AEA]/15 text-white border-l-2 border-[#9F7AEA]"
                    : "hover:bg-[#9F7AEA]/10"
                }`}
                onClick={() => handleNavigation("/dashboard/messages")}
              >
                <BellIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                <span className="font-medium group-hover:text-white transition-colors">
                  Messages
                </span>
              </div>

              <div>
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                    isActiveGroup("/dashboard/transactions") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"
                  }`}
                  onClick={() => toggleMenu("employer-payments")}
                >
                  <div className="flex items-center gap-3">
                    <CreditCardIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-white transition-colors">Payments</span>
                      {isActiveGroup("/dashboard/transactions") && openMenu !== "employer-payments" && (
                        <span className="text-xs text-[#9F7AEA] font-medium">
                          {activeEmployerPaymentsItem}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                      openMenu === "employer-payments" ? "rotate-180 text-white" : ""
                    }`}
                  />
                </div>

                {openMenu === "employer-payments" && (
                  <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                    {employerPaymentsSubmenu.map((item) => {
                      const ItemIcon = item.icon;
                      const isPaymentItemActive = currentPathWithSearch === item.path;

                      return (
                        <li
                          key={item.key}
                          className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                            isPaymentItemActive
                              ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                              : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                          }`}
                          onClick={() => handleNavigation(item.path)}
                        >
                          <ItemIcon
                            className={`h-4 w-4 transition-colors ${
                              isPaymentItemActive
                                ? "text-[#9F7AEA]"
                                : "text-white/40 group-hover/item:text-[#9F7AEA]"
                            }`}
                          />
                          <span
                            className={`transition-colors ${
                              isPaymentItemActive ? "text-white font-medium" : "group-hover/item:text-white"
                            }`}
                          >
                            {item.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Resolution Center - Hidden in V1 via Feature Flag */}
              {FEATURES.RESOLUTION_CENTER && (
              <div>
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                    isActiveGroup("/dashboard/disputes") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"
                  }`}
                  onClick={() => toggleMenu("employer-resolution")}
                >
                  <div className="flex items-center gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-white transition-colors">Resolution Center</span>
                      {isActiveGroup("/dashboard/disputes") && openMenu !== "employer-resolution" && (
                        <span className="text-xs text-[#9F7AEA] font-medium">
                          {activeEmployerResolutionItem}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                      openMenu === "employer-resolution" ? "rotate-180 text-white" : ""
                    }`}
                  />
                </div>

                {openMenu === "employer-resolution" && (
                  <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                    {employerResolutionSubmenu.map((item) => {
                      const ItemIcon = item.icon;
                      const isResolutionItemActive =
                        currentPathWithSearch === item.path || location.pathname === item.path;

                      return (
                        <li
                          key={item.key}
                          className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                            isResolutionItemActive
                              ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                              : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                          }`}
                          onClick={() => handleNavigation(item.path)}
                        >
                          <ItemIcon
                            className={`h-4 w-4 transition-colors ${
                              isResolutionItemActive
                                ? "text-[#9F7AEA]"
                                : "text-white/40 group-hover/item:text-[#9F7AEA]"
                            }`}
                          />
                          <span
                            className={`transition-colors ${
                              isResolutionItemActive ? "text-white font-medium" : "group-hover/item:text-white"
                            }`}
                          >
                            {item.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              )}

              {/* Settings - Hidden in V1 via Feature Flag */}
              {FEATURES.SETTINGS && (
              <div>
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                    isActiveGroup("/dashboard/profile") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"
                  }`}
                  onClick={() => toggleMenu("employer-settings")}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-white transition-colors">Settings</span>
                      {isActiveGroup("/dashboard/profile") && openMenu !== "employer-settings" && (
                        <span className="text-xs text-[#9F7AEA] font-medium">
                          {activeEmployerSettingsItem}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                      openMenu === "employer-settings" ? "rotate-180 text-white" : ""
                    }`}
                  />
                </div>

                {openMenu === "employer-settings" && (
                  <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                    {employerSettingsSubmenu.map((item) => {
                      const ItemIcon = item.icon;
                      const isSettingsItemActive = currentPathWithSearch === item.path;

                      return (
                        <li
                          key={item.key}
                          className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                            isSettingsItemActive
                              ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                              : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                          }`}
                          onClick={() => handleNavigation(item.path)}
                        >
                          <ItemIcon
                            className={`h-4 w-4 transition-colors ${
                              isSettingsItemActive
                                ? "text-[#9F7AEA]"
                                : "text-white/40 group-hover/item:text-[#9F7AEA]"
                            }`}
                          />
                          <span
                            className={`transition-colors ${
                              isSettingsItemActive ? "text-white font-medium" : "group-hover/item:text-white"
                            }`}
                          >
                            {item.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              )}
            </>
          )}

          {/* For verifyDocAdmin: Show only Academic Verification */}
          {role === "verifyDocAdmin" && (
            <div>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActiveGroup("/dashboard/academic") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                onClick={() => toggleMenu("academic")}
              >
                <div className="flex items-center gap-3">
                  <AcademicCapIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                  <div className="flex flex-col">
                    <span className="font-medium group-hover:text-white transition-colors">
                      {t("sidebar.academicVerification")}
                    </span>
                    {isActiveGroup("/dashboard/academic") && openMenu !== "academic" && (
                      <span className="text-xs text-[#9F7AEA] font-medium">
                        {location.pathname === "/dashboard/academic/pending" && t("sidebar.pendingReviews")}
                        {location.pathname === "/dashboard/academic/approved" && t("sidebar.approved")}
                        {location.pathname === "/dashboard/academic/rejected" && t("sidebar.rejected")}
                        {location.pathname === "/dashboard/academic/resubmission-required" && t("sidebar.resubmissionRequired")}
                        {/* {location.pathname === "/dashboard/academic/performance" && t("sidebar.performanceTrack")} */}
                        {/* {location.pathname === "/dashboard/academic/locks" && t("sidebar.accountLocks")} */}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                    openMenu === "academic" ? "rotate-180 text-white" : ""
                  }`}
                />
              </div>

              {openMenu === "academic" && (
                <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/pending")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/pending")
                    }
                  >
                    <ClockIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/pending")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/pending")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.pendingReviews")}
                    </span>
                  </li>
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/approved")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/approved")
                    }
                  >
                    <CheckCircleIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/approved")
                        ? "text-green-400"
                        : "text-white/40 group-hover/item:text-green-400"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/approved")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.approved")}
                    </span>
                  </li>
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/rejected")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/rejected")
                    }
                  >
                    <XCircleIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/rejected")
                        ? "text-red-400"
                        : "text-white/40 group-hover/item:text-red-400"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/rejected")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.rejected")}
                    </span>
                  </li>
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/resubmission-required")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/resubmission-required")
                    }
                  >
                    <ArrowPathIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/resubmission-required")
                        ? "text-amber-400"
                        : "text-white/40 group-hover/item:text-amber-400"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/resubmission-required")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.resubmissionRequired")}
                    </span>
                  </li>
                  {/* <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/performance")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/performance")
                    }
                  >
                    <ChartBarSquareIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/performance")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/performance")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      Performance Track
                    </span>
                  </li> */}
                  {/* <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/locks")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/locks")
                    }
                  >
                    <LockClosedIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/locks")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/locks")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      Account Locks
                    </span>
                  </li> */}
                </ul>
              )}
            </div>
          )}

          {/* User - Admin/SuperAdmin with permission check */}
          {(isBuiltInAdmin || hasAnyPermission(permissions, "/users", role)) && (
            <div>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActiveGroup("/dashboard/users") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                onClick={() => toggleMenu("users")}
              >
                <div className="flex items-center gap-3">
                  <UsersIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                  <div className="flex flex-col">
                    <span className="font-medium group-hover:text-white transition-colors">
                      {t("sidebar.user")}
                    </span>
                    {isActiveGroup("/dashboard/users") && openMenu !== "users" && (
                      <span className="text-xs text-[#9F7AEA] font-medium">
                        {location.pathname === "/dashboard/users/all" && t("sidebar.allUsers")}
                        {location.pathname === "/dashboard/users/students" && t("sidebar.students")}
                        {location.pathname === "/dashboard/users/employers" && t("sidebar.employers")}
                        {/* {location.pathname === "/dashboard/users/pending" && "Pending Approval"} */}
                        {/* {location.pathname === "/dashboard/users/suspended" && "Suspended"} */}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                    openMenu === "users" ? "rotate-180 text-white" : ""
                  }`}
                />
              </div>

              {openMenu === "users" && (
                <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/users/all")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() => handleNavigation("/dashboard/users/all")}
                  >
                    <UserGroupIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/users/all")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/users/all")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.allUsers")}
                    </span>
                  </li>
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/users/students")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/users/students")
                    }
                  >
                    <AcademicCapIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/users/students")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/users/students")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.students")}
                    </span>
                  </li>
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/users/employers")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/users/employers")
                    }
                  >
                    <BuildingOfficeIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/users/employers")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/users/employers")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.employers")}
                    </span>
                  </li>
                  {/* <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/users/pending")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() => handleNavigation("/dashboard/users/pending")}
                  >
                    <ClockIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/users/pending")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/users/pending")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      Pending Approval
                    </span>
                  </li> */}
                  {/* <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/users/suspended")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/users/suspended")
                    }
                  >
                    <NoSymbolIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/users/suspended")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/users/suspended")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      Suspended
                    </span>
                  </li> */}
                </ul>
              )}
            </div>
          )}

          {/* Admin - Only SuperAdmin */}
          {role === "superadmin" && (
            <div>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActiveGroup("/dashboard/admin") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                onClick={() => toggleMenu("admin")}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                  <div className="flex flex-col">
                    <span className="font-medium group-hover:text-white transition-colors">
                      {t("sidebar.admin")}
                    </span>
                    {isActiveGroup("/dashboard/admin") && openMenu !== "admin" && (
                      <span className="text-xs text-[#9F7AEA] font-medium">
                        {location.pathname === "/dashboard/admin/create" && t("sidebar.create")}
                        {location.pathname === "/dashboard/admin/view" && t("sidebar.view")}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                    openMenu === "admin" ? "rotate-180 text-white" : ""
                  }`}
                />
              </div>

              {openMenu === "admin" && (
                <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/admin/create")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() => handleNavigation("/dashboard/admin/create")}
                  >
                    <PlusIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/admin/create")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/admin/create")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.create")}
                    </span>
                  </li>
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/admin/view")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() => handleNavigation("/dashboard/admin/view")}
                  >
                    <EyeIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/admin/view")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/admin/view")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.view")}
                    </span>
                  </li>
                </ul>
              )}
            </div>
          )}

          {/* Permission - Only SuperAdmin */}
          {role === "superadmin" && (
            <div>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActiveGroup("/dashboard/permission") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                onClick={() => toggleMenu("permission")}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                  <div className="flex flex-col">
                    <span className="font-medium group-hover:text-white transition-colors">
                      {t("sidebar.permission")}
                    </span>
                    {isActiveGroup("/dashboard/permission") && openMenu !== "permission" && (
                      <span className="text-xs text-[#9F7AEA] font-medium">
                        {location.pathname === "/dashboard/permission/create" && t("sidebar.create")}
                        {location.pathname === "/dashboard/permission/view" && t("sidebar.view")}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                    openMenu === "permission" ? "rotate-180 text-white" : ""
                  }`}
                />
              </div>

              {openMenu === "permission" && (
                <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/permission/create")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() => handleNavigation("/dashboard/permission/create")}
                  >
                    <PlusIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/permission/create")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/permission/create")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.create")}
                    </span>
                  </li>
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/permission/view")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() => handleNavigation("/dashboard/permission/view")}
                  >
                    <EyeIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/permission/view")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/permission/view")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.view")}
                    </span>
                  </li>
                </ul>
              )}
            </div>
          )}

          {/* Role - Only SuperAdmin */}
          {role === "superadmin" && (
            <div>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActiveGroup("/dashboard/role") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                onClick={() => toggleMenu("role")}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                  <div className="flex flex-col">
                    <span className="font-medium group-hover:text-white transition-colors">
                      {t("sidebar.role")}
                    </span>
                    {isActiveGroup("/dashboard/role") && openMenu !== "role" && (
                      <span className="text-xs text-[#9F7AEA] font-medium">
                        {location.pathname === "/dashboard/role/create" && t("sidebar.create")}
                        {location.pathname === "/dashboard/role/view" && t("sidebar.view")}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                    openMenu === "role" ? "rotate-180 text-white" : ""
                  }`}
                />
              </div>

              {openMenu === "role" && (
                <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/role/create")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() => handleNavigation("/dashboard/role/create")}
                  >
                    <PlusIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/role/create")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/role/create")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.create")}
                    </span>
                  </li>
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/role/view")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() => handleNavigation("/dashboard/role/view")}
                  >
                    <EyeIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/role/view")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/role/view")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.view")}
                    </span>
                  </li>
                </ul>
              )}
            </div>
          )}

          {/* Academic Verification - Student, Admin, or users with permission (not verifyDocAdmin, already shown above, not employer) */}
          {(() => {
            const roleCheck = role === "student" || isBuiltInAdmin;
            const permissionCheck = hasAnyPermission(permissions, "/academic-verifications", role);
            const shouldShow = (roleCheck || permissionCheck) && role !== "verifyDocAdmin" && role !== "employer";
            
            console.log('🔍 [SIDEBAR] Academic Verification check:');
            console.log('  - Role:', role);
            console.log('  - Is built-in admin:', isBuiltInAdmin);
            console.log('  - Role check (student/built-in-admin):', roleCheck);
            console.log('  - Permission check result:', permissionCheck);
            console.log('  - Should show:', shouldShow);
            
            return shouldShow;
          })() && (
            <div>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActiveGroup("/dashboard/academic") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                onClick={() => toggleMenu("academic")}
              >
                <div className="flex items-center gap-3">
                  <AcademicCapIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                  <div className="flex flex-col">
                    <span className="font-medium group-hover:text-white transition-colors">
                      {t("sidebar.academicVerification")}
                    </span>
                    {isActiveGroup("/dashboard/academic") && openMenu !== "academic" && (
                      <span className="text-xs text-[#9F7AEA] font-medium">
                        {location.pathname === "/dashboard/academic/pending" && t("sidebar.pendingReviews")}
                        {location.pathname === "/dashboard/academic/approved" && t("sidebar.approved")}
                        {location.pathname === "/dashboard/academic/rejected" && t("sidebar.rejected")}
                        {location.pathname === "/dashboard/academic/resubmission-required" && t("sidebar.resubmissionRequired")}
                        {location.pathname === "/dashboard/academic/performance" && t("sidebar.performanceTrack")}
                        {/* {location.pathname === "/dashboard/academic/locks" && t("sidebar.accountLocks")} */}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                    openMenu === "academic" ? "rotate-180 text-white" : ""
                  }`}
                />
              </div>

              {openMenu === "academic" && (
                <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/pending")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/pending")
                    }
                  >
                    <ClockIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/pending")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/pending")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.pendingReviews")}
                    </span>
                  </li>
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/approved")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/approved")
                    }
                  >
                    <CheckCircleIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/approved")
                        ? "text-green-400"
                        : "text-white/40 group-hover/item:text-green-400"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/approved")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.approved")}
                    </span>
                  </li>
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/rejected")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/rejected")
                    }
                  >
                    <XCircleIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/rejected")
                        ? "text-red-400"
                        : "text-white/40 group-hover/item:text-red-400"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/rejected")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.rejected")}
                    </span>
                  </li>
                  <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/resubmission-required")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/resubmission-required")
                    }
                  >
                    <ArrowPathIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/resubmission-required")
                        ? "text-amber-400"
                        : "text-white/40 group-hover/item:text-amber-400"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/resubmission-required")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      {t("sidebar.resubmissionRequired")}
                    </span>
                  </li>
                  {/* <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/performance")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/performance")
                    }
                  >
                    <ChartBarSquareIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/performance")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/performance")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      Performance Track
                    </span>
                  </li> */}
                  {/* <li
                    className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                      isActive("/dashboard/academic/locks")
                        ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                        : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                    }`}
                    onClick={() =>
                      handleNavigation("/dashboard/academic/locks")
                    }
                  >
                    <LockClosedIcon className={`h-4 w-4 transition-colors ${
                      isActive("/dashboard/academic/locks")
                        ? "text-[#9F7AEA]"
                        : "text-white/40 group-hover/item:text-[#9F7AEA]"
                    }`} />
                    <span className={`transition-colors ${
                      isActive("/dashboard/academic/locks")
                        ? "text-white font-medium"
                        : "group-hover/item:text-white"
                    }`}>
                      Account Locks
                    </span>
                  </li> */}
                </ul>
              )}
            </div>
          )}

          {/* Jobs - Student, Employer, Admin, or users with permission (not verifyDocAdmin) */}
          {(role === "student" || role === "superadmin") && (
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                isActive("/dashboard/academic-records")
                  ? "bg-[#9F7AEA]/15 text-white border-l-2 border-[#9F7AEA]"
                  : "hover:bg-[#9F7AEA]/10"
              }`}
              onClick={() => handleNavigation("/dashboard/academic-records")}
            >
              <ClipboardDocumentListIcon
                className={`h-5 w-5 transition-colors ${
                  isActive("/dashboard/academic-records")
                    ? "text-white"
                    : "text-white/70 group-hover:text-white"
                }`}
              />
              <span
                className={`font-medium transition-colors ${
                  isActive("/dashboard/academic-records")
                    ? "text-white"
                    : "group-hover:text-white"
                }`}
              >
                Academic Records
              </span>
            </div>
          )}

          {role === "student" && (
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                isActive("/dashboard/tasks")
                  ? "bg-[#9F7AEA]/15 text-white border-l-2 border-[#9F7AEA]"
                  : "hover:bg-[#9F7AEA]/10"
              }`}
              onClick={() => handleNavigation("/dashboard/tasks")}
            >
              <ListBulletIcon className={`h-5 w-5 transition-colors ${isActive("/dashboard/tasks") ? "text-white" : "text-white/70 group-hover:text-white"}`} />
              <span className={`font-medium transition-colors ${isActive("/dashboard/tasks") ? "text-white" : "group-hover:text-white"}`}>
                Tasks
              </span>
            </div>
          )}

          {/* Jobs - Student, Employer, Admin, or users with permission (not verifyDocAdmin) */}
          {/* Jobs - Student, Admin, or users with permission (not verifyDocAdmin).
              Employers use their own dedicated Jobs menu rendered above. */}
          {(() => {
            // Employers are excluded here because they get a dedicated employer Jobs menu above.
            const roleCheck = role === "student" || isBuiltInAdmin;
            const permissionCheck = hasAnyPermission(permissions, "/jobs", role);
            const shouldShow = (roleCheck || permissionCheck) && role !== "verifyDocAdmin" && role !== "employer";
            
            console.log('🔍 [SIDEBAR] Jobs check:');
            console.log('  - Role:', role);
            console.log('  - Is built-in admin:', isBuiltInAdmin);
            console.log('  - Is custom admin:', isCustomAdmin);
            console.log('  - Role check (student/employer/built-in-admin):', roleCheck);
            console.log('  - Permission check result:', permissionCheck);
            console.log('  - Should show:', shouldShow);
            
            return shouldShow;
          })() && (
              <div>
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActiveGroup("/dashboard/jobs") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                  onClick={() => toggleMenu("jobs")}
                >
                  <div className="flex items-center gap-3">
                    <BriefcaseIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-white transition-colors">
                        {t("sidebar.jobs")}
                      </span>
                      {isActiveGroup("/dashboard/jobs") && openMenu !== "jobs" && (
                        <span className="text-xs text-[#9F7AEA] font-medium">
                          {location.pathname === "/dashboard/jobs/create" && t("sidebar.createJob")}
                          {location.pathname === "/dashboard/jobs/applications" && t("sidebar.applications")}
                          {location.pathname === "/dashboard/jobs/applications/accepted" && t("sidebar.approved")}
                          {location.pathname === "/dashboard/jobs/applications/rejected" && t("sidebar.rejected")}
                          {location.pathname === "/dashboard/jobs/my-applications" && t("sidebar.myApplications")}
                          {location.pathname === "/dashboard/jobs/my-applications/accepted" && t("sidebar.approved")}
                          {location.pathname === "/dashboard/jobs/my-applications/rejected" && t("sidebar.rejected")}
                          {location.pathname === "/dashboard/jobs/my-applications/completed" && t("sidebar.completed")}
                          {location.pathname === "/dashboard/jobs/categories" && t("sidebar.jobCategories")}
                          {location.pathname === "/dashboard/jobs/all" && t("sidebar.allJobs")}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                      openMenu === "jobs" ? "rotate-180 text-white" : ""
                    }`}
                  />
                </div>

                {openMenu === "jobs" && (
                  <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                    {(role === "employer" || role === "superadmin") && (
                      <>
                        <li
                          className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                          onClick={() => handleNavigation("/dashboard/jobs/create")}
                        >
                          <PlusIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA] transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                            {t("sidebar.createJob")}
                          </span>
                        </li>
                        <li
                          className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                          onClick={() => handleNavigation("/dashboard/jobs/unfunded")}
                        >
                          <ClockIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA] transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                            Unfunded Jobs
                          </span>
                        </li>
                        <li
                          className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                          onClick={() => handleNavigation("/dashboard/jobs/applications")}
                        >
                          <BriefcaseIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA] transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                            {t("sidebar.applications")}
                          </span>
                        </li>
                        <li
                          className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                          onClick={() => handleNavigation("/dashboard/jobs/applications/accepted")}
                        >
                          <CheckCircleIcon className="h-4 w-4 text-white/40 group-hover/item:text-green-400 transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                            {t("sidebar.approved")}
                          </span>
                        </li>
                        <li
                          className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                          onClick={() => handleNavigation("/dashboard/jobs/applications/rejected")}
                        >
                          <XCircleIcon className="h-4 w-4 text-white/40 group-hover/item:text-red-400 transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                            {t("sidebar.rejected")}
                          </span>
                        </li>
                      </>
                    )}
                    {role === "student" && (
                      <>
                        <li
                          className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                          onClick={() => handleNavigation("/dashboard/jobs/my-applications")}
                        >
                          <BriefcaseIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA] transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                            {t("sidebar.myApplications")}
                          </span>
                        </li>
                        <li
                          className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                          onClick={() => handleNavigation("/dashboard/jobs/my-applications/accepted")}
                        >
                          <CheckCircleIcon className="h-4 w-4 text-white/40 group-hover/item:text-green-400 transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                            {t("sidebar.approved")}
                          </span>
                        </li>
                        <li
                          className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                          onClick={() => handleNavigation("/dashboard/jobs/my-applications/rejected")}
                        >
                          <XCircleIcon className="h-4 w-4 text-white/40 group-hover/item:text-red-400 transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                            {t("sidebar.rejected")}
                          </span>
                        </li>
                      </>
                    )}
                    <li
                      className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                      onClick={() => handleNavigation("/dashboard/jobs/all")}
                    >
                      <FolderIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA] transition-colors" />
                      <span className="text-white/60 group-hover/item:text-white transition-colors">
                        {t("sidebar.allJobs")}
                      </span>
                    </li>
                    <li
                      className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                      onClick={() => handleNavigation("/dashboard/jobs/active")}
                    >
                      <FireIcon className="h-4 w-4 text-white/40 group-hover/item:text-orange-400 transition-colors" />
                      <span className="text-white/60 group-hover/item:text-white transition-colors">
                        {t("sidebar.activeJobs")}
                      </span>
                    </li>
                    <li
                      className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                      onClick={() =>
                        handleNavigation("/dashboard/jobs/completed")
                      }
                    >
                      <CheckBadgeIcon className="h-4 w-4 text-white/40 group-hover/item:text-green-400 transition-colors" />
                      <span className="text-white/60 group-hover/item:text-white transition-colors">
                        {t("sidebar.completed")}
                      </span>
                    </li>
                    {/* {isBuiltInAdmin && (
                      <li
                        className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                        onClick={() =>
                          handleNavigation("/dashboard/jobs/pending")
                        }
                      >
                        <ClockIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA] transition-colors" />
                        <span className="text-white/60 group-hover/item:text-white transition-colors">
                          Pending Approval
                        </span>
                      </li>
                    )} */}
                    {isBuiltInAdmin && (
                      <li
                        className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                        onClick={() =>
                          handleNavigation("/dashboard/jobs/categories")
                        }
                      >
                        <BriefcaseIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA] transition-colors" />
                        <span className="text-white/60 group-hover/item:text-white transition-colors">
                          {t("sidebar.jobCategories")}
                        </span>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}

          {showCognitiveSection && (
            <div>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                  isActiveGroup("/dashboard/cognitive-tests")
                    ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]"
                    : "hover:bg-[#9F7AEA]/10"
                }`}
                onClick={() => toggleMenu("cognitive")}
              >
                <div className="flex items-center gap-3">
                  <CpuChipIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                  <span className="font-medium group-hover:text-white transition-colors">
                    {t("sidebar.cognitiveTests", { defaultValue: "Cognitive tests" })}
                  </span>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                    openMenu === "cognitive" ? "rotate-180 text-white" : ""
                  }`}
                />
              </div>

              {openMenu === "cognitive" && (
                <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn max-h-64 overflow-y-auto scrollbar-hide">
                  {showCognitiveStudent && (
                    <li
                      className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                        isActive("/dashboard/cognitive-tests/available")
                          ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                          : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                      }`}
                      onClick={() => handleNavigation("/dashboard/cognitive-tests/available")}
                    >
                      <CpuChipIcon
                        className={`h-4 w-4 ${
                          isActive("/dashboard/cognitive-tests/available")
                            ? "text-[#9F7AEA]"
                            : "text-white/40 group-hover/item:text-[#9F7AEA]"
                        }`}
                      />
                      <span
                        className={
                          isActive("/dashboard/cognitive-tests/available")
                            ? "text-white font-medium"
                            : "group-hover/item:text-white"
                        }
                      >
                        {t("sidebar.cognitivePractice", { defaultValue: "Practice tests" })}
                      </span>
                    </li>
                  )}
                  {showCognitiveAdmin && (
                    <li
                      className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                        isActive("/dashboard/cognitive-tests") &&
                        !location.pathname.includes("/edit/") &&
                        !location.pathname.includes("/available") &&
                        !location.pathname.includes("/attempt/")
                          ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                          : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                      }`}
                      onClick={() => handleNavigation("/dashboard/cognitive-tests")}
                    >
                      <PlusIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA]" />
                      <span className="group-hover/item:text-white">
                        {t("sidebar.cognitiveManage", { defaultValue: "Manage tests" })}
                      </span>
                    </li>
                  )}
                  {showCognitiveAdmin &&
                    cognitiveTestsForMenu.map((ct) => (
                      <li
                        key={ct.cognitive_test_id}
                        className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                          location.pathname === `/dashboard/cognitive-tests/edit/${ct.cognitive_test_id}`
                            ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                            : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                        }`}
                        onClick={() =>
                          handleNavigation(`/dashboard/cognitive-tests/edit/${ct.cognitive_test_id}`)
                        }
                      >
                        <DocumentTextIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA]" />
                        <span
                          className={`truncate max-w-[11rem] ${
                            location.pathname === `/dashboard/cognitive-tests/edit/${ct.cognitive_test_id}`
                              ? "text-white font-medium"
                              : "group-hover/item:text-white"
                          }`}
                          title={ct.title}
                        >
                          {ct.title}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          {showProblemMetricSection && (
            <div>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                  isActiveGroup("/dashboard/problem-metrics")
                    ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]"
                    : "hover:bg-[#9F7AEA]/10"
                }`}
                onClick={() => toggleMenu("problemMetrics")}
              >
                <div className="flex items-center gap-3">
                  <PuzzlePieceIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                  <span className="font-medium group-hover:text-white transition-colors">
                    {t("sidebar.problemMetrics", { defaultValue: "Problem metrics" })}
                  </span>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                    openMenu === "problemMetrics" ? "rotate-180 text-white" : ""
                  }`}
                />
              </div>

              {openMenu === "problemMetrics" && (
                <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn max-h-64 overflow-y-auto scrollbar-hide">
                  {showProblemMetricStudent && (
                    <li
                      className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                        isActive("/dashboard/problem-metrics/available")
                          ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                          : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                      }`}
                      onClick={() => handleNavigation("/dashboard/problem-metrics/available")}
                    >
                      <PuzzlePieceIcon
                        className={`h-4 w-4 ${
                          isActive("/dashboard/problem-metrics/available")
                            ? "text-[#9F7AEA]"
                            : "text-white/40 group-hover/item:text-[#9F7AEA]"
                        }`}
                      />
                      <span
                        className={
                          isActive("/dashboard/problem-metrics/available")
                            ? "text-white font-medium"
                            : "group-hover/item:text-white"
                        }
                      >
                        {t("sidebar.problemMetricsPractice", { defaultValue: "Practice puzzles" })}
                      </span>
                    </li>
                  )}
                  {showProblemMetricAdmin && (
                    <li
                      className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                        isActive("/dashboard/problem-metrics") &&
                        !location.pathname.includes("/edit/") &&
                        !location.pathname.includes("/available") &&
                        !location.pathname.includes("/attempt/")
                          ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                          : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                      }`}
                      onClick={() => handleNavigation("/dashboard/problem-metrics")}
                    >
                      <PlusIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA]" />
                      <span className="group-hover/item:text-white">
                        {t("sidebar.problemMetricsManage", { defaultValue: "Manage puzzles" })}
                      </span>
                    </li>
                  )}
                  {showProblemMetricAdmin &&
                    problemMetricsForMenu.map((metric) => (
                      <li
                        key={metric.problem_metric_id}
                        className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                          location.pathname === `/dashboard/problem-metrics/edit/${metric.problem_metric_id}`
                            ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                            : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                        }`}
                        onClick={() =>
                          handleNavigation(`/dashboard/problem-metrics/edit/${metric.problem_metric_id}`)
                        }
                      >
                        <DocumentTextIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA]" />
                        <span
                          className={`truncate max-w-[11rem] ${
                            location.pathname === `/dashboard/problem-metrics/edit/${metric.problem_metric_id}`
                              ? "text-white font-medium"
                              : "group-hover/item:text-white"
                          }`}
                          title={metric.title}
                        >
                          {metric.title}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          {/* Disputes - Student, Admin (not verifyDocAdmin, not employer) */}
          {/* {((role === "student" || isBuiltInAdmin) &&
            role !== "verifyDocAdmin" &&
            role !== "employer" &&
            (isBuiltInAdmin || hasAnyPermission(permissions, "/disputes", role))) && ( */}
                {(
            isBuiltInAdmin || 
            role === "superadmin" || 
           (role !== "verifyDocAdmin" && hasAnyPermission(permissions, "/disputes", role)) ||
           ((role === "student" || role === "employer") && hasAnyPermission(permissions, "/disputes", role))
            ) && (
              <div>
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActiveGroup("/dashboard/disputes") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                  onClick={() => toggleMenu("disputes")}
                >
                  <div className="flex items-center gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-white transition-colors">
                        {t("sidebar.disputes")}
                      </span>
                      {isActiveGroup("/dashboard/disputes") && openMenu !== "disputes" && (
                        <span className="text-xs text-[#9F7AEA] font-medium">
                                                    {location.pathname === "/dashboard/disputes" && t("sidebar.allDisputes")}
                          {location.pathname === "/dashboard/disputes/open" && t("sidebar.openDisputes")}
                          {location.pathname === "/dashboard/disputes/in-progress" && t("sidebar.inProgress")}
                          {location.pathname === "/dashboard/disputes/resolved" && t("sidebar.resolved")}
                           {location.pathname === "/dashboard/disputes/create" && t("sidebar.createDispute")}
                          {location.pathname.startsWith("/dashboard/disputes/detail") && t("sidebar.disputeDetail")}
                          {location.pathname === "/dashboard/disputes/my-disputes" && t("sidebar.myDisputes")}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                      openMenu === "disputes"
                        ? "rotate-180 text-white"
                        : ""
                    }`}
                  />
                </div>

                {openMenu === "disputes" && (
                  <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                    {(role !== "student" && role !== "employer") && (
                      <>
                        <li
                          className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                          onClick={() =>
                            handleNavigation("/dashboard/disputes/open")
                          }
                        >
                          <ExclamationTriangleIcon className="h-4 w-4 text-white/40 group-hover/item:text-yellow-400 transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                            {t("sidebar.openDisputes")}
                          </span>
                        </li>
                        <li
                          className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                          onClick={() =>
                            handleNavigation("/dashboard/disputes/in-progress")
                          }
                        >
                          <ArrowPathIcon className="h-4 w-4 text-white/40 group-hover/item:text-blue-400 transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                            {t("sidebar.inProgress")}
                          </span>
                        </li>
                        <li
                          className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                          onClick={() =>
                            handleNavigation("/dashboard/disputes/resolved")
                          }
                        >
                          <CheckCircleIcon className="h-4 w-4 text-white/40 group-hover/item:text-green-400 transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                            {t("sidebar.resolved")}
                          </span>
                        </li>
                        <li
                        className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                        onClick={() => handleNavigation("/dashboard/disputes")}
                        >
                          <ListBulletIcon className="h-4 w-4 text-white/40 group-hover/item:text-purple-400 transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                         {t("sidebar.allDisputes")}
                         </span>
                        </li>
                      </>
                    )}

                   {/* Only show Create Dispute and My Disputes for students and employers */}
                   {(role === "student" || role === "employer") && (
                     <>
                       <li
                        className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                       onClick={() => handleNavigation("/dashboard/disputes/create")}
                       >
                         <PlusIcon className="h-4 w-4 text-white/40 group-hover/item:text-purple-400 transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                         {t("sidebar.createDispute")}
                         </span>
                       </li>

                      <li
                       className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                      onClick={() => handleNavigation("/dashboard/disputes/my-disputes")}
                      >
                        <UsersIcon className="h-4 w-4 text-white/40 group-hover/item:text-purple-400 transition-colors" />
                          <span className="text-white/60 group-hover/item:text-white transition-colors">
                       {t("sidebar.myDisputes")}
                       </span>
                      </li>
                     </>
                   )}
                  </ul>
                )}
              </div>
            )}

          {/* Analytics - All roles with permission check (not verifyDocAdmin) */}
          {role !== "verifyDocAdmin" &&
            (isBuiltInAdmin || hasAnyPermission(permissions, "/analytics", role)) && (
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActive("/dashboard/analytics") ? "bg-[#9F7AEA]/15 text-white border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                onClick={() => handleNavigation("/dashboard/analytics")}
              >
                <ChartBarIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                <span className="font-medium group-hover:text-white transition-colors">
                  {t("sidebar.analytics")}
                </span>
              </div>
            )}

          {/* Transaction - All roles with permission check (not verifyDocAdmin) */}
          {role !== "verifyDocAdmin" &&
            (isBuiltInAdmin || hasAnyPermission(permissions, "/transactions", role)) && (
              <div>
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActiveGroup("/dashboard/transactions") ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                  onClick={() => toggleMenu("transactions")}
                >
                  <div className="flex items-center gap-3">
                    <CreditCardIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-white transition-colors">
                        {t("sidebar.transaction")}
                      </span>
                      {isActiveGroup("/dashboard/transactions") && openMenu !== "transactions" && (
                        <span className="text-xs text-[#9F7AEA] font-medium">
                          {location.pathname === "/dashboard/transactions" && "Transactions"}
                          {location.pathname === "/dashboard/transactions/pay" && "Pay"}
                          {location.pathname === "/dashboard/transactions/momo-payments" && "MoMo Payments"}

                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                      openMenu === "transactions" ? "rotate-180 text-white" : ""
                    }`}
                  />
                </div>

                {openMenu === "transactions" && (
                  <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                    <li
                      className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                        isActive("/dashboard/transactions")
                          ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                          : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                      }`}
                      onClick={() => handleNavigation("/dashboard/transactions")}
                    >
                      <DocumentTextIcon className={`h-4 w-4 transition-colors ${
                        isActive("/dashboard/transactions")
                          ? "text-[#9F7AEA]"
                          : "text-white/40 group-hover/item:text-[#9F7AEA]"
                      }`} />
                      <span className={`transition-colors ${
                        isActive("/dashboard/transactions")
                          ? "text-white font-medium"
                          : "group-hover/item:text-white"
                      }`}>
                        {t("sidebar.transactions")}
                      </span>
                    </li>
                    <li
                      className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
                        isActive("/dashboard/transactions/pay")
                          ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
                          : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
                      }`}
                      onClick={() => handleNavigation("/dashboard/transactions/pay")}
                    >
                      <BanknotesIcon className={`h-4 w-4 transition-colors ${
                        isActive("/dashboard/transactions/pay")
                          ? "text-[#9F7AEA]"
                          : "text-white/40 group-hover/item:text-[#9F7AEA]"
                      }`} />
                      <span className={`transition-colors ${
                        isActive("/dashboard/transactions/pay")
                          ? "text-white font-medium"
                          : "group-hover/item:text-white"
                      }`}>
                        {t("sidebar.pay")}
                      </span>
                    </li>
                    <li
  className={`flex items-center gap-2 cursor-pointer py-2 px-2 rounded-md transition-all duration-200 group/item ${
    isActive("/dashboard/transactions/momo-payments")
      ? "bg-[#9F7AEA]/20 text-[#9F7AEA]"
      : "hover:text-purple-300 hover:bg-[#9F7AEA]/10 text-white/60"
  }`}
  onClick={() =>
    handleNavigation("/dashboard/transactions/momo-payments")
  }
>
  <BanknotesIcon
    className={`h-4 w-4 transition-colors ${
      isActive("/dashboard/transactions/momo-payments")
        ? "text-[#9F7AEA]"
        : "text-white/40 group-hover/item:text-[#9F7AEA]"
    }`}
  />
  <span
    className={`transition-colors ${
      isActive("/dashboard/transactions/momo-payments")
        ? "text-white font-medium"
        : "group-hover/item:text-white"
    }`}
  >
    MoMo Payments
  </span>
</li>
                  </ul>
                )}
              </div>
            )}

          {/* ========================= PERMISSION-BASED MENU ITEMS ========================= */}
          {/* Dynamically render menu items based on JSON permissions from role configuration */}
          {visibleMenuItems
            .filter((menuConfig) => {
              // Skip items that are already shown in hardcoded sections above to avoid duplicates
              
              // These menu items are hardcoded above, so exclude them from dynamic rendering
              const hardcodedMenuKeys = [
                "jobs",           // Hardcoded Jobs menu
                "academic",       // Hardcoded Academic Verification menu
                "disputes",       // Hardcoded Disputes menu
                "analytics",      // Hardcoded Analytics menu
                "transactions",   // Hardcoded Transaction menu
                "cognitive",      // Hardcoded Cognitive tests menu
                "problemMetrics", // Hardcoded Problem metrics menu
                "notifications",  // Hardcoded above (visible to all users)
                "interviews",     // Hardcoded above (students only)
              ];
              
              // Role menu is hardcoded for superadmin
              if (role === "superadmin" && menuConfig.menuKey === "role") {
                return false;
              }
              
              // Exclude all hardcoded menu items to prevent duplicates
              if (hardcodedMenuKeys.includes(menuConfig.menuKey)) {
                return false;
              }
              
              // Show all other permission-based menu items
              // For custom roles with JSON permissions, these items will be displayed here
              // (e.g., job-applications, notifications, etc.)
              return true;
            })
            .map((menuConfig) => {
              const IconComponent = menuConfig.icon;

              // Render menu item with submenu
              if (menuConfig.hasSubmenu && menuConfig.submenuItems) {
                return (
                  <div key={menuConfig.menuKey}>
                    <div
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActiveGroup(menuConfig.basePath) ? "bg-[#9F7AEA]/15 border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                      onClick={() => toggleMenu(menuConfig.menuKey)}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                        <div className="flex flex-col">
                          <span className="font-medium group-hover:text-white transition-colors">
                            {t(menuConfig.labelKey)}
                          </span>
                          {isActiveGroup(menuConfig.basePath) && openMenu !== menuConfig.menuKey && (
                            <span className="text-xs text-[#9F7AEA] font-medium">
                              {menuConfig.submenuItems?.find(item => item.path === location.pathname)?.labelKey
                                ? t(menuConfig.submenuItems!.find(item => item.path === location.pathname)!.labelKey!)
                                : menuConfig.submenuItems?.find(item => item.path === location.pathname)?.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform duration-200 text-white/50 group-hover:text-white ${
                          openMenu === menuConfig.menuKey ? "rotate-180 text-white" : ""
                        }`}
                      />
                    </div>

                    {openMenu === menuConfig.menuKey && (
                      <ul className="pl-11 space-y-1 text-sm mt-2 animate-fadeIn">
                        {menuConfig.submenuItems.map((subItem, idx) => {
                          const SubIcon = subItem.icon || FolderIcon;
                          return (
                            <li
                              key={idx}
                              className="flex items-center gap-2 hover:text-purple-300 cursor-pointer py-2 px-2 rounded-md hover:bg-[#9F7AEA]/10 transition-all duration-200 group/item"
                              onClick={() => handleNavigation(subItem.path)}
                            >
                              <SubIcon className="h-4 w-4 text-white/40 group-hover/item:text-[#9F7AEA] transition-colors" />
                              <span className="text-white/60 group-hover/item:text-white transition-colors">
                                {subItem.labelKey ? t(subItem.labelKey) : subItem.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              }

              // Render simple menu item without submenu
              const itemPath = menuConfig.directPath || menuConfig.basePath;
              return (
                <div
                  key={menuConfig.menuKey}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${isActive(itemPath) ? "bg-[#9F7AEA]/15 text-white border-l-2 border-[#9F7AEA]" : "hover:bg-[#9F7AEA]/10"}`}
                  onClick={() => handleNavigation(itemPath)}
                >
                  <IconComponent className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                  <span className="font-medium group-hover:text-white transition-colors">
                    {t(menuConfig.labelKey)}
                  </span>
                </div>
              );
            })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
