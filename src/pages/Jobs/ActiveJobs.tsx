import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ClockIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { useGetAllJobsQuery } from "../../services/api/jobsApi";
import { useGetStudentApplicationsQuery } from "../../services/api/jobApplicationApi";
import ApplyJobModal from "../../components/ApplyJobModal";
import Loader from "../../components/Loader";
import { formatRelativeTime } from "../../utils/timeUtils";

const ActiveJobs: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const roleRaw = useSelector((state: any) => state.auth.role);
  const role = roleRaw ? String(roleRaw).toLowerCase().trim() : "";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const { data, isLoading, error } = useGetAllJobsQuery(
    {
      status: "Active",
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(selectedLocation ? { location: selectedLocation } : {}),
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );
  const { data: studentApplications, refetch: refetchApplications } = useGetStudentApplicationsQuery(undefined, {
    skip: role !== "student",
  });
  // Create a Set of job IDs the student has applied to
  const appliedJobIds = new Set(
    (studentApplications?.data || []).map((app: any) => app.job_id)
  );

  const activeJobs = data?.data || [];
  const isFundedJob = (fundingStatus?: string | null) =>
    fundingStatus === "Funded" || fundingStatus === "Paid";

  const filteredJobs = activeJobs.filter((job: any) => {
    if (role === "student" && !isFundedJob(job.funding_status)) {
      return false;
    }
    return true;
  });

  // Get unique locations for filter
  const locations = Array.from(
    new Set(activeJobs.map((job: any) => job.location).filter(Boolean))
  );

  const handleApply = (job: any) => {
    if (job.status === "Completed") return;
    if (role === "student") {
      setSelectedJob(job);
      setIsModalOpen(true);
    } else {
      navigate(`/dashboard/jobs/${job.job_id}`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
    // Refetch student applications to update applied status
    if (role === "student") {
      refetchApplications();
    }
  };

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800 font-medium">
            {t("pages.jobs.failedToLoadActive")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckBadgeIcon className="h-8 w-8 text-green-600" />
            {t("pages.jobs.activeJobsTitle")}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("pages.jobs.jobsFound", { count: filteredJobs.length })}
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("pages.jobs.searchPlaceholderActive")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Location Filter */}
          <div className="relative md:w-64">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">{t("pages.jobs.allLocations")}</option>
              {locations.map((location: string) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-md border border-gray-100 text-center">
          <CheckBadgeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery || selectedLocation
              ? t("pages.jobs.noJobsMatching")
              : t("pages.jobs.noActiveJobsAvailable")}
          </h3>
          <p className="text-gray-600">
            {searchQuery || selectedLocation
              ? t("pages.jobs.tryAdjusting")
              : t("pages.jobs.noActiveCheckBack")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job: any) => {
            const employerName = job.employer?.full_name || t("pages.jobs.unknownEmployer");
            const companyInitial = employerName.charAt(0).toUpperCase();
            const isSaved = savedJobs.has(job.job_id);
            const isCompletedJob = job.status === "Completed";
            const hasAlreadyApplied = appliedJobIds.has(job.job_id);
            const isApplyDisabled = hasAlreadyApplied || isCompletedJob;

            return (
              <div
                key={job.job_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-5"
              >
                <div className="flex gap-2">
                  {/* Company Logo */}
                  <div className="flex-shrink-0">
                    <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {companyInitial}
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3
                          onClick={() => navigate(`/dashboard/jobs/${job.job_id}`)}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer mb-1"
                        >
                          {job.job_title}
                        </h3>
                        <p className="text-gray-700 font-medium mb-2">
                          {employerName}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleSaveJob(job.job_id)}
                        className="flex-shrink-0 ml-4 p-2 hover:bg-gray-100 rounded-full transition"
                        title={isSaved ? t("pages.jobs.removeFromSaved") : t("pages.jobs.saveJob")}
                      >
                        {isSaved ? (
                          <BookmarkSolidIcon className="h-5 w-5 text-blue-600" />
                        ) : (
                          <BookmarkIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Job Info Row */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        ${job.budget?.toLocaleString() || t("pages.jobs.notSpecified")}
                      </span>
                      {job.duration && (
                        <span className="flex items-center gap-1">
                          <BriefcaseIcon className="h-4 w-4" />
                          {job.duration}
                        </span>
                      )}
                      {job.created_at && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {t("pages.jobs.posted")} {formatRelativeTime(job.created_at)}
                        </span>
                      )}
                    </div>

                    {/* Job Description Preview */}
                    {job.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {job.description}
                      </p>
                    )}

                    {/* Skills/Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.category && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {job.category}
                        </span>
                      )}
                      {job.employment_type && (
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          {job.employment_type}
                        </span>
                      )}
                      {job.experience_level && (
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          {job.experience_level}
                        </span>
                      )}
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {job.applications || 0} {t("pages.jobs.applicants")}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
<div className="flex flex-col sm:flex-row md:flex-col gap-2 mt-4 md:mt-0 md:ml-4 md:flex-shrink-0 md:w-44">                      {role === "student" ? (
                      <div className="relative group flex-1 sm:flex-none">
                        <button
                          onClick={() => !isApplyDisabled && handleApply(job)}
                          disabled={isApplyDisabled}
className={`w-full px-3 md:px-4 py-1.5 md:py-2 rounded-md font-medium transition shadow-sm whitespace-nowrap text-xs md:text-sm cursor-pointer ${                          isApplyDisabled
                              ? "bg-gray-400 text-white cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {hasAlreadyApplied
                            ? t("pages.jobs.applied")
                            : isCompletedJob
                            ? t("pages.jobs.completed", { defaultValue: "Completed" })
                            : t("pages.jobs.applyNow")}
                        </button>
                        {isCompletedJob && (
                          <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-center text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                            {t("pages.jobs.completedNoApplyMessage", {
                              defaultValue: "This job is already completed, so applications are closed.",
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/dashboard/jobs/${job.job_id}`)}
className="px-3 md:px-4 py-1.5 md:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition shadow-sm whitespace-nowrap text-xs md:text-sm flex-1 sm:flex-none cursor-pointer">                        
                          {t("pages.jobs.viewDetails")}
                        </button>
                        {(role === "employer" || role === "superadmin") && (
                          <button
                            onClick={() =>
                              navigate(`/dashboard/jobs/${job.job_id}/applications`)
                            }
className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition shadow-sm whitespace-nowrap text-xs md:text-sm flex-1 sm:flex-none cursor-pointer">                          
                            Manage Applications ({job.applications || 0})
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Job Modal */}
      {selectedJob && (
        <ApplyJobModal
          job={selectedJob}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}
    </div>
  );
};

export default ActiveJobs;
