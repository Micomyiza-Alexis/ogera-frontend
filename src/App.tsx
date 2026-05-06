import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import ProtectedRoute from "./components/ProtectedRoute";
import FeatureGate from "./components/FeatureGate";
import AdminLayout from "./layouts/adminLayout";
import StudentLayout from "./layouts/StudentLayout";
import EmployerLayout from "./layouts/EmployerLayout";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyOtp from "./pages/VerifyOtp";
import VerifyEmail from "./pages/VerifyEmail";
import Verification from "./pages/Verification";
import ChangePassword from "./pages/ChangePassword";
import TestRefresh from "./pages/TestRefresh";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EmployerSettingsAccount from "./pages/EmployerSettingsAccount";
import EmployerSettingsSecurity from "./pages/EmployerSettingsSecurity";

// User Pages
import AllUsers from "./pages/Users/AllUsers";
import AllUsersWithTable from "./pages/Users/AllUsersWithTable";
import Students from "./pages/Users/Students";
import Employers from "./pages/Users/Employers";
import PendingApprovalUsers from "./pages/Users/PendingApproval";
import SuspendedUsers from "./pages/Users/Suspended";

// Academic Verification Pages
import PendingReviews from "./pages/AcademicVerification/PendingReviews";
import Approved from "./pages/AcademicVerification/Approved";
import Rejected from "./pages/AcademicVerification/Rejected";
import ResubmissionRequired from "./pages/AcademicVerification/ResubmissionRequired";
import PerformanceTrack from "./pages/AcademicVerification/PerformanceTrack";
import AccountLocks from "./pages/AcademicVerification/AccountLocks";

// Jobs Pages
import AllJobs from "./pages/Jobs/AllJobs";
import ActiveJobs from "./pages/Jobs/ActiveJobs";
import CompletedJobs from "./pages/Jobs/Completed";
import PendingApprovalJobs from "./pages/Jobs/PendingApproval";
import JobCategories from "./pages/Jobs/JobCategories";
import CreateJob from "./pages/Jobs/CreateJob";
import JobApplications from "./pages/Jobs/JobApplications";
import ViewJobApplications from "./pages/Jobs/ViewJobApplications";
import JobDetails from "./pages/Jobs/JobDetails";
import MyApplications from "./pages/Jobs/MyApplications";
import StudentAcceptedApplications from "./pages/Jobs/StudentAcceptedApplications";
import StudentRejectedApplications from "./pages/Jobs/StudentRejectedApplications";
import EmployerAcceptedApplications from "./pages/Jobs/EmployerAcceptedApplications";
import EmployerRejectedApplications from "./pages/Jobs/EmployerRejectedApplications";
import EmployerTasks from "./pages/Jobs/EmployerTasks";
import JobTasksKanban from "./pages/Jobs/JobTasksKanban";
import StudentTasks from "./pages/StudentTasks";

// Dispute Pages
import Disputes from "./pages/Disputes";
import OpenDisputes from "./pages/Disputes/OpenDisputes";
import InProgress from "./pages/Disputes/InProgress";
import ResolvedDisputes from "./pages/Disputes/Resolved";
import CreateDispute from "./pages/Disputes/CreateDispute";
import DisputeDetail from "./pages/Disputes/DisputeDetail";
import MyDisputes from "./pages/Disputes/MyDisputes";

// Other Pages
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import Interviews from "./pages/Interviews";
import Messages from "./pages/Messages";
import Transactions from "./pages/Transactions";
import Pay from "./pages/Transactions/Pay";
import MoMoPayments from "./pages/Transactions/MoMoPayments";
import PaymentCallback from "./pages/PaymentCallback";
import PaymentCancelled from "./pages/PaymentCancelled";

// Admin Pages
import CreateAdmin from "./pages/Admin/CreateAdmin";
import ViewAdmins from "./pages/Admin/ViewAdmins";

// Role Pages
import CreateRole from "./pages/Role/CreateRole";
import ViewRoles from "./pages/Role/ViewRoles";

// Permission Pages
import CreatePermission from "./pages/Permission/CreatePermission";
import ViewPermissions from "./pages/Permission/ViewPermissions";

