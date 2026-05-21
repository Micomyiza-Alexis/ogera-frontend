import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  PencilIcon,
  CheckCircleIcon,
  MapPinIcon,
  BriefcaseIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { setCredentials } from "../../features/auth/authSlice";
import { getUserProfile, type UserProfile } from "../../services/api/profileApi";
import { uploadProfileImage } from "../../services/api/profileImageApi";
import { useResendVerificationEmailMutation } from "../../services/api/authApi";
import type { FullProfile } from "../../services/api/extendedProfileApi";

interface ProfileHeaderCardProps {
  profileData: UserProfile | null;
  fullProfileData?: FullProfile | null;
  profileCompletion: number;
  wrapperClassName?: string;
  contentClassName?: string;
  onEditProfileClick?: () => void;
  onPhoneVerificationClick?: () => void;
  onAcademicVerificationClick?: () => void;
  onProfileDataRefresh?: () => void | Promise<void>;
}

const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  profileData,
  fullProfileData,
  profileCompletion,
  wrapperClassName = "",
  contentClassName = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6",
  onEditProfileClick,
  onPhoneVerificationClick,
  onAcademicVerificationClick,
  onProfileDataRefresh,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const accessToken = useSelector((state: any) => state.auth.accessToken);
  const role = useSelector((state: any) => state.auth.role);
  const [resendVerificationEmail] = useResendVerificationEmailMutation();
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImageVersion, setProfileImageVersion] = useState(0);

  const userData = profileData || user;
  const userRole = userData?.role?.roleName || role;
  const normalizedUserRole = (userRole || "").toString().toLowerCase();
  const shouldShowVerifyAccountButton =
    normalizedUserRole !== "admin" && normalizedUserRole !== "superadmin";

  const isEmailVerified = Boolean(profileData?.email_verified);
  const isPhoneVerified = Boolean(profileData?.phone_verified);

  const currentEmployment = fullProfileData?.employments?.find((emp) => emp.is_current) || fullProfileData?.employments?.[0];
  const extendedProfile = fullProfileData?.extendedProfile;

  const resolveImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    const baseUrl = (import.meta.env.VITE_API_URL || "https://api.ogera.sybellasystems.co.rw/api").replace("/api", "");
    return imageUrl.startsWith("/") ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
  };

  const refreshProfile = async () => {
    if (onProfileDataRefresh) {
      await onProfileDataRefresh();
      return;
    }

    try {
      const response = await getUserProfile();
      const updatedData = response.data;
      if (updatedData) {
        const resolvedImageUrl = resolveImageUrl(updatedData.profile_image_url);
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
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  };

  const updateAuthProfileImage = (newUrl: string) => {
    if (!user || !accessToken || !role) return;
    const resolvedUrl = resolveImageUrl(newUrl);
    const cacheBustedUrl = resolvedUrl
      ? `${resolvedUrl}${resolvedUrl.includes("?") ? "&" : "?"}t=${Date.now()}`
      : newUrl;
    dispatch(
      setCredentials({
        user: { ...user, profile_image_url: cacheBustedUrl },
        accessToken,
        role,
      })
    );
    setProfileImageVersion((v) => v + 1);
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, GIF, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      setIsUploadingImage(true);
      const result = await uploadProfileImage(file);
      const newUrl = result?.data?.profile_image_url;
      if (newUrl) {
        updateAuthProfileImage(newUrl);
      }
      toast.success("Profile picture updated!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      if (profileImageInputRef.current) {
        profileImageInputRef.current.value = "";
      }
    }

    try {
      await refreshProfile();
    } catch (error) {
      console.error("Failed to refresh profile after image upload:", error);
    }
  };

  const handleVerifyAccountClick = () => {
    navigate("/auth/verification");
  };

  const handleVerifyEmailClick = async () => {
    try {
      await resendVerificationEmail(userData?.email || "").unwrap();
      toast.success(t("profile.verificationEmailSent"));
    } catch (error: any) {
      toast.error(error?.data?.message || t("profile.verificationEmailFailed"));
    }
  };

  return (
    <div className={`bg-white shadow-sm border-b border-gray-200 mb-6 ${wrapperClassName}`.trim()}>
      <div className={contentClassName}>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="relative">
            <div className="relative w-32 h-32">
              <svg className="absolute inset-0 w-32 h-32 transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="#7f56d9"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - profileCompletion / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-[6px] rounded-full overflow-hidden cursor-pointer group shadow-lg" onClick={() => profileImageInputRef.current?.click()}>
                <div className="absolute inset-0 bg-[#7f56d9] flex items-center justify-center">
                  <span className="text-white text-3xl font-bold select-none">
                    {(userData?.full_name || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                {resolveImageUrl(user?.profile_image_url || profileData?.profile_image_url) && (
                  <img
                    key={profileImageVersion}
                    src={`${resolveImageUrl(user?.profile_image_url || profileData?.profile_image_url)}${resolveImageUrl(user?.profile_image_url || profileData?.profile_image_url)?.includes("?") ? "&" : "?"}v=${profileImageVersion}`}
                    alt={userData?.full_name || t("profile.user")}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-full z-10">
                  {isUploadingImage ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CameraIcon className="w-7 h-7 text-white" />
                      <span className="text-white text-[10px] font-medium mt-1">Change</span>
                    </>
                  )}
                </div>
              </div>
              <input type="file" ref={profileImageInputRef} onChange={handleProfileImageUpload} accept="image/*" className="hidden" />
              <div className="absolute bottom-0 right-0 bg-[#7f56d9] text-white text-[10px] font-bold rounded-full w-9 h-9 flex items-center justify-center border-2 border-white z-10">
                {profileCompletion}%
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {userData?.full_name || "User Name"}
              </h1>
              <button
                onClick={onEditProfileClick || (() => navigate("/dashboard/profile"))}
                className="cursor-pointer text-gray-400 hover:text-[#7f56d9] transition-colors"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <p className="text-lg text-gray-700">
                {currentEmployment
                  ? currentEmployment.job_title
                  : role === "student"
                    ? t("profile.softwareDeveloper")
                    : t("profile.professional")}
                {currentEmployment && (
                  <span className="text-gray-600">
                    {" "} {t("profile.at")} {currentEmployment.company_name}
                  </span>
                )}
              </p>

              {shouldShowVerifyAccountButton && (
                <button
                  type="button"
                  onClick={handleVerifyAccountClick}
                  disabled={!userData?.email}
                  className={`cursor-pointer text-xs text-[#7f56d9] hover:text-[#5b3ba5] font-medium underline transition-all ${
                    ""
                  }`}
                  title={isEmailVerified && isPhoneVerified ? "Account verified" : "Verify account"}
                >
                  Verify account
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <span>{userData?.preferred_location || t("profile.location")}</span>
              </div>
              <div className="flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                <span>
                  {extendedProfile?.total_experience_years || 0} {(extendedProfile?.total_experience_years || 0) !== 1 ? t("profile.years") : t("profile.year")} {" "}
                  {extendedProfile?.total_experience_months || 0} {(extendedProfile?.total_experience_months || 0) !== 1 ? t("profile.months") : t("profile.month")}
                </span>
              </div>
              {role === "student" && extendedProfile?.current_salary && (
                <div className="flex items-center gap-2">
                  <span>₹ {extendedProfile.current_salary.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{userData?.mobile_number || "N/A"}</span>
                {isPhoneVerified ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" title={t("profile.phoneVerified")} />
                ) : (
                  <button
                    onClick={onPhoneVerificationClick || (() => navigate("/dashboard/profile"))}
                    className="cursor-pointer text-xs text-[#7f56d9] hover:text-[#5b3ba5] font-medium underline"
                    title={t("profile.verifyPhone")}
                  >
                    {t("profile.verify")}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{userData?.email || "N/A"}</span>
                {isEmailVerified ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" title={t("profile.emailVerified")} />
                ) : (
                  <button
                    onClick={handleVerifyEmailClick}
                    className="cursor-pointer text-xs text-[#7f56d9] hover:text-[#5b3ba5] font-medium underline"
                    title={t("profile.verifyEmail")}
                  >
                    {t("profile.verify")}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{extendedProfile?.notice_period || t("profile.noticePeriodDefault")}</span>
              </div>
              {role === "student" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onAcademicVerificationClick || (() => navigate("/dashboard/academic/pending"))}
                    className="cursor-pointer text-xs text-[#7f56d9] hover:text-[#5b3ba5] font-medium underline"
                    title={t("profile.academicVerification")}
                  >
                    {t("profile.academicVerification")}
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              {t("profile.profileLastUpdated")} - {profileData?.updated_at
                ? new Date(profileData.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " - " + new Date(profileData.updated_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
                : t("profile.recently")}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProfileHeaderCard;
