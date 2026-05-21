import React, { useEffect, useState, useMemo } from "react";

import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "../features/auth/authSlice";
import { getUserProfile, updateUserProfile } from "../services/api/profileApi";
import { uploadResume } from "../services/api/resumeApi";
import api from "../services/api/axiosInstance";
import type { UserProfile } from "../services/api/profileApi";
import { useGetMyTrustScoreQuery, useCalculateTrustScoreMutation } from "../services/api/trustScoreApi";
import { useGetDashboardMetricsQuery } from "../services/api/dashboardApi";
import { useListJobPaymentsQuery, useGetWalletBalanceQuery } from "../services/api/momoApi";
import { useGetAllUsersQuery } from "../services/api/usersApi";
import { useGetProfileCompletionQuery } from "../services/api/profileCompletionApi";
import {
  useGetFullProfileQuery,
  useUpdateExtendedProfileMutation,
  useAddBulkSkillsMutation,
  useAddEmploymentMutation,
  useUpdateEmploymentMutation,
  useDeleteEmploymentMutation,
  useAddEducationMutation,
  useUpdateEducationMutation,
  useDeleteEducationMutation,
  useAddProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAddAccomplishmentMutation,
  useUpdateAccomplishmentMutation,
  useDeleteAccomplishmentMutation,
  type UserEmployment,
  type UserEducation,
  type UserProject,
  type UserAccomplishment,
  type CreateEmploymentRequest,
  type CreateEducationRequest,
  type CreateProjectRequest,
  type CreateAccomplishmentRequest,
} from "../services/api/extendedProfileApi";
import ChangePasswordModal from "../components/ChangePasswordModal";
import EditProfileModal from "../components/EditProfileModal";
import TrustScoreCard from "../components/TrustScoreCard";
import PhoneVerificationModal from "../components/PhoneVerificationModal";
import PermissionsManagement from "../components/PermissionsManagement";
import PlatformStatistics from "../components/PlatformStatistics";
import ActiveSessions from "../components/ActiveSessions";
import ProfileHeaderCard from "../components/Profile/ProfileHeaderCard";
import EmployerProfile from "../components/Profile/EmployerProfile";
import { useNavigate } from "react-router-dom";
import {
  PencilIcon,
  CloudArrowUpIcon,
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  CalendarIcon,
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  AcademicCapIcon,
  ComputerDesktopIcon,
  RocketLaunchIcon,
  UserIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

type ActiveSection =
  | "resume"
  | "internship"
  | "resume-headline"
  | "key-skills"
  | "employment"
  | "education"
  | "it-skills"
  | "projects"
  | "profile-summary"
  | "accomplishments";

type SuperAdminTab = "overview" | "account" | "permissions" | "stats" | "security" | "maintenance" | "registrations" | "broadcast" | "logoutAll" | "language" | "twoFactorAuth" | "activeSessions";

interface SuperAdminNavItem {
  key: SuperAdminTab;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const accessToken = useSelector((state: any) => state.auth.accessToken);
  const role = useSelector((state: any) => state.auth.role);

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isPhoneVerificationModalOpen, setIsPhoneVerificationModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>("resume");
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isUploadingInternshipCertificate, setIsUploadingInternshipCertificate] =
    useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerContentType, setViewerContentType] = useState<string | null>(null);
  const [superAdminActiveTab, setSuperAdminActiveTab] = useState<SuperAdminTab>("overview");

  // Modal states
  const [isEmploymentModalOpen, setIsEmploymentModalOpen] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAccomplishmentModalOpen, setIsAccomplishmentModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [resumeHeadline, setResumeHeadline] = useState<string>("");
  const [profileSummary, setProfileSummary] = useState<string>("");
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isEditingItSkills, setIsEditingItSkills] = useState(false);
  const [itSkillsInput, setItSkillsInput] = useState("");
  const [totalExperienceYears, setTotalExperienceYears] = useState<string>("0");
  const [workExperienceDetails, setWorkExperienceDetails] = useState<string>("");
  const [isSavingWorkExperience, setIsSavingWorkExperience] = useState(false);
  const [isEditingWorkExperience, setIsEditingWorkExperience] = useState(true);

  // RTK Query hooks
  const { data: fullProfileData, refetch: refetchFullProfile } = useGetFullProfileQuery();
  const [updateExtendedProfile] = useUpdateExtendedProfileMutation();
  const [addBulkSkills] = useAddBulkSkillsMutation();
  const [addEmployment] = useAddEmploymentMutation();
  const [updateEmployment] = useUpdateEmploymentMutation();
  const [deleteEmployment] = useDeleteEmploymentMutation();
  const [addEducation] = useAddEducationMutation();
  const [updateEducation] = useUpdateEducationMutation();
  const [deleteEducation] = useDeleteEducationMutation();
  const [addProject] = useAddProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [addAccomplishment] = useAddAccomplishmentMutation();
  const [updateAccomplishment] = useUpdateAccomplishmentMutation();
  const [deleteAccomplishment] = useDeleteAccomplishmentMutation();
  const { data: profileCompletionData } = useGetProfileCompletionQuery();
  const profileCompletion = profileCompletionData?.data?.profile_completion_percentage || 0;

  // Determine user role early for conditional hooks
  const userData = profileData || user;
  const userRole = userData?.role?.roleName || role;
  const normalizedUserRole = (userRole || "").toString().toLowerCase();
  const isSuperAdmin = normalizedUserRole === "superadmin";

  // Fetch TrustScore
  const {
    data: trustScoreResponse,
    isLoading: isTrustScoreLoading,
    refetch: refetchTrustScore,
  } = useGetMyTrustScoreQuery(undefined, {
    skip: !profileData || isSuperAdmin || normalizedUserRole !== "student",
  });

  const [calculateTrustScore] = useCalculateTrustScoreMutation();

  // Fetch Dashboard Metrics (for superadmin)
  const {
    data: dashboardMetricsData,
    isLoading: isDashboardMetricsLoading,
  } = useGetDashboardMetricsQuery(undefined, {
    skip: !isSuperAdmin,
  });

  // Fetch Job Payments (for superadmin - transactions)
  const {
    data: jobPaymentsData,
    isLoading: isJobPaymentsLoading,
  } = useListJobPaymentsQuery(undefined, {
    skip: !isSuperAdmin,
  });

  // Fetch Wallet Balance (for superadmin)
  useGetWalletBalanceQuery(undefined, {
    skip: !isSuperAdmin,
  });

  // Fetch All Users (for superadmin - user counts)
  useGetAllUsersQuery({ page: 1, limit: 1 }, {
    skip: !isSuperAdmin,
  });

  // Fetch user profile from API
  const resolveProfileImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    const baseUrl = (import.meta.env.VITE_API_URL || "https://api.ogera.sybellasystems.co.rw/api").replace("/api", "");
    return imageUrl.startsWith("/") ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
  };

  const syncProfileToStore = (updatedData: UserProfile) => {
    if (!user || !accessToken || !role) return;
    const resolvedImageUrl = resolveProfileImageUrl(updatedData.profile_image_url);
    dispatch(
      setCredentials({
        user: {
          ...user,
          ...updatedData,
          profile_image_url: resolvedImageUrl || updatedData.profile_image_url,
        },
        accessToken,
        role,
      })
    );
  };

  const fetchProfile = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const response = await getUserProfile();
      const updatedData = response.data;
      setProfileData(updatedData);
      setError(null);
      if (updatedData) {
        syncProfileToStore(updatedData);
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      if (!options?.silent) {
        setError(err?.response?.data?.message || t("profile.failedToLoad"));
        setProfileData(null);
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update local state when full profile data loads
  useEffect(() => {
    const profileToUse = fullProfileData?.data;
    
    if (profileToUse) {
      const ext = profileToUse.extendedProfile;
      if (ext) {
        setResumeHeadline(ext.resume_headline || "");
        setProfileSummary(ext.profile_summary || "");
        setWorkExperienceDetails(ext.profile_summary || "");
        setTotalExperienceYears(String(ext.total_experience_years || 0));
        const hasSavedWorkExperience =
          Number(ext.total_experience_years || 0) > 0 ||
          Boolean((ext.profile_summary || "").trim());
        setIsEditingWorkExperience(!hasSavedWorkExperience);
      }
    }
  }, [fullProfileData]);

  const handleProfileUpdateSuccess = async () => {
    await fetchProfile({ silent: true });
    refetchTrustScore();
    refetchFullProfile();
  };

  const handlePhoneVerificationSuccess = () => {
    fetchProfile();
    refetchTrustScore();
  };

  // Get data from full profile
  const currentProfileData = fullProfileData?.data;
  const extendedProfile = currentProfileData?.extendedProfile;
  const skills = currentProfileData?.skills || [];
  const itSkills = skills.filter(s => s.skill_type === "it_skill");
  const employments = currentProfileData?.employments || [];
  const educations = currentProfileData?.educations || [];
  const projects = currentProfileData?.projects || [];
  const accomplishments = currentProfileData?.accomplishments || [];
  const internshipCertificate = accomplishments.find((acc) => {
    const normalizedTitle = (acc.title || "").toLowerCase();
    return (
      acc.accomplishment_type === "certification" &&
      normalizedTitle === "internship certificate"
    );
  });
  const visibleAccomplishments = accomplishments.filter((acc) => {
    const normalizedTitle = (acc.title || "").toLowerCase();
    return !(
      acc.accomplishment_type === "certification" &&
      normalizedTitle === "internship certificate"
    );
  });

  /** When portfolio projects change, Experience (E) changes — persist TrustScore on the server */
  const projectsTrustSignature = useMemo(() => {
    const list = currentProfileData?.projects ?? [];
    return JSON.stringify(list.map((p) => [p.project_id, p.is_ongoing]));
  }, [currentProfileData?.projects]);
  const employmentsTrustSignature = useMemo(() => {
    const list = currentProfileData?.employments ?? [];
    return JSON.stringify(list.map((e) => [e.employment_id, e.employment_type, e.is_current]));
  }, [currentProfileData?.employments]);
  const accomplishmentsTrustSignature = useMemo(() => {
    const list = currentProfileData?.accomplishments ?? [];
    return JSON.stringify(
      list.map((a) => [a.accomplishment_id, a.accomplishment_type, (a.title || "").toLowerCase()])
    );
  }, [currentProfileData?.accomplishments]);
  const resumeTrustSignature = useMemo(
    () => String(profileData?.resume_url || ""),
    [profileData?.resume_url]
  );
  const experienceTrustSignature = useMemo(
    () => String(extendedProfile?.total_experience_years || 0),
    [extendedProfile?.total_experience_years]
  );

  useEffect(() => {
    if (isSuperAdmin || normalizedUserRole !== "student" || !profileData?.user_id) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await calculateTrustScore(profileData.user_id).unwrap();
        if (!cancelled) refetchTrustScore();
      } catch {
        /* non-blocking */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    profileData?.user_id,
    projectsTrustSignature,
    employmentsTrustSignature,
    accomplishmentsTrustSignature,
    resumeTrustSignature,
    experienceTrustSignature,
    normalizedUserRole,
    isSuperAdmin,
    calculateTrustScore,
    refetchTrustScore,
  ]);

  // Handle resume upload
  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/rtf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("profile.resumeUploadValidFile"));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("profile.resumeUploadSize"));
      return;
    }

    try {
      setIsUploadingResume(true);
      const response = await uploadResume(file);

      // Update user profile with the resume URL
      if (response.data?.resume_url) {
        await updateUserProfile({ resume_url: response.data.resume_url });
      }

      toast.success(t("profile.resumeUploadSuccess"));
      // Refetch profile data to get updated resume URL
      await fetchProfile();
      // Also refetch full profile if needed
      refetchFullProfile();
    } catch (error: any) {
      console.error("Error uploading resume:", error);
      toast.error(error?.response?.data?.message || t("profile.resumeUploadFailed"));
    } finally {
      setIsUploadingResume(false);
      // Reset file input
      const fileInput = document.getElementById("resume-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  const handleFileViewInModal = async (fileUrl: string) => {
    let filePath = fileUrl;

    if (fileUrl.includes("/api/resumes/download")) {
      const url = new URL(fileUrl, window.location.origin);
      filePath = url.searchParams.get("path") || fileUrl;
    } else if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      setViewerUrl(fileUrl);
      setViewerContentType("application/pdf");
      setShowViewer(true);
      return;
    }

    const response = await api.get(
      `/resumes/download?path=${encodeURIComponent(filePath)}`,
      { responseType: "blob" }
    );

    const blob = new Blob([response.data as BlobPart], {
      type: (response.data as any)?.type || "application/pdf",
    });
    const blobUrl = window.URL.createObjectURL(blob);
    setViewerUrl(blobUrl);
    setViewerContentType(blob.type || "application/pdf");
    setShowViewer(true);
  };

  const closeViewer = () => {
    if (viewerUrl && viewerUrl.startsWith("blob:")) {
      window.URL.revokeObjectURL(viewerUrl);
    }
    setViewerUrl(null);
    setViewerContentType(null);
    setShowViewer(false);
  };

  const handleDeleteResume = async () => {
    if (!profileData?.resume_url) return;

    try {
      await updateUserProfile({ resume_url: null });
      toast.success("Resume deleted successfully");
      await fetchProfile();
      refetchFullProfile();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.data?.message ||
          "Failed to delete resume"
      );
    }
  };

  const handleViewResume = async () => {
    if (!profileData?.resume_url) return;

    try {
      await handleFileViewInModal(profileData.resume_url);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to view resume"
      );
    }
  };

  const handleInternshipCertificateUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/rtf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("profile.resumeUploadValidFile"));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("profile.resumeUploadSize"));
      return;
    }

    try {
      setIsUploadingInternshipCertificate(true);
      const response = await uploadResume(file);
      const certificateUrl = response.data?.resume_url;

      if (!certificateUrl) {
        throw new Error("Upload failed");
      }

      if (internshipCertificate?.accomplishment_id) {
        await updateAccomplishment({
          id: internshipCertificate.accomplishment_id,
          data: { credential_url: certificateUrl },
        });
      } else {
        await addAccomplishment({
          accomplishment_type: "certification",
          title: "Internship Certificate",
          credential_url: certificateUrl,
        });
      }

      toast.success("Internship certificate uploaded successfully");
      refetchFullProfile();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.data?.message ||
          "Failed to upload internship certificate"
      );
    } finally {
      setIsUploadingInternshipCertificate(false);
      const fileInput = document.getElementById(
        "internship-certificate-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  const handleDeleteInternshipCertificate = async () => {
    if (!internshipCertificate?.accomplishment_id) return;

    try {
      await deleteAccomplishment(internshipCertificate.accomplishment_id);
      toast.success("Internship certificate deleted successfully");
      refetchFullProfile();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.data?.message ||
          "Failed to delete internship certificate"
      );
    }
  };

  const handleViewInternshipCertificate = async () => {
    if (!internshipCertificate?.credential_url) return;

    try {
      await handleFileViewInModal(internshipCertificate.credential_url);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to view internship certificate"
      );
    }
  };

  const handleSaveHeadline = async () => {
    try {
      await updateExtendedProfile({ resume_headline: resumeHeadline });
      toast.success(t("profile.saveSuccess", { defaultValue: "Profile updated successfully" }));
      setIsEditingHeadline(false);
      refetchFullProfile();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("profile.profileUpdateFailed"));
    }
  };

  const handleSaveWorkExperience = async () => {
    const parsedYears = Math.max(0, Number(totalExperienceYears) || 0);

    try {
      setIsSavingWorkExperience(true);
      await updateExtendedProfile({
        total_experience_years: parsedYears,
        profile_summary: workExperienceDetails,
      });
      toast.success(t("profile.workExperienceUpdated"));
      setProfileSummary(workExperienceDetails);
      setTotalExperienceYears(String(parsedYears));
      setIsEditingWorkExperience(false);
      refetchFullProfile();
      refetchTrustScore();
    } catch (error: any) {
      toast.error(error?.data?.message || t("profile.workExperienceUpdateFailed"));
    } finally {
      setIsSavingWorkExperience(false);
    }
  };

  const handleSaveItSkills = async () => {
    try {
      const parsedSkills = itSkillsInput.split(",").map((skill) => skill.trim()).filter(Boolean);
      if (parsedSkills.length > 0) {
        await addBulkSkills({
          skills: parsedSkills.map((skillName) => ({
            skill_name: skillName,
            skill_type: "it_skill",
          })),
        });
      }
      toast.success(t("profile.saveSuccess", { defaultValue: "Profile updated successfully" }));
      setIsEditingItSkills(false);
      refetchFullProfile();
      refetchTrustScore();
    } catch (error: any) {
      toast.error(error?.data?.message || t("profile.workExperienceUpdateFailed"));
    }
  };

  const handleEditWorkExperience = () => {
    setIsEditingWorkExperience(true);
  };

  const handleDeleteWorkExperience = async () => {
    if (!window.confirm(t("profile.confirmDeleteWorkExperience"))) return;

    try {
      setIsSavingWorkExperience(true);
      await updateExtendedProfile({
        total_experience_years: 0,
        profile_summary: "",
      });
      toast.success(t("profile.workExperienceDeleted"));
      setTotalExperienceYears("0");
      setWorkExperienceDetails("");
      setProfileSummary("");
      setIsEditingWorkExperience(true);
      refetchFullProfile();
      refetchTrustScore();
    } catch (error: any) {
      toast.error(error?.data?.message || t("profile.workExperienceDeleteFailed"));
    } finally {
      setIsSavingWorkExperience(false);
    }
  };

  const handleSaveSummary = async () => {
    try {
      await updateExtendedProfile({ profile_summary: profileSummary });
      toast.success(t("profile.saveSuccess", { defaultValue: "Profile updated successfully" }));
      setIsEditingSummary(false);
      refetchFullProfile();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("profile.profileUpdateFailed"));
    }
  };

  const formatDuration = (startDate: string, endDate?: string | null, isCurrent?: boolean) => {
    const start = new Date(startDate);
    const end = isCurrent || !endDate ? new Date() : new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "";
    }

    const startLabel = start.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const endLabel = isCurrent ? t("profile.present") : end.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return `${startLabel} - ${endLabel}`;
  };

  if (loading && !profileData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#7f56d9]"></div>
      </div>
    );
  }

  if (normalizedUserRole === "employer") {
    return (
      <div className="min-h-screen bg-gray-50 animate-fadeIn pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 mx-4 mt-4">
            <p className="font-medium"><ExclamationTriangleIcon className="w-5 h-5 inline" /> {error}</p>
          </div>
        )}

        <ProfileHeaderCard
          profileData={profileData}
          fullProfileData={currentProfileData}
          profileCompletion={profileCompletion}
          onEditProfileClick={() => setIsEditProfileModalOpen(true)}
          onPhoneVerificationClick={() => setIsPhoneVerificationModalOpen(true)}
          onAcademicVerificationClick={() => navigate("/dashboard/academic/pending")}
          onProfileDataRefresh={handleProfileUpdateSuccess}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-8">
            <div className="lg:col-span-4">
              <EmployerProfile profileData={profileData} fullProfileData={currentProfileData || null} />
            </div>
          </div>
        </div>

        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          profileData={profileData}
          onUpdateSuccess={handleProfileUpdateSuccess}
          userRole={userRole || ""}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn pb-8">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 mx-4 mt-4">
          <p className="font-medium"><ExclamationTriangleIcon className="w-5 h-5 inline" /> {error}</p>
        </div>
      )}

      <ProfileHeaderCard
        profileData={profileData}
        fullProfileData={currentProfileData}
        profileCompletion={profileCompletion}
        onEditProfileClick={() => setIsEditProfileModalOpen(true)}
        onPhoneVerificationClick={() => setIsPhoneVerificationModalOpen(true)}
        onAcademicVerificationClick={() => navigate("/dashboard/academic/pending")}
        onProfileDataRefresh={handleProfileUpdateSuccess}
      />

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isSuperAdmin ? (
          // SUPERADMIN DASHBOARD WITH SIDEBAR - PREMIUM MODERN DESIGN
          <div className="flex flex-col lg:flex-row gap-6 py-8">

            {/* LEFT SIDEBAR - Navigation */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100/50 overflow-hidden sticky top-4 h-fit backdrop-blur-sm">
                <div className="bg-gradient-to-br from-[#7f56d9] via-[#6d46ba] to-[#5b3ba5] px-6 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{t("profile.dashboard", { defaultValue: "Dashboard" })}</h3>
                      <p className="text-white/70 text-xs">{t("profile.adminPanel", { defaultValue: "Administration" })}</p>
                    </div>
                  </div>
                </div>
                <nav className="p-4 space-y-2">
                  {[
                    { 
                      key: "overview" as const, 
                      label: t("profile.dashboardOverview", { defaultValue: "Overview" }),
                      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                      color: "bg-blue-100 group-hover:bg-blue-200"
                    },
                    { 
                      key: "account" as const, 
                      label: t("profile.dashboardAccountSettings", { defaultValue: "Account Settings" }),
                      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>,
                      color: "bg-purple-100 group-hover:bg-purple-200"
                    },
                    { 
                      key: "permissions" as const, 
                      label: t("profile.dashboardPermissions", { defaultValue: "Permissions" }),
                      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                      color: "bg-green-100 group-hover:bg-green-200"
                    },
                    { 
                      key: "stats" as const, 
                      label: t("profile.dashboardPlatformStats", { defaultValue: "Platform Stats" }),
                      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
                      color: "bg-orange-100 group-hover:bg-orange-200"
                    },
                    { 
                      key: "security" as const, 
                      label: t("profile.dashboardAuditSecurity", { defaultValue: "Audit & Security" }),
                      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
                      color: "bg-red-100 group-hover:bg-red-200"
                    },
                  ].map((item: SuperAdminNavItem) => (
                    <button
                      key={item.key}
                      onClick={() => setSuperAdminActiveTab(item.key)}
                      className={`group w-full text-left px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3 transform hover:scale-105 ${
                        superAdminActiveTab === item.key
                          ? "bg-gradient-to-r from-[#7f56d9] to-[#5b3ba5] text-white shadow-lg shadow-purple-500/30"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span className={`p-2 rounded-lg transition-all ${superAdminActiveTab === item.key ? "bg-white/20" : item.color}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {superAdminActiveTab === item.key && (
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* RIGHT CONTENT AREA */}
            <div className="flex-1 space-y-6">

              {/* PREMIUM IDENTITY HEADER - Always Visible */}
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100/50 overflow-hidden transform hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-[#7f56d9] via-[#6d46ba] to-[#5b3ba5] px-8 py-12 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <svg className="absolute -right-12 -top-12 w-40 h-40 text-white" fill="currentColor" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" /></svg>
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4 flex-wrap">
                        <h1 className="text-4xl md:text-3xl font-bold tracking-tight">{userData?.full_name || userData?.name || t("profile.loading", { defaultValue: "Loading..." })}</h1>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold border border-white/30 hover:bg-white/30 transition-all">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                            {t("profile.superAdminBadge", { defaultValue: "SuperAdmin" })}
                          </span>
                          <span className="inline-flex items-center px-4 py-2 bg-emerald-400/20 backdrop-blur-sm rounded-full text-xs font-bold border border-emerald-400/30 text-emerald-100">
                            <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                            {t("profile.accountActive", { defaultValue: "Active" })}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white/95 flex items-center gap-2 text-sm md:text-base">
                          <EnvelopeIcon className="w-5 h-5" />
                          {userData?.email || t("profile.loading", { defaultValue: "Loading..." })}
                        </p>
                        <p className="text-white/80 text-sm">
                          {t("profile.lastLogin", { defaultValue: "Last login" })}: <span className="font-semibold text-white">{profileData?.updated_at ? new Date(profileData.updated_at).toLocaleString('en-US', {weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true}) : "..."}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl blur opacity-75"></div>
                          <UserIcon className="w-12 h-12 text-white/80 relative" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TAB 1: OVERVIEW */}
              {superAdminActiveTab === "overview" && (
                <div className="space-y-8 animate-fadeIn">
                  {/* System Overview Cards */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold text-gray-900">{t("profile.systemOverview", { defaultValue: "System Overview" })}</h2>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{t("profile.realtime", { defaultValue: "Real-time" })}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Total Users Card */}
                      <div className="bg-white rounded-2xl border border-gray-100/50 p-6 shadow-md hover:shadow-xl hover:border-blue-200/50 transition-all duration-300 transform hover:scale-105 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                              <UserIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-lg">+12%</span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm mb-1">{t("profile.totalUsers", { defaultValue: "Total Users" })}</h3>
                          <div className="flex items-end justify-between">
                            <span className="text-3xl font-bold text-blue-600">{isDashboardMetricsLoading ? "..." : (dashboardMetricsData?.data?.totalUsers ?? "0")}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            {t("profile.registeredUsers", { defaultValue: "Registered users" })}
                          </p>
                        </div>
                      </div>
                      {/* Total Students Card */}
                      <div className="bg-white rounded-2xl border border-gray-100/50 p-6 shadow-md hover:shadow-xl hover:border-green-200/50 transition-all duration-300 transform hover:scale-105 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                              <CheckCircleIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-lg">+8%</span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm mb-1">{t("profile.totalStudents", { defaultValue: "Total Students" })}</h3>
                          <div className="flex items-end justify-between">
                            <span className="text-3xl font-bold text-green-600">{isDashboardMetricsLoading ? "..." : (dashboardMetricsData?.data?.totalStudents ?? "0")}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            {t("profile.studentCount", { defaultValue: "Enrolled students" })}
                          </p>
                        </div>
                      </div>
                      {/* Active Jobs Card */}
                      <div className="bg-white rounded-2xl border border-gray-100/50 p-6 shadow-md hover:shadow-xl hover:border-purple-200/50 transition-all duration-300 transform hover:scale-105 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                              <BriefcaseIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1 rounded-lg">+5%</span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm mb-1">{t("profile.activeJobs", { defaultValue: "Active Jobs" })}</h3>
                          <div className="flex items-end justify-between">
                            <span className="text-3xl font-bold text-purple-600">{isDashboardMetricsLoading ? "..." : (dashboardMetricsData?.data?.activeJobs ?? "0")}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            {t("profile.openPositions", { defaultValue: "Open positions" })}
                          </p>
                        </div>
                      </div>
                      {/* Transactions Card */}
                      <div className="bg-white rounded-2xl border border-gray-100/50 p-6 shadow-md hover:shadow-xl hover:border-orange-200/50 transition-all duration-300 transform hover:scale-105 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                              <CurrencyDollarIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2.5 py-1 rounded-lg">+3%</span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm mb-1">{t("profile.transactions", { defaultValue: "Transactions" })}</h3>
                          <div className="flex items-end justify-between">
                            <span className="text-3xl font-bold text-orange-600">{isJobPaymentsLoading ? "..." : (jobPaymentsData?.data?.length ?? 0)}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                            {t("profile.recentTransactions", { defaultValue: "Recent transactions" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Controls Section */}
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-gray-900">{t("profile.quickControls", { defaultValue: "Quick Controls" })}</h2>
                    <div className="bg-white rounded-2xl border border-gray-100/50 p-8 shadow-md">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { key: "maintenance", label: t("profile.maintenance", { defaultValue: "Maintenance" }), icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>, color: "from-amber-500 to-orange-500", bgLight: "bg-amber-50" },
                          { key: "registrations", label: t("profile.registrations", { defaultValue: "Registrations" }), icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>, color: "from-blue-500 to-cyan-500", bgLight: "bg-blue-50" },
                          { key: "broadcast", label: t("profile.broadcast", { defaultValue: "Broadcast" }), icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 001-5.868m-5.423 8.813a3.37 3.37 0 01-4.1-3.445" /></svg>, color: "from-pink-500 to-rose-500", bgLight: "bg-pink-50" },
                          { key: "logoutAll", label: t("profile.logoutAll", { defaultValue: "Logout All" }), icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>, color: "from-red-500 to-pink-500", bgLight: "bg-red-50" },
                        ].map((control, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSuperAdminActiveTab(control.key as SuperAdminTab)}
                            className={`group relative p-6 rounded-2xl text-center border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg cursor-pointer overflow-hidden transform hover:scale-105`}
                          >
                            <div className={`absolute inset-0 ${control.bgLight} opacity-0 group-hover:opacity-100 transition-all duration-300`}></div>
                            <div className="relative z-10 flex flex-col items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${control.color} flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform`}>
                                {control.icon}
                              </div>
                              <span className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{control.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACCOUNT SETTINGS */}
              {superAdminActiveTab === "account" && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">{t("profile.dashboardPersonalSettings", { defaultValue: "Personal Settings" })}</h2>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-[#7f56d9] to-[#5b3ba5] px-6 py-5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                        {t("profile.dashboardPersonalSettings", { defaultValue: "Personal Settings" })}
                      </h3>
                    </div>
                    <div className="p-6 space-y-3">
                      <button onClick={() => setIsEditProfileModalOpen(true)} className="w-full p-4 border-2 border-[#e0d8f0] rounded-xl hover:border-[#7f56d9] hover:bg-[#f5f3ff] transition-all text-left font-semibold text-gray-900 flex items-center justify-between">
                        <span className="flex items-center gap-2"><PencilIcon className="w-5 h-5 text-[#7f56d9]" />{t("profile.editProfile", { defaultValue: "Edit Profile" })}</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <button onClick={() => setSuperAdminActiveTab("language")} className="w-full p-4 border-2 border-[#e0d8f0] rounded-xl hover:border-[#7f56d9] hover:bg-[#f5f3ff] transition-all text-left font-semibold text-gray-900 flex items-center justify-between">
                        <span className="flex items-center gap-2"><svg className="w-5 h-5 text-[#7f56d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{t("profile.language", { defaultValue: "Language" })}</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PERMISSIONS */}
              {superAdminActiveTab === "permissions" && (
                <PermissionsManagement />
              )}

              {/* TAB 4: PLATFORM STATS */}
              {superAdminActiveTab === "stats" && (
                <PlatformStatistics />
              )}

              {/* TAB 5: AUDIT & SECURITY */}
              {superAdminActiveTab === "security" && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">{t("profile.dashboardSecuritySettings", { defaultValue: "Security Settings" })}</h2>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-[#7f56d9] to-[#5b3ba5] px-6 py-5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        {t("profile.dashboardSecuritySettings", { defaultValue: "Security Settings" })}
                      </h3>
                    </div>
                    <div className="p-6 space-y-3">
                      <button onClick={() => setIsChangePasswordModalOpen(true)} className="w-full p-4 border-2 border-[#e0d8f0] rounded-xl hover:border-[#7f56d9] hover:bg-[#f5f3ff] transition-all text-left font-semibold text-gray-900 flex items-center justify-between">
                        <span className="flex items-center gap-2"><svg className="w-5 h-5 text-[#7f56d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.192 5.978A6 6 0 1115 7z" /></svg>{t("profile.changePassword", { defaultValue: "Change Password" })}</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <button onClick={() => setSuperAdminActiveTab("twoFactorAuth")} className="w-full p-4 border-2 border-[#e0d8f0] rounded-xl hover:border-[#7f56d9] hover:bg-[#f5f3ff] transition-all text-left font-semibold text-gray-900 flex items-center justify-between">
                        <span className="flex items-center gap-2"><svg className="w-5 h-5 text-[#7f56d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>{t("profile.twoFactorAuth", { defaultValue: "Two-Factor Auth" })}</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      <button onClick={() => setSuperAdminActiveTab("activeSessions")} className="w-full p-4 border-2 border-[#e0d8f0] rounded-xl hover:border-[#7f56d9] hover:bg-[#f5f3ff] transition-all text-left font-semibold text-gray-900 flex items-center justify-between">
                        <span className="flex items-center gap-2"><svg className="w-5 h-5 text-[#7f56d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{t("profile.activeSessions", { defaultValue: "Active Sessions" })}</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Tab */}
              {superAdminActiveTab === "maintenance" && (
                <div className="space-y-8 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-900">{t("profile.maintenance", { defaultValue: "Maintenance" })}</h2>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        {t("profile.maintenance", { defaultValue: "Maintenance Mode" })}
                      </h3>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-6">{t("profile.maintenanceDescription", { defaultValue: "Manage platform maintenance and updates" })}</p>
                      <button className="w-full p-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        {t("profile.enableMaintenance", { defaultValue: "Enable Maintenance Mode" })}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Registrations Tab */}
              {superAdminActiveTab === "registrations" && (
                <div className="space-y-8 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-900">{t("profile.registrations", { defaultValue: "User Registrations" })}</h2>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        {t("profile.registrations", { defaultValue: "Registrations" })}
                      </h3>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-6">{t("profile.registrationsDescription", { defaultValue: "Monitor user registrations and approval" })}</p>
                      <div className="p-4 border-2 border-blue-200 rounded-xl bg-blue-50">
                        <p className="text-sm text-gray-600">{t("profile.pendingRegistrations", { defaultValue: "0 pending registrations" })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Broadcast Tab */}
              {superAdminActiveTab === "broadcast" && (
                <div className="space-y-8 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-900">{t("profile.broadcast", { defaultValue: "Broadcast Messages" })}</h2>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-pink-600 to-pink-700 px-6 py-5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.961 1.961 0 01-2.773-.802c-.274-.373-.645-.824-1.058-1.291a7.902 7.902 0 01-.32-7.858A7.896 7.896 0 0110.855 4.82c.353-.502.657-.823.82-1.023a2.989 2.989 0 011.946-.53 2.987 2.987 0 011.946.53c.163.2.467.521.82 1.023A7.897 7.897 0 0120.3 9.35" /></svg>
                        {t("profile.broadcast", { defaultValue: "Broadcast" })}
                      </h3>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-6">{t("profile.broadcastDescription", { defaultValue: "Send platform-wide messages to users" })}</p>
                      <button className="w-full p-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        {t("profile.createBroadcast", { defaultValue: "Create New Broadcast" })}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Logout All Tab */}
              {superAdminActiveTab === "logoutAll" && (
                <div className="space-y-8 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-900">{t("profile.logoutAll", { defaultValue: "Logout All Users" })}</h2>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        {t("profile.logoutAll", { defaultValue: "Logout All" })}
                      </h3>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-6">{t("profile.logoutAllDescription", { defaultValue: "Force logout all users from the platform" })}</p>
                      <button className="w-full p-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        {t("profile.executeLogoutAll", { defaultValue: "Execute Logout All" })}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Language Settings Tab */}
              {superAdminActiveTab === "language" && (
                <div className="space-y-8 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-900">{t("profile.language", { defaultValue: "Language Settings" })}</h2>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {t("profile.language", { defaultValue: "Language" })}
                      </h3>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-6">{t("profile.languageDescription", { defaultValue: "Change the platform language and display settings" })}</p>
                      <div className="space-y-3">
                        {[
                          { code: "en", label: "English", flag: "🇺🇸" },
                          { code: "fr", label: "Français", flag: "🇫🇷" },
                          { code: "af", label: "Afrikaans", flag: "🇿🇦" },
                          { code: "sw", label: "Kiswahili", flag: "🇰🇪" },
                          { code: "rw", label: "Kinyarwanda", flag: "🇷🇼" },
                          { code: "zu", label: "Zulu", flag: "🇿🇦" },
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              // Language change handler would go here
                              toast.success(`${t("profile.languageChanged", { defaultValue: "Language changed to" })} ${lang.label}`);
                            }}
                            className="w-full p-4 border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl transition-all text-left font-semibold text-gray-900 flex items-center justify-between group"
                          >
                            <span className="flex items-center gap-3">
                              <span className="text-2xl">{lang.flag}</span>
                              <span>{lang.label}</span>
                            </span>
                            <svg className="w-5 h-5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Two-Factor Authentication Tab */}
              {superAdminActiveTab === "twoFactorAuth" && (
                <div className="space-y-8 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-900">{t("profile.twoFactorAuth", { defaultValue: "Two-Factor Authentication" })}</h2>
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        {t("profile.twoFactorAuth", { defaultValue: "2FA Settings" })}
                      </h3>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-6">{t("profile.twoFactorDescription", { defaultValue: "Enable two-factor authentication for enhanced security" })}</p>
                      <div className="bg-cyan-50 border-2 border-cyan-200 rounded-xl p-6 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{t("profile.twoFactorBenefit", { defaultValue: "Enhance Your Security" })}</h4>
                            <p className="text-sm text-gray-600">{t("profile.twoFactorBenefitDesc", { defaultValue: "Add an extra layer of protection to your account" })}</p>
                          </div>
                        </div>
                      </div>
                      <button className="w-full p-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        {t("profile.enable2FA", { defaultValue: "Enable 2FA" })}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Sessions Tab */}
              {superAdminActiveTab === "activeSessions" && (
                <ActiveSessions />
              )}

            </div>

          </div>
        ) : (
          // Regular User Profile Layout
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Quick Links */}
            <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-4">
              <div className="bg-[#5b3ba5] px-4 py-3">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  {t("profile.quickLinks")}
                </h3>
              </div>
              <nav className="p-3 space-y-1">
                {[
                  { key: "resume", label: t("profile.resume"), action: t("profile.update"), icon: <DocumentTextIcon className="w-4 h-4" /> },
                  { key: "internship", label: t("profile.internship", { defaultValue: "Internship" }), action: t("profile.update"), icon: <DocumentTextIcon className="w-4 h-4" /> },
                  { key: "resume-headline", label: t("profile.resumeHeadline"), icon: <PencilSquareIcon className="w-4 h-4" /> },
                  { key: "key-skills", label: t("profile.workExperience"), action: t("profile.update"), icon: <BriefcaseIcon className="w-4 h-4" /> },
                  { key: "education", label: t("profile.education"), action: t("profile.add"), icon: <AcademicCapIcon className="w-4 h-4" /> },
                  { key: "it-skills", label: t("profile.itSkills"), icon: <ComputerDesktopIcon className="w-4 h-4" /> },
                  { key: "projects", label: t("profile.projects"), icon: <RocketLaunchIcon className="w-4 h-4" /> },
                  { key: "profile-summary", label: t("profile.profileSummary"), icon: <UserIcon className="w-4 h-4" /> },
                  { key: "accomplishments", label: t("profile.accomplishments"), icon: <TrophyIcon className="w-4 h-4" /> },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key as ActiveSection)}
                    className={`cursor-pointer w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group ${
                      activeSection === item.key
                        ? "bg-[#7f56d9] text-white shadow-lg"
                        : "text-gray-700 hover:bg-[#f5f3ff] hover:shadow-md"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    {item.action && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        activeSection === item.key
                          ? "bg-white/20 text-white"
                          : "bg-[#f5f3ff] text-[#5b3ba5]"
                      }`}>
                        {item.action}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Resume Section */}
            {activeSection === "resume" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#7f56d9] px-6 py-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t("profile.resume")}
                  </h2>
                </div>
                <div className="p-6">
                  {profileData?.resume_url && (
                    <div className="flex items-center justify-between p-5 bg-[#f5f3ff] rounded-xl border-2 border-[#e0d8f0] mb-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#7f56d9] rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">
                            {t("profile.resume")}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">{t("profile.uploadedOn")}:</span> {profileData.updated_at
                              ? new Date(profileData.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                              : t("profile.recently")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="cursor-pointer p-3 rounded-xl bg-white hover:bg-[#faf8ff] border-2 border-[#e0d8f0] transition-all shadow-sm hover:shadow-md"
                          onClick={handleViewResume}
                          title="View Resume"
                        >
                          <EyeIcon className="w-5 h-5 text-[#7f56d9]" />
                        </button>
                        <button 
                          type="button"
                          className="cursor-pointer p-3 rounded-xl bg-white hover:bg-red-50 border-2 border-red-200 transition-all  shadow-sm hover:shadow-md" 
                          onClick={handleDeleteResume}
                          title={t("profile.deleteResume")}
                        >
                          <TrashIcon className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="border-2 border-dashed border-[#e0d8f0] rounded-xl p-10 text-center bg-[#f5f3ff] hover:border-[#7f56d9] transition-all">
                    <input 
                      type="file" 
                      id="resume-upload" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.rtf" 
                      onChange={handleResumeUpload} 
                      disabled={isUploadingResume} 
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                      <div className="w-20 h-20 bg-[#7f56d9] rounded-full flex items-center justify-center mb-6 shadow-lg  transition-transform">
                        <CloudArrowUpIcon className="w-10 h-10 text-white" />
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("resume-upload")?.click();
                        }}
                        className="bg-[#7f56d9] hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={isUploadingResume}
                      >
                        {isUploadingResume ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t("profile.uploading")}
                          </span>
                        ) : (
                          t("profile.updateResume")
                        )}
                      </button>
                      <p className="text-sm text-gray-600 mt-4 font-medium">{t("profile.supportedFormats")} <span className="text-[#7f56d9]">DOC, DOCX, RTF, PDF</span></p>
                      <p className="text-xs text-gray-500 mt-1">{t("profile.maxFileSize")}</p>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Internship Certificate Section */}
            {activeSection === "internship" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#7f56d9] px-6 py-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t("profile.internship", { defaultValue: "Internship" })}
                  </h2>
                </div>
                <div className="p-6">
                  {internshipCertificate?.credential_url && (
                    <div className="flex items-center justify-between p-5 bg-[#f5f3ff] rounded-xl border-2 border-[#e0d8f0] mb-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#7f56d9] rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">
                            {t("profile.internship", { defaultValue: "Internship" })} Certificate
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">{t("profile.uploadedOn")}:</span>{" "}
                            {internshipCertificate.updated_at
                              ? new Date(internshipCertificate.updated_at).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : t("profile.recently")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="cursor-pointer p-3 rounded-xl bg-white hover:bg-[#faf8ff] border-2 border-[#e0d8f0] transition-all shadow-sm hover:shadow-md"
                          onClick={handleViewInternshipCertificate}
                          title="View Internship Certificate"
                        >
                          <EyeIcon className="w-5 h-5 text-[#7f56d9]" />
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer p-3 rounded-xl bg-white hover:bg-red-50 border-2 border-red-200 transition-all shadow-sm hover:shadow-md"
                          onClick={handleDeleteInternshipCertificate}
                          title={t("profile.deleteResume")}
                        >
                          <TrashIcon className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="border-2 border-dashed border-[#e0d8f0] rounded-xl p-10 text-center bg-[#f5f3ff] hover:border-[#7f56d9] transition-all">
                    <input
                      type="file"
                      id="internship-certificate-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.rtf"
                      onChange={handleInternshipCertificateUpload}
                      disabled={isUploadingInternshipCertificate}
                    />
                    <label htmlFor="internship-certificate-upload" className="cursor-pointer flex flex-col items-center">
                      <div className="w-20 h-20 bg-[#7f56d9] rounded-full flex items-center justify-center mb-6 shadow-lg transition-transform">
                        <CloudArrowUpIcon className="w-10 h-10 text-white" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("internship-certificate-upload")?.click();
                        }}
                        className="bg-[#7f56d9] hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={isUploadingInternshipCertificate}
                      >
                        {isUploadingInternshipCertificate ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t("profile.uploading")}
                          </span>
                        ) : (
                          t("profile.uploadInternshipCertificate", { defaultValue: "Upload Internship Certificate" })
                        )}
                      </button>
                      <p className="text-sm text-gray-600 mt-4 font-medium">
                        {t("profile.supportedFormats")} <span className="text-[#7f56d9]">DOC, DOCX, RTF, PDF</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{t("profile.maxFileSize")}</p>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Resume Headline Section */}
            {activeSection === "resume-headline" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#7f56d9] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {t("profile.resumeHeadline")}
                    </h2>
                    <button 
                      onClick={() => setIsEditingHeadline(!isEditingHeadline)} 
                      className="cursor-pointer p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {isEditingHeadline ? (
                    <div className="space-y-4">
                      <textarea
                        value={resumeHeadline}
                        onChange={(e) => setResumeHeadline(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                        rows={4}
                        placeholder={t("profile.resumeHeadlinePlaceholder")}
                      />
                      <div className="flex gap-3">
                        <button 
                          onClick={handleSaveHeadline} 
                          className="cursor-pointer bg-[#7f56d9] hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl "
                        >
                          {t("profile.saveChanges")}
                        </button>
                        <button 
                          onClick={() => setIsEditingHeadline(false)} 
                          className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold transition-all"
                        >
                          {t("profile.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-[#f5f3ff] rounded-xl border-2 border-[#e0d8f0]">
                      <p className="text-gray-800 text-lg leading-relaxed">
                        {resumeHeadline || (
                          <span className="text-gray-500 italic">{t("profile.addHeadlinePlaceholder")}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Work Experience Section */}
            {activeSection === "key-skills" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#7f56d9] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <BriefcaseIcon className="w-6 h-6" />
                      {t("profile.workExperience")}
                    </h2>
                    <button
                      onClick={() => { setEditingItem(null); setIsEmploymentModalOpen(true); }}
                      className="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" /> {t("profile.addEmployment")}
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="bg-[#f5f3ff] rounded-xl border-2 border-[#e0d8f0] p-6 space-y-4">
                      {isEditingWorkExperience ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t("profile.totalExperienceYears")}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={totalExperienceYears}
                              onChange={(e) => setTotalExperienceYears(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-[#e0d8f0] rounded-xl focus:ring-2 focus:ring-[#7f56d9] focus:border-[#7f56d9] transition-all"
                              placeholder={t("profile.totalExperienceYearsPlaceholder")}
                            />
                          </div>
                          <textarea
                            value={workExperienceDetails}
                            onChange={(e) => setWorkExperienceDetails(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#e0d8f0] rounded-xl focus:ring-2 focus:ring-[#7f56d9] focus:border-[#7f56d9] resize-none transition-all"
                            rows={5}
                            placeholder={t("profile.workExperienceDetailsPlaceholder")}
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={handleSaveWorkExperience}
                              disabled={isSavingWorkExperience}
                              className="cursor-pointer bg-[#7f56d9] hover:bg-[#5b3ba5] text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                              {isSavingWorkExperience ? t("profile.saving") : t("profile.saveWorkExperience")}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{t("profile.workExperience")}</h3>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleEditWorkExperience}
                                className="cursor-pointer p-2 rounded-lg bg-white hover:bg-orange-100 text-orange-600 transition-all shadow-sm hover:shadow-md"
                                title={t("profile.edit")}
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={handleDeleteWorkExperience}
                                disabled={isSavingWorkExperience}
                                className="cursor-pointer p-2 rounded-lg bg-white hover:bg-red-100 text-red-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                                title={t("profile.delete")}
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">{t("profile.totalExperienceYears")}</p>
                            <p className="text-gray-900 font-medium">
                              {totalExperienceYears || "0"} {(Number(totalExperienceYears || 0) === 1 ? t("profile.year") : t("profile.years"))}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">{t("profile.workExperienceDetails")}</p>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {workExperienceDetails?.trim() || t("profile.noWorkExperienceDetails")}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-6">
                      {employments.length > 0 ? (
                        employments.map((job) => (
                          <div key={job.employment_id} className="bg-[#f5f3ff] rounded-xl p-6 border-2 border-[#e0d8f0] hover:border-[#e0d8f0] transition-all shadow-sm hover:shadow-md">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-12 h-12 bg-[#7f56d9] rounded-xl flex items-center justify-center shadow-lg">
                                    <BriefcaseIcon className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-xl font-bold text-gray-900">{job.job_title}</h3>
                                      {job.is_current && (
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{t("profile.current")}</span>
                                      )}
                                    </div>
                                    <p className="text-lg font-semibold text-[#5b3ba5]">{job.company_name}</p>
                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                      <span className="capitalize">{job.employment_type.replace("_", " ")}</span>
                                      <span>•</span>
                                      <span>{formatDuration(job.start_date, job.end_date, job.is_current)}</span>
                                    </p>
                                    {job.notice_period && (
                                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                        <CalendarIcon className="w-4 h-4" />
                                        {job.notice_period}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => { setEditingItem(job); setIsEmploymentModalOpen(true); }}
                                  className="cursor-pointer p-2 rounded-lg bg-white hover:bg-orange-100 text-orange-600 transition-all shadow-sm hover:shadow-md"
                                  title={t("profile.edit")}
                                >
                                  <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(t("profile.confirmDeleteEmployment"))) {
                                      await deleteEmployment(job.employment_id);
                                      toast.success(t("profile.employmentDeleted"));
                                    }
                                  }}
                                  className="cursor-pointer p-2 rounded-lg bg-white hover:bg-red-100 text-red-600 transition-all shadow-sm hover:shadow-md"
                                  title={t("profile.delete")}
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            {job.description && (
                              <div className="mb-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">{t("profile.workExperienceDetails")}</p>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                              </div>
                            )}

                            {job.key_skills && job.key_skills.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-3">{t("profile.keySkillsUsed")}</p>
                                <div className="flex flex-wrap gap-2">
                                  {job.key_skills.map((skill, index) => (
                                    <span key={`${job.employment_id}-${skill}-${index}`} className="px-3 py-1.5 bg-white text-[#5b3ba5] rounded-full text-sm font-medium border border-[#e0d8f0]">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="w-full p-8 text-center bg-[#f5f3ff] rounded-xl border-2 border-dashed border-[#e0d8f0]">
                          <BriefcaseIcon className="w-10 h-10 text-[#7f56d9] mx-auto mb-3" />
                          <p className="text-gray-600 font-medium mb-4">{t("profile.addEmploymentHint")}</p>
                          <button
                            onClick={() => { setEditingItem(null); setIsEmploymentModalOpen(true); }}
                            className="cursor-pointer bg-[#7f56d9] hover:bg-[#5b3ba5] text-white px-6 py-2.5 rounded-xl font-semibold transition-all"
                          >
                            <PlusIcon className="w-4 h-4 inline mr-1" />
                            {t("profile.addEmployment")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Employment Section */}
            {activeSection === "employment" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#7f56d9] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <BriefcaseIcon className="w-6 h-6" />
                      {t("profile.employmentHistory")}
                    </h2>
                    <button
                      onClick={() => { setEditingItem(null); setIsEmploymentModalOpen(true); }}
                      className="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl  flex items-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" /> {t("profile.addEmployment")}
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {employments.length > 0 ? (
                      employments.map((job) => (
                        <div key={job.employment_id} className="bg-[#f5f3ff] rounded-xl p-6 border-2 border-[#e0d8f0] hover:border-[#e0d8f0] transition-all shadow-sm hover:shadow-md">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-[#7f56d9] rounded-xl flex items-center justify-center shadow-lg">
                                  <BriefcaseIcon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-bold text-gray-900">{job.job_title}</h3>
                                    {job.is_current && (
                                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{t("profile.current")}</span>
                                    )}
                                  </div>
                                  <p className="text-lg font-semibold text-[#5b3ba5]">{job.company_name}</p>
                                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                    <span className="capitalize">{job.employment_type.replace("_", " ")}</span>
                                    <span>•</span>
                                    <span>{formatDuration(job.start_date, job.end_date, job.is_current)}</span>
                                  </p>
                                  {job.notice_period && (
                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                      <CalendarIcon className="w-4 h-4" />
                                      {job.notice_period}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setEditingItem(job); setIsEmploymentModalOpen(true); }}
                                className="cursor-pointer p-2 rounded-lg bg-white hover:bg-orange-100 text-orange-600 transition-all shadow-sm hover:shadow-md"
                                title={t("profile.edit")}
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(t("profile.confirmDeleteEmployment"))) {
                                    await deleteEmployment(job.employment_id);
                                    toast.success(t("profile.employmentDeleted"));
                                    refetchFullProfile();
                                  }
                                }}
                                className="cursor-pointer p-2 rounded-lg bg-white hover:bg-red-100 text-red-600 transition-all shadow-sm hover:shadow-md"
                                title={t("profile.delete")}
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          {job.description && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-orange-100">
                              <p className="text-gray-700 leading-relaxed">{job.description}</p>
                            </div>
                          )}
                          {job.key_skills && job.key_skills.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold text-gray-700 mb-3">{t("profile.keySkillsUsed")}</p>
                              <div className="flex flex-wrap gap-2">
                                {job.key_skills.map((skill, idx) => (
                                  <span key={idx} className="px-3 py-1.5 bg-white border border-[#e0d8f0] text-[#5b3ba5] rounded-full text-xs font-semibold shadow-sm">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-[#f5f3ff] rounded-xl border-2 border-dashed border-[#e0d8f0]">
                        <BriefcaseIcon className="w-12 h-12 text-[#7f56d9] mx-auto mb-4" />
                        <p className="text-gray-600 font-medium text-lg mb-2">{t("profile.noEmploymentYet")}</p>
                        <p className="text-gray-500 text-sm mb-4">{t("profile.addEmploymentHint")}</p>
                        <button onClick={() => { setEditingItem(null); setIsEmploymentModalOpen(true); }} className="cursor-pointer bg-[#7f56d9] hover:bg-[#5b3ba5] text-white px-6 py-2.5 rounded-xl font-semibold transition-all">
                          <PlusIcon className="w-4 h-4 inline mr-1" />Add Employment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Education Section */}
            {activeSection === "education" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#7f56d9] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v9M5 13.5A11.96 11.96 0 0112 14a11.96 11.96 0 017-1.5" />
                      </svg>
                      {t("profile.education")}
                    </h2>
                    <button
                      onClick={() => { setEditingItem(null); setIsEducationModalOpen(true); }}
                      className="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl  flex items-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" /> {t("profile.addEducation")}
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {educations.length > 0 ? (
                      educations.map((edu) => (
                        <div key={edu.education_id} className="bg-[#f5f3ff] rounded-xl p-6 border-2 border-[#e0d8f0] hover:border-[#7f56d9] transition-all shadow-sm hover:shadow-md">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-14 h-14 bg-[#7f56d9] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-xl font-bold text-gray-900">{edu.degree}</h3>
                                  {edu.is_current && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{t("profile.ongoing")}</span>
                                  )}
                                </div>
                                <p className="text-lg font-semibold text-[#5b3ba5] mb-1">{edu.institution_name}</p>
                                <p className="text-gray-700 font-medium mb-2">{edu.field_of_study}</p>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    {edu.start_year} - {edu.is_current ? t("profile.present") : edu.end_year}
                                  </span>
                                  {edu.grade && (
                                    <span className="px-3 py-1 bg-white border border-[#e0d8f0] text-[#5b3ba5] rounded-full font-semibold">
                                      Grade: {edu.grade} {edu.grade_type && `(${edu.grade_type})`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => { setEditingItem(edu); setIsEducationModalOpen(true); }}
                                className="cursor-pointer p-2 rounded-lg bg-white hover:bg-[#f5f3ff] text-[#7f56d9] transition-all shadow-sm hover:shadow-md"
                                title={t("profile.edit")}
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(t("profile.confirmDeleteEducation"))) {
                                    await deleteEducation(edu.education_id);
                                    toast.success(t("profile.educationDeleted"));
                                    refetchFullProfile();
                                  }
                                }}
                                className="cursor-pointer p-2 rounded-lg bg-white hover:bg-red-100 text-red-600 transition-all shadow-sm hover:shadow-md"
                                title={t("profile.delete")}
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-[#f5f3ff] rounded-xl border-2 border-dashed border-[#e0d8f0]">
                        <AcademicCapIcon className="w-12 h-12 text-[#7f56d9] mx-auto mb-4" />
                        <p className="text-gray-600 font-medium text-lg mb-2">{t("profile.noEducationYet")}</p>
                        <p className="text-gray-500 text-sm mb-4">{t("profile.addEducationHint")}</p>
                        <button onClick={() => { setEditingItem(null); setIsEducationModalOpen(true); }} className="cursor-pointer bg-[#7f56d9] hover:bg-[#5b3ba5] text-white px-6 py-2.5 rounded-xl font-semibold transition-all">
                          <PlusIcon className="w-4 h-4 inline mr-1" />Add Education
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* IT Skills Section */}
            {activeSection === "it-skills" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#7f56d9] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <ComputerDesktopIcon className="w-6 h-6" />
                      {t("profile.itSkills")}
                    </h2>
                    <button
                      onClick={() => setIsEditingItSkills(!isEditingItSkills)}
                      className="cursor-pointer p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {isEditingItSkills ? (
                    <div className="space-y-4">
                      <textarea
                        value={itSkillsInput}
                        onChange={(e) => setItSkillsInput(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-[#e0d8f0] rounded-xl focus:ring-2 focus:ring-[#7f56d9] focus:border-[#7f56d9] resize-none transition-all"
                        rows={4}
                        placeholder="Enter IT skills separated by commas (e.g., Python, Docker, AWS, SQL)"
                      />
                      <div className="flex gap-3">
                        <button onClick={handleSaveItSkills} className="cursor-pointer bg-[#7f56d9] hover:bg-[#5b3ba5] text-white px-6 py-2.5 rounded-xl font-semibold transition-all">
                          {t("profile.saveSkills")}
                        </button>
                        <button onClick={() => setIsEditingItSkills(false)} className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold transition-all">
                          {t("profile.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {itSkills.length > 0 ? (
                        itSkills.map((skill) => (
                          <span
                            key={skill.skill_id}
                            className="px-5 py-2.5 bg-[#f5f3ff] text-[#5b3ba5] rounded-full text-sm font-semibold hover:bg-[#ede9fe] transition-all shadow-sm hover:shadow-md border border-[#e0d8f0] cursor-default"
                          >
                            {skill.skill_name}
                            {skill.proficiency_level && (
                              <span className="ml-2 text-xs opacity-75">({skill.proficiency_level})</span>
                            )}
                          </span>
                        ))
                      ) : (
                        <div className="w-full p-8 text-center bg-[#f5f3ff] rounded-xl border-2 border-dashed border-[#e0d8f0]">
                          <ComputerDesktopIcon className="w-10 h-10 text-[#7f56d9] mx-auto mb-3" />
                          <p className="text-gray-600 font-medium mb-4">{t("profile.addItSkillsHint")}</p>
                          <button onClick={() => setIsEditingItSkills(true)} className="cursor-pointer bg-[#7f56d9] hover:bg-[#5b3ba5] text-white px-6 py-2.5 rounded-xl font-semibold transition-all">
                            <PlusIcon className="w-4 h-4 inline mr-1" />
                            Add IT Skills
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Projects Section */}
            {activeSection === "projects" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#7f56d9] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {t("profile.projects")}
                    </h2>
                    <button
                      onClick={() => { setEditingItem(null); setIsProjectModalOpen(true); }}
                      className="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl  flex items-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" /> {t("profile.addProject")}
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <div key={project.project_id} className="bg-[#f5f3ff] rounded-xl p-6 border-2 border-[#e0d8f0] hover:border-[#e0d8f0] transition-all shadow-sm hover:shadow-md">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-14 h-14 bg-[#7f56d9] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-xl font-bold text-gray-900">{project.project_title}</h3>
                                  {project.is_ongoing && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{t("profile.ongoing")}</span>
                                  )}
                                </div>
                                {project.role_in_project && (
                                  <p className="text-lg font-semibold text-[#5b3ba5] mb-2">{project.role_in_project}</p>
                                )}
                                {project.project_url && (
                                  <a 
                                    href={project.project_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-2 text-pink-600 hover:text-[#5b3ba5] font-semibold text-sm transition-all hover:underline"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    {t("profile.viewProject")}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => { setEditingItem(project); setIsProjectModalOpen(true); }}
                                className="cursor-pointer p-2 rounded-lg bg-white hover:bg-pink-100 text-pink-600 transition-all shadow-sm hover:shadow-md"
                                title={t("profile.edit")}
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(t("profile.confirmDeleteProject"))) {
                                    await deleteProject(project.project_id);
                                    toast.success(t("profile.projectDeleted"));
                                    refetchFullProfile();
                                  }
                                }}
                                className="cursor-pointer p-2 rounded-lg bg-white hover:bg-red-100 text-red-600 transition-all shadow-sm hover:shadow-md"
                                title={t("profile.delete")}
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          {project.description && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-pink-100">
                              <p className="text-gray-700 leading-relaxed">{project.description}</p>
                            </div>
                          )}
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold text-gray-700 mb-3">{t("profile.technologiesUsed")}</p>
                              <div className="flex flex-wrap gap-2">
                                {project.technologies.map((tech, idx) => (
                                  <span key={idx} className="px-3 py-1.5 bg-white border border-[#e0d8f0] text-[#5b3ba5] rounded-full text-xs font-semibold shadow-sm">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-[#f5f3ff] rounded-xl border-2 border-dashed border-[#e0d8f0]">
                        <RocketLaunchIcon className="w-12 h-12 text-[#7f56d9] mx-auto mb-4" />
                        <p className="text-gray-600 font-medium text-lg mb-2">{t("profile.noProjectsYet")}</p>
                        <p className="text-gray-500 text-sm mb-4">{t("profile.addProjectHint")}</p>
                        <button onClick={() => { setEditingItem(null); setIsProjectModalOpen(true); }} className="cursor-pointer bg-[#7f56d9] hover:bg-[#5b3ba5] text-white px-6 py-2.5 rounded-xl font-semibold transition-all">
                          <PlusIcon className="w-4 h-4 inline mr-1" />Add Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Summary Section */}
            {activeSection === "profile-summary" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#7f56d9] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t("profile.profileSummary")}
                    </h2>
                    <button 
                      onClick={() => setIsEditingSummary(!isEditingSummary)} 
                      className="cursor-pointer p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {isEditingSummary ? (
                    <div className="space-y-4">
                      <textarea
                        value={profileSummary}
                        onChange={(e) => setProfileSummary(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none transition-all"
                        rows={8}
                        placeholder={t("profile.summaryPlaceholder")}
                      />
                      <div className="flex gap-3">
                        <button 
                          onClick={handleSaveSummary} 
                          className="cursor-pointer bg-[#7f56d9] hover:from-amber-700 hover:to-yellow-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl "
                        >
                          {t("profile.saveSummary")}
                        </button>
                        <button 
                          onClick={() => setIsEditingSummary(false)} 
                          className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold transition-all"
                        >
                          {t("profile.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-[#f5f3ff] rounded-xl border-2 border-amber-100">
                      <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                        {profileSummary || (
                          <span className="text-gray-500 italic">{t("profile.addSummaryPlaceholder")}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Accomplishments Section */}
            {activeSection === "accomplishments" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#7f56d9] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      {t("profile.accomplishments")}
                    </h2>
                    <button
                      onClick={() => { setEditingItem(null); setIsAccomplishmentModalOpen(true); }}
                      className="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl  flex items-center gap-2"
                    >
                      <PlusIcon className="w-5 h-5" /> {t("profile.addAccomplishment")}
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {visibleAccomplishments.length > 0 ? (
                      visibleAccomplishments.map((acc) => (
                        <div key={acc.accomplishment_id} className="bg-[#f5f3ff] rounded-xl p-6 border-2 border-[#e0d8f0] hover:border-fuchsia-300 transition-all shadow-sm hover:shadow-md">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-14 h-14 bg-[#7f56d9] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-3 py-1 bg-white border border-fuchsia-300 text-[#5b3ba5] rounded-full text-xs font-bold capitalize shadow-sm">
                                    {acc.accomplishment_type}
                                  </span>
                                  <h3 className="text-xl font-bold text-gray-900">{acc.title}</h3>
                                </div>
                                {acc.issuing_organization && (
                                  <p className="text-lg font-semibold text-[#5b3ba5] mb-2">{acc.issuing_organization}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                                  {acc.issue_date && (
                                    <span className="flex items-center gap-1">
                                      <CalendarIcon className="w-4 h-4" />
                                      Issued: {new Date(acc.issue_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                    </span>
                                  )}
                                  {acc.expiry_date && (
                                    <span className="flex items-center gap-1">
                                      <CalendarIcon className="w-4 h-4" />
                                      Expires: {new Date(acc.expiry_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                    </span>
                                  )}
                                </div>
                                {acc.credential_url && (
                                  <a 
                                    href={acc.credential_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-2 text-fuchsia-600 hover:text-[#5b3ba5] font-semibold text-sm transition-all hover:underline"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    {t("profile.viewCredential")}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={async () => {
                                  if (window.confirm(t("profile.confirmDeleteAccomplishment"))) {
                                    await deleteAccomplishment(acc.accomplishment_id);
                                    toast.success(t("profile.accomplishmentDeleted"));
                                    refetchFullProfile();
                                  }
                                }}
                                className="cursor-pointer p-2 rounded-lg bg-white hover:bg-red-100 text-red-600 transition-all shadow-sm hover:shadow-md"
                                title={t("profile.delete")}
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          {acc.description && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-fuchsia-100">
                              <p className="text-gray-700 leading-relaxed">{acc.description}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-[#f5f3ff] rounded-xl border-2 border-dashed border-[#e0d8f0]">
                        <TrophyIcon className="w-12 h-12 text-[#7f56d9] mx-auto mb-4" />
                        <p className="text-gray-600 font-medium text-lg mb-2">{t("profile.noAccomplishmentsYet")}</p>
                        <p className="text-gray-500 text-sm mb-4">{t("profile.addAccomplishmentsHint")}</p>
                        <button onClick={() => { setEditingItem(null); setIsAccomplishmentModalOpen(true); }} className="cursor-pointer bg-[#7f56d9] hover:bg-[#5b3ba5] text-white px-6 py-2.5 rounded-xl font-semibold transition-all">
                          <PlusIcon className="w-4 h-4 inline mr-1" />Add Accomplishment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* TrustScore Section */}
      {normalizedUserRole === "student" && trustScoreResponse?.data && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <TrustScoreCard
            trustScore={trustScoreResponse.data}
            isLoading={isTrustScoreLoading}
          />
        </div>
      )}

      {/* Employment Modal */}
      <EmploymentModal
        isOpen={isEmploymentModalOpen}
        onClose={() => { setIsEmploymentModalOpen(false); setEditingItem(null); }}
        editingItem={editingItem}
        onSave={async (data) => {
          if (editingItem) {
            await updateEmployment({ id: editingItem.employment_id, data });
          } else {
            await addEmployment(data);
          }
          refetchFullProfile();
          setIsEmploymentModalOpen(false);
          setEditingItem(null);
        }}
      />

      {/* Education Modal */}
      <EducationModal
        isOpen={isEducationModalOpen}
        onClose={() => { setIsEducationModalOpen(false); setEditingItem(null); }}
        editingItem={editingItem}
        onSave={async (data) => {
          if (editingItem) {
            await updateEducation({ id: editingItem.education_id, data });
          } else {
            await addEducation(data);
          }
          refetchFullProfile();
          setIsEducationModalOpen(false);
          setEditingItem(null);
        }}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => { setIsProjectModalOpen(false); setEditingItem(null); }}
        editingItem={editingItem}
        onSave={async (data) => {
          if (editingItem) {
            await updateProject({ id: editingItem.project_id, data });
          } else {
            await addProject(data);
          }
          refetchFullProfile();
          setIsProjectModalOpen(false);
          setEditingItem(null);
        }}
      />

      {/* Accomplishment Modal */}
      <AccomplishmentModal
        isOpen={isAccomplishmentModalOpen}
        onClose={() => { setIsAccomplishmentModalOpen(false); setEditingItem(null); }}
        editingItem={editingItem}
        onSave={async (data) => {
          if (editingItem) {
            // For simplicity, delete and recreate
            await deleteAccomplishment(editingItem.accomplishment_id);
          }
          await addAccomplishment(data);
          refetchFullProfile();
          setIsAccomplishmentModalOpen(false);
          setEditingItem(null);
        }}
      />

      {showViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
          <div className="fixed inset-0 bg-black/40" onClick={closeViewer} />
          <div className="relative bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[85vh] sm:max-h-[90vh] z-[60] flex flex-col overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">Document Viewer</h3>
              <button
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded cursor-pointer"
                onClick={closeViewer}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              {viewerUrl ? (
                viewerContentType?.startsWith("image/") ? (
                  <img
                    src={viewerUrl}
                    alt="document"
                    className="mx-auto max-h-full w-auto object-contain"
                  />
                ) : (
                  <iframe
                    src={viewerUrl}
                    className="w-full h-full border-0 min-h-[500px] sm:min-h-[600px]"
                    title="Document"
                  />
                )
              ) : (
                <div className="text-center p-8 text-gray-500">
                  No document to display
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Existing Modals */}
      <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} userEmail={userData?.email || ""} />
      <EditProfileModal isOpen={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} profileData={profileData} onUpdateSuccess={handleProfileUpdateSuccess} userRole={userRole || ""} />
      <PhoneVerificationModal
        isOpen={isPhoneVerificationModalOpen}
        onClose={() => setIsPhoneVerificationModalOpen(false)}
        onSuccess={handlePhoneVerificationSuccess}
        phoneNumber={profileData?.mobile_number}
        email={userData?.email}
      />
    </div>
  );
};

// ====================== MODAL COMPONENTS ======================

interface EmploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: UserEmployment | null;
  onSave: (data: CreateEmploymentRequest) => Promise<void>;
}

const EmploymentModal: React.FC<EmploymentModalProps> = ({ isOpen, onClose, editingItem, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateEmploymentRequest>({
    job_title: "",
    company_name: "",
    employment_type: "full_time",
    start_date: "",
    end_date: "",
    is_current: false,
    location: "",
    description: "",
    notice_period: "",
    key_skills: [],
  });
  const [skillsInput, setSkillsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        job_title: editingItem.job_title,
        company_name: editingItem.company_name,
        employment_type: editingItem.employment_type,
        start_date: editingItem.start_date.split("T")[0],
        end_date: editingItem.end_date?.split("T")[0] || "",
        is_current: editingItem.is_current,
        location: editingItem.location || "",
        description: editingItem.description || "",
        notice_period: editingItem.notice_period || "",
        key_skills: editingItem.key_skills || [],
      });
      setSkillsInput((editingItem.key_skills || []).join(", "));
    } else {
      setFormData({
        job_title: "",
        company_name: "",
        employment_type: "full_time",
        start_date: "",
        end_date: "",
        is_current: false,
        location: "",
        description: "",
        notice_period: "",
        key_skills: [],
      });
      setSkillsInput("");
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const skills = skillsInput.split(",").map(s => s.trim()).filter(s => s);
      await onSave({ ...formData, key_skills: skills });
      toast.success(editingItem ? t("profile.employmentUpdated") : t("profile.employmentAdded"));
    } catch (error: any) {
      toast.error(error?.data?.message || t("profile.employmentSaveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{editingItem ? t("profile.editEmployment") : t("profile.addEmploymentTitle")}</h2>
          <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.jobTitle")}</label>
              <input type="text" required value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.companyName")}</label>
              <input type="text" required value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.employmentType")}</label>
              <select value={formData.employment_type} onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="full_time">{t("profile.fullTime")}</option>
                <option value="part_time">{t("profile.partTime")}</option>
                <option value="contract">{t("profile.contract")}</option>
                <option value="internship">{t("profile.internship")}</option>
                <option value="freelance">{t("profile.freelance")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.location")}</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.startDate")}</label>
              <input type="date" required value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.endDate")}</label>
              <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} disabled={formData.is_current} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_current" checked={formData.is_current} onChange={(e) => setFormData({ ...formData, is_current: e.target.checked, end_date: "" })} className="rounded border-gray-300 text-[#7f56d9] focus:ring-purple-500" />
            <label htmlFor="is_current" className="text-sm text-gray-700">{t("profile.iCurrentlyWorkHere")}</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.noticePeriod")}</label>
            <input type="text" value={formData.notice_period} onChange={(e) => setFormData({ ...formData, notice_period: e.target.value })} placeholder={t("profile.noticePeriodPlaceholder")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.description")}</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder={t("profile.descriptionPlaceholder")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.keySkillsComma")}</label>
            <input type="text" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder={t("profile.keySkillsExample")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">{t("profile.cancel")}</button>
            <button type="submit" disabled={isSubmitting} className="cursor-pointer px-4 py-2 text-white bg-[#7f56d9] rounded-lg hover:bg-[#5b3ba5] transition disabled:opacity-50">{isSubmitting ? t("profile.saving") : t("profile.save")}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: UserEducation | null;
  onSave: (data: CreateEducationRequest) => Promise<void>;
}

const EducationModal: React.FC<EducationModalProps> = ({ isOpen, onClose, editingItem, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateEducationRequest>({
    degree: "",
    field_of_study: "",
    institution_name: "",
    start_year: new Date().getFullYear(),
    end_year: undefined,
    is_current: false,
    grade: "",
    grade_type: undefined,
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        degree: editingItem.degree,
        field_of_study: editingItem.field_of_study,
        institution_name: editingItem.institution_name,
        start_year: editingItem.start_year,
        end_year: editingItem.end_year || undefined,
        is_current: editingItem.is_current,
        grade: editingItem.grade || "",
        grade_type: editingItem.grade_type,
        description: editingItem.description || "",
      });
    } else {
      setFormData({
        degree: "",
        field_of_study: "",
        institution_name: "",
        start_year: new Date().getFullYear(),
        end_year: undefined,
        is_current: false,
        grade: "",
        grade_type: undefined,
        description: "",
      });
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      toast.success(editingItem ? t("profile.educationUpdated") : t("profile.educationAdded"));
    } catch (error: any) {
      toast.error(error?.data?.message || t("profile.educationSaveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{editingItem ? t("profile.editEducation") : t("profile.addEducationTitle")}</h2>
          <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.degree")}</label>
            <input type="text" required value={formData.degree} onChange={(e) => setFormData({ ...formData, degree: e.target.value })} placeholder={t("profile.degreePlaceholder")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.fieldOfStudy")}</label>
            <input type="text" required value={formData.field_of_study} onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })} placeholder={t("profile.fieldOfStudyPlaceholder")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.institutionName")}</label>
            <input type="text" required value={formData.institution_name} onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.startYear")}</label>
              <input type="number" required min="1950" max="2030" value={formData.start_year} onChange={(e) => setFormData({ ...formData, start_year: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.endYear")}</label>
              <input type="number" min="1950" max="2030" value={formData.end_year || ""} onChange={(e) => setFormData({ ...formData, end_year: e.target.value ? parseInt(e.target.value) : undefined })} disabled={formData.is_current} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_current_edu" checked={formData.is_current} onChange={(e) => setFormData({ ...formData, is_current: e.target.checked, end_year: undefined })} className="rounded border-gray-300 text-[#7f56d9] focus:ring-purple-500" />
            <label htmlFor="is_current_edu" className="text-sm text-gray-700">{t("profile.currentlyPursuing")}</label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.grade")}</label>
              <input type="text" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} placeholder={t("profile.gradePlaceholder")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.gradeType")}</label>
              <select value={formData.grade_type || ""} onChange={(e) => setFormData({ ...formData, grade_type: e.target.value as any || undefined })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="">{t("profile.selectType")}</option>
                <option value="percentage">{t("profile.percentage")}</option>
                <option value="cgpa">{t("profile.cgpa")}</option>
                <option value="gpa">{t("profile.gpa")}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">{t("profile.cancel")}</button>
            <button type="submit" disabled={isSubmitting} className="cursor-pointer px-4 py-2 text-white bg-[#7f56d9] rounded-lg hover:bg-[#5b3ba5] transition disabled:opacity-50">{isSubmitting ? t("profile.saving") : t("profile.save")}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: UserProject | null;
  onSave: (data: CreateProjectRequest) => Promise<void>;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, editingItem, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateProjectRequest>({
    project_title: "",
    project_url: "",
    start_date: "",
    end_date: "",
    is_ongoing: false,
    description: "",
    technologies: [],
    role_in_project: "",
  });
  const [techInput, setTechInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        project_title: editingItem.project_title,
        project_url: editingItem.project_url || "",
        start_date: editingItem.start_date?.split("T")[0] || "",
        end_date: editingItem.end_date?.split("T")[0] || "",
        is_ongoing: editingItem.is_ongoing,
        description: editingItem.description || "",
        technologies: editingItem.technologies || [],
        role_in_project: editingItem.role_in_project || "",
      });
      setTechInput((editingItem.technologies || []).join(", "));
    } else {
      setFormData({
        project_title: "",
        project_url: "",
        start_date: "",
        end_date: "",
        is_ongoing: false,
        description: "",
        technologies: [],
        role_in_project: "",
      });
      setTechInput("");
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const technologies = techInput.split(",").map(s => s.trim()).filter(s => s);
      await onSave({ ...formData, technologies });
      toast.success(editingItem ? t("profile.projectUpdated") : t("profile.projectAdded"));
    } catch (error: any) {
      toast.error(error?.data?.message || t("profile.projectSaveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{editingItem ? t("profile.editProject") : t("profile.addProjectTitle")}</h2>
          <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.projectTitle")}</label>
            <input type="text" required value={formData.project_title} onChange={(e) => setFormData({ ...formData, project_title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.yourRole")}</label>
            <input type="text" value={formData.role_in_project} onChange={(e) => setFormData({ ...formData, role_in_project: e.target.value })} placeholder={t("profile.yourRolePlaceholder")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.projectUrl")}</label>
            <input type="url" value={formData.project_url} onChange={(e) => setFormData({ ...formData, project_url: e.target.value })} placeholder={t("profile.projectUrlPlaceholder")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.description")}</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder={t("profile.describeProject")} />
      </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.technologiesComma")}</label>
            <input type="text" value={techInput} onChange={(e) => setTechInput(e.target.value)} placeholder={t("profile.technologiesExample")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_ongoing" checked={formData.is_ongoing} onChange={(e) => setFormData({ ...formData, is_ongoing: e.target.checked })} className="rounded border-gray-300 text-[#7f56d9] focus:ring-purple-500" />
            <label htmlFor="is_ongoing" className="text-sm text-gray-700">{t("profile.ongoingProject")}</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">{t("profile.cancel")}</button>
            <button type="submit" disabled={isSubmitting} className="cursor-pointer px-4 py-2 text-white bg-[#7f56d9] rounded-lg hover:bg-[#5b3ba5] transition disabled:opacity-50">{isSubmitting ? t("profile.saving") : t("profile.save")}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AccomplishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: UserAccomplishment | null;
  onSave: (data: CreateAccomplishmentRequest) => Promise<void>;
}

const AccomplishmentModal: React.FC<AccomplishmentModalProps> = ({ isOpen, onClose, editingItem, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateAccomplishmentRequest>({
    accomplishment_type: "certification",
    title: "",
    issuing_organization: "",
    issue_date: "",
    expiry_date: "",
    credential_id: "",
    credential_url: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        accomplishment_type: editingItem.accomplishment_type,
        title: editingItem.title,
        issuing_organization: editingItem.issuing_organization || "",
        issue_date: editingItem.issue_date?.split("T")[0] || "",
        expiry_date: editingItem.expiry_date?.split("T")[0] || "",
        credential_id: editingItem.credential_id || "",
        credential_url: editingItem.credential_url || "",
        description: editingItem.description || "",
      });
    } else {
      setFormData({
        accomplishment_type: "certification",
        title: "",
        issuing_organization: "",
        issue_date: "",
        expiry_date: "",
        credential_id: "",
        credential_url: "",
        description: "",
      });
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      toast.success(editingItem ? t("profile.accomplishmentUpdated") : t("profile.accomplishmentAdded"));
    } catch (error: any) {
      toast.error(error?.data?.message || t("profile.accomplishmentSaveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{editingItem ? t("profile.editAccomplishment") : t("profile.addAccomplishmentTitle")}</h2>
          <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.type")}</label>
            <select value={formData.accomplishment_type} onChange={(e) => setFormData({ ...formData, accomplishment_type: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="certification">{t("profile.certification")}</option>
              <option value="award">{t("profile.award")}</option>
              <option value="publication">{t("profile.publication")}</option>
              <option value="patent">{t("profile.patent")}</option>
              <option value="other">{t("profile.other")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.title")}</label>
            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.issuingOrganization")}</label>
            <input type="text" value={formData.issuing_organization} onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.issueDate")}</label>
              <input type="date" value={formData.issue_date} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.expiryDate")}</label>
              <input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.credentialUrl")}</label>
            <input type="url" value={formData.credential_url} onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })} placeholder={t("profile.projectUrlPlaceholder")} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profile.description")}</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">{t("profile.cancel")}</button>
            <button type="submit" disabled={isSubmitting} className="cursor-pointer px-4 py-2 text-white bg-[#7f56d9] rounded-lg hover:bg-[#5b3ba5] transition disabled:opacity-50">{isSubmitting ? t("profile.saving") : t("profile.save")}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