import useRefreshOnLoad from "./hooks/useRefreshOnLoad";
import AddCourse from "./pages/Courses/AddCourse";
import ViewCourse from "./pages/Courses/ViewCourse";
import CourseDetail from "./pages/Courses/CourseDetail";
import CourseAnalytics from "./pages/Courses/CourseAnalytics";
import CognitiveTestsHub from "./pages/CognitiveTests/CognitiveTestsHub";
import CognitiveTestEditor from "./pages/CognitiveTests/CognitiveTestEditor";
import StudentCognitiveTests from "./pages/CognitiveTests/StudentCognitiveTests";
import TakeCognitiveTest from "./pages/CognitiveTests/TakeCognitiveTest";
import ProblemMetricsHub from "./pages/ProblemMetrics/ProblemMetricsHub";
import ProblemMetricEditor from "./pages/ProblemMetrics/ProblemMetricEditor";
import StudentProblemMetrics from "./pages/ProblemMetrics/StudentProblemMetrics";
import TakeProblemMetric from "./pages/ProblemMetrics/TakeProblemMetric";
import AcademicRecords from "./pages/AcademicRecords";
import "./services/api/cognitiveTestApi";
import "./services/api/problemMetricApi";

function App() {
  const { t } = useTranslation();
  const isLoading = useRefreshOnLoad();
  const roleRaw = useSelector((state: any) => state.auth.role);
  const role = roleRaw ? String(roleRaw).toLowerCase().trim() : undefined;

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">{t("app.loading")}</p>
        </div>
      </div>
    );
  }

  // Decide layout based on role
  const DashboardLayout =
    role === "admin" || role === "superadmin" || role === "verifydocadmin"
      ? AdminLayout
      : role === "student"
      ? StudentLayout
      : role === "employer"
      ? EmployerLayout
      : AdminLayout; // Default to AdminLayout (ProtectedRoute will handle auth)

  const router = createBrowserRouter([
    /** ---------------- ROOT REDIRECT ---------------- **/
    {
      path: "/",
      element: role ? (
        <Navigate to="/dashboard" replace />
      ) : (
        <Navigate to="/auth/login" replace />
      ),
    },

    /** ---------------- PUBLIC ROUTES ---------------- **/
    {
      path: "/auth/login",
      element: role ? <Navigate to="/dashboard" replace /> : <Login />,
    },
    {
      path: "/auth/register",
      element: role ? <Navigate to="/dashboard" replace /> : <Login initialView="register" />,
    },
    { path: "/auth/forgot-password", Component: ForgotPassword },
    { path: "/auth/reset-password", Component: ResetPassword },
    { path: "/auth/verify-otp", Component: VerifyOtp },
    { path: "/auth/verify-email", Component: VerifyEmail },
    { path: "/auth/verification", Component: Verification },
    { path: "/auth/change-password", Component: ChangePassword },
    { path: "/auth/me", Component: TestRefresh },

    /** ---------------- PAYMENT CALLBACK (Public - Pesapal redirect) ---------------- **/
    { path: "/payment/callback", Component: PaymentCallback },
    { path: "/payment/cancelled", Component: PaymentCancelled },

    /** ---------------- PROTECTED DASHBOARD ROUTES ---------------- **/
    {
      path: "/dashboard",
      element: <ProtectedRoute />,
      children: [
        {
          path: "",
          Component: DashboardLayout,
          children: [
            {
              index: true,
              Component: Dashboard,
            },
            {
              path: "profile",
              element: (
                <FeatureGate feature="SETTINGS">
                  <Profile />
                </FeatureGate>
              ),
            },
            {
              path: "settings/account",
              element: (
                <FeatureGate feature="SETTINGS">
                  <EmployerSettingsAccount />
                </FeatureGate>
              ),
            },
            {
              path: "settings/security",
              element: (
                <FeatureGate feature="SETTINGS">
                  <EmployerSettingsSecurity />
                </FeatureGate>
              ),
            },
            // User Routes (Permission-based access)
            {
              path: "users",
              element: <ProtectedRoute />,
              children: [
                {
                  path: "all",
                  Component: AllUsers,
                },
                {
                  path: "all-table",
                  Component: AllUsersWithTable,
                },
                {
                  path: "students",
                  Component: Students,
                },
                {
                  path: "employers",
                  Component: Employers,
                },
                {
                  path: "pending",
                  Component: PendingApprovalUsers,
                },
                {
                  path: "suspended",
                  Component: SuspendedUsers,
                },
              ],
            },
            // Admin Routes (SuperAdmin Only)
            {
              path: "admin",
              element: <ProtectedRoute allowedRoles={["superadmin"]} />,
              children: [
                {
                  path: "create",
                  Component: CreateAdmin,
                },
                {
                  path: "view",
                  Component: ViewAdmins,
                },
              ],
            },
            // Role Routes (SuperAdmin Only)
            {
              path: "role",
              element: <ProtectedRoute allowedRoles={["superadmin"]} />,
              children: [
                {
                  path: "create",
                  Component: CreateRole,
                },
                {
                  path: "view",
                  Component: ViewRoles,
                },
              ],
            },
            // Permission Routes (SuperAdmin Only)
            {
              path: "permission",
              element: <ProtectedRoute allowedRoles={["superadmin"]} />,
              children: [
                {
                  path: "create",
                  Component: CreatePermission,
                },
                {
                  path: "view",
                  Component: ViewPermissions,
                },
              ],
            },
            // Academic Verification Routes
            {
              path: "academic/pending",
              Component: PendingReviews,
            },
            {
              path: "academic/approved",
              Component: Approved,
            },
            {
              path: "academic/rejected",
              Component: Rejected,
            },
            {
              path: "academic/resubmission-required",
              Component: ResubmissionRequired,
            },
            {
              path: "academic/performance",
              Component: PerformanceTrack,
            },
            {
              path: "academic/locks",
              Component: AccountLocks,
            },
            // Jobs Routes - Order matters: specific routes first, then dynamic routes
            {
              path: "jobs/create",
              element: <ProtectedRoute allowedRoles={["employer", "superadmin"]} />,
              children: [
                {
                  index: true,
                  Component: CreateJob,
                },
              ],
            },
            {
              path: "jobs/all",
              Component: AllJobs,
            },
            {
              path: "jobs/unfunded",
              element: <ProtectedRoute allowedRoles={["employer", "superadmin"]} />,
              children: [
                {
                  index: true,
                  Component: AllJobs,
                },
              ],
            },
            {
              path: "jobs/active",
              Component: ActiveJobs,
            },
            {
              path: "jobs/completed",
              Component: CompletedJobs,
            },
            {
              path: "jobs/pending",
              Component: PendingApprovalJobs,
            },
            {
              path: "jobs/categories",
              Component: JobCategories,
            },
            {
              path: "jobs/tasks",
              element: <ProtectedRoute allowedRoles={["employer", "superadmin"]} />,
              children: [
                {
                  index: true,
                  Component: EmployerTasks,
                },
              ],
            },
            {
              path: "tasks",
              element: <ProtectedRoute allowedRoles={["student"]} />,
              children: [
                {
                  index: true,
                  Component: StudentTasks,
                },
              ],
            },
            {
              path: "jobs/applications",
              // Employer/superadmin manage incoming applications. Students should use "My Applications".
              element: <ProtectedRoute allowedRoles={["employer", "superadmin"]} />,
              children: [
                {
                  index: true,
                  Component: JobApplications,
                },
                {
                  path: "accepted",
                  Component: EmployerAcceptedApplications,
                },
                {
                  path: "rejected",
                  Component: EmployerRejectedApplications,
                },
              ],
            },
            {
              path: "jobs/my-applications",
              element: <ProtectedRoute allowedRoles={["student"]} />,
              children: [
                {
                  index: true,
                  Component: MyApplications,
                },
                {
                  path: "accepted",
                  Component: StudentAcceptedApplications,
                },
                {
                  path: "rejected",
                  Component: StudentRejectedApplications,
                },
              ],
            },
            {
              path: "jobs/:id/edit",
              element: <ProtectedRoute allowedRoles={["employer", "superadmin"]} />,
              children: [
                {
                  index: true,
                  Component: CreateJob,
                },
              ],
            },
            {
              path: "jobs/:id/tasks",
              element: <ProtectedRoute allowedRoles={["employer", "superadmin"]} />,
              children: [
                {
                  index: true,
                  Component: JobTasksKanban,
                },
              ],
            },
            {
              path: "jobs/:id/applications",
              element: <ProtectedRoute allowedRoles={["employer", "superadmin"]} />,
              children: [
                {
                  index: true,
                  Component: ViewJobApplications,
                },
              ],
            },
            {
              path: "jobs/:id",
              Component: JobDetails,
            },
            // Dispute Routes - Hidden in V1 via Feature Flag
            {
              path: "disputes",
              element: (
                <FeatureGate feature="RESOLUTION_CENTER">
                  <Disputes />
                </FeatureGate>
              ),
            },
            {
              path: "disputes/create",
              element: (
                <FeatureGate feature="RESOLUTION_CENTER">
                  <CreateDispute />
                </FeatureGate>
              ),
            },
            {
              path: "disputes/open",
              element: (
                <FeatureGate feature="RESOLUTION_CENTER">
                  <OpenDisputes />
                </FeatureGate>
              ),
            },
            {
              path: "disputes/in-progress",
              element: (
                <FeatureGate feature="RESOLUTION_CENTER">
                  <InProgress />
                </FeatureGate>
              ),
            },
            {
              path: "disputes/resolved",
              element: (
                <FeatureGate feature="RESOLUTION_CENTER">
                  <ResolvedDisputes />
                </FeatureGate>
              ),
            },
            {
              path: "disputes/my-disputes",
              element: (
                <FeatureGate feature="RESOLUTION_CENTER">
                  <MyDisputes />
                </FeatureGate>
              ),
            },
            {
              path: "disputes/:id",
              element: (
                <FeatureGate feature="RESOLUTION_CENTER">
                  <DisputeDetail />
                </FeatureGate>
              ),
            },
            // Other Routes
            {
              path: "analytics",
              Component: Analytics,
            },
            {
              path: "notifications",
              Component: Notifications,
            },
            {
              path: "interviews",
              element: <ProtectedRoute allowedRoles={["student"]} />,
              children: [{ index: true, Component: Interviews }],
            },
            {
              path: "messages",
              element: <ProtectedRoute allowedRoles={["employer", "student"]} />,
              children: [
                {
                  index: true,
                  Component: Messages,
                },
              ],
            },
            {
              path: "transactions",
              Component: Transactions,
            },
            {
              path: "transactions/pay",
              Component: Pay,
            },
            {
              path: "transactions/momo-payments",
              element: <ProtectedRoute allowedRoles={["superadmin", "admin"]} />,
              children: [
                {
                  index: true,
                  Component: MoMoPayments,
                },
              ],
            },
            {
              path: "courses/add",
              Component: AddCourse,
            },
            {
              path: "courses/view",
              Component: ViewCourse,
            },
            {
              path: "courses/analytics",
              element: <ProtectedRoute allowedRoles={["employer", "superadmin", "superAdmin", "admin", "courseAdmin", "CourseAdmin"]} />,
              children: [
                {
                  index: true,
                  Component: CourseAnalytics,
                },
              ],
            },
            {
              path: "courses/analytics/:courseId",
              element: <ProtectedRoute allowedRoles={["employer", "superadmin", "superAdmin", "admin", "courseAdmin", "CourseAdmin"]} />,
              children: [
                {
                  index: true,
                  Component: CourseAnalytics,
                },
              ],
            },
            {
              path: "courses/:id",
              Component: CourseDetail,
            },
            {
              path: "cognitive-tests",
              element: <ProtectedRoute allowedRoles={["superadmin", "admin"]} />,
              children: [
                {
                  index: true,
                  Component: CognitiveTestsHub,
                },
                {
                  path: "edit/:id",
                  Component: CognitiveTestEditor,
                },
              ],
            },
            {
              path: "cognitive-tests/available",
              element: <ProtectedRoute allowedRoles={["student"]} />,
              children: [
                {
                  index: true,
                  Component: StudentCognitiveTests,
                },
              ],
            },
            {
              path: "cognitive-tests/attempt/:id",
              element: <ProtectedRoute allowedRoles={["student"]} />,
              children: [
                {
                  index: true,
                  Component: TakeCognitiveTest,
                },
              ],
            },
            {
              path: "academic-records",
              element: <ProtectedRoute allowedRoles={["student", "superadmin"]} />,
              children: [
                {
                  index: true,
                  Component: AcademicRecords,
                },
              ],
            },
            {
              path: "problem-metrics",
              element: <ProtectedRoute allowedRoles={["superadmin", "admin"]} />,
              children: [
                {
                  index: true,
                  Component: ProblemMetricsHub,
                },
                {
                  path: "edit/:id",
                  Component: ProblemMetricEditor,
                },
              ],
            },
            {
              path: "problem-metrics/available",
              element: <ProtectedRoute allowedRoles={["student"]} />,
              children: [
                {
                  index: true,
                  Component: StudentProblemMetrics,
                },
              ],
            },
            {
              path: "problem-metrics/attempt/:id",
              element: <ProtectedRoute allowedRoles={["student"]} />,
              children: [
                {
                  index: true,
                  Component: TakeProblemMetric,
                },
              ],
            },
          ],
        },
      ],
    },

    /** ---------------- 404 ---------------- **/
    { path: "*", Component: NotFound },
  ]);

  return <RouterProvider router={router} />;
}

export default App;

/** 404 PAGE **/
const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        color: "#7F56D9",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "50px", marginBottom: "20px" }}>404</h1>
      <p style={{ fontSize: "18px" }}>{t("common.pageNotFound")}</p>
    </div>
  );
};
