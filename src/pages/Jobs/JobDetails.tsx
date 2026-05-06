import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { useGetJobByIdQuery, useReviewJobMutation } from "../../services/api/jobsApi";
import { useGetUserProfileQuery } from "../../services/api/authApi";
import { useCheckStudentApplicationQuery } from "../../services/api/jobApplicationApi";
import { useFundJobMutation, useLazyGetMoMoStatusQuery, useApproveWorkAndPayMutation } from "../../services/api/momoApi";
import { useGetJobPaymentDetailQuery } from "../../services/api/momoApi";
import { apiSlice } from "../../services/api/apiSlice";
import ApplyJobModal from "../../components/ApplyJobModal";
import Loader from "../../components/Loader";
import { formatRelativeTime } from "../../utils/timeUtils";
import Button from "../../components/button";
import { formatBudgetWithCurrency } from "../../constants/currencies";
import toast from "react-hot-toast";

const JobDetails: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const role = useSelector((state: any) => state.auth.role);
  const normalizedRole = role ? String(role).toLowerCase().trim() : "";
  const { data, isLoading, error, refetch } = useGetJobByIdQuery(id || "");
  const { data: profileData } = useGetUserProfileQuery(undefined);
  const { data: applicationCheck, refetch: refetchApplicationCheck } = useCheckStudentApplicationQuery(id || "", {
    skip: !id || role !== "student",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [momoError, setMomoError] = useState("");
  const [payError, setPayError] = useState("");
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [fundJob, { isLoading: isFunding }] = useFundJobMutation();
  const [getMoMoStatus] = useLazyGetMoMoStatusQuery();
  const [approveWorkAndPay, { isLoading: isPaying }] = useApproveWorkAndPayMutation();
  const { data: paymentDetailData } = useGetJobPaymentDetailQuery(id || "", {
    skip: !id || (normalizedRole !== "employer" && normalizedRole !== "superadmin" && normalizedRole !== "admin"),
  });
  const [reviewJob, { isLoading: isUpdatingJob }] = useReviewJobMutation();

   const job = data?.data;
  const currentUserId = profileData?.data?.user_id;
    const isSaved = id ? savedJobs.has(id) : false;

  const hasApplied = applicationCheck?.data?.hasApplied || false;
  const isCompletedJob = job?.status === "Completed";
  const isApplyDisabled = hasApplied || isCompletedJob;

  // Auto-open apply modal when arriving from landing page with ?apply=1
  useEffect(() => {
    if (
      searchParams.get("apply") === "1" &&
      role === "student" &&
      job &&
      !hasApplied &&
      !isCompletedJob
    ) {
      setIsModalOpen(true);
    }
  }, [searchParams, role, job, hasApplied, isCompletedJob]);
  const fundingStatus = job?.funding_status || "Unfunded";
  const isEmployerView = (role === "employer" || role === "superadmin") && currentUserId && job?.employer_id === currentUserId;
  const isAlreadyApproved = job?.status === "Active";
  const isAlreadyDisapproved = job?.status === "Inactive";
  const isReviewLocked = isAlreadyApproved || isAlreadyDisapproved;

  const feeInfo = useMemo(() => {
    const budget = Number(job?.budget ?? 0) || 0;
    return { budget };
  }, [job?.budget]);
  const jobPayment = paymentDetailData?.data;

  

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Inactive":
        return "bg-red-100 text-red-700";
      case "Pending":
        return "bg-orange-100 text-orange-700";
      case "Completed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error || !job) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800 font-medium">
            {t("pages.jobs.jobNotFound")}
          </p>
          <button
            onClick={() => navigate("/dashboard/jobs/all")}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            {t("pages.jobs.backToAllJobs")}
          </button>
        </div>
      </div>
    );
  }

  // Check if employer can view this job (only their own jobs)
  if (role === "employer" && currentUserId && job.employer_id !== currentUserId) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800 font-medium">
            {t("pages.jobs.noPermissionViewJob")}
          </p>
          <button
            onClick={() => navigate("/dashboard/jobs/all")}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            {t("pages.jobs.backToAllJobs")}
          </button>
        </div>
      </div>
    );
  }

  const employerName = job.employer?.full_name || t("pages.jobs.unknownEmployer");
  const companyInitial = employerName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate("/dashboard/jobs/all")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← {t("pages.jobs.back")}
            </button>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 flex items-center gap-3">
            <BriefcaseIcon className="h-6 w-6 md:h-10 md:w-10 text-purple-600" />
            {job.job_title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                job.status
              )}`}
            >
              {job.status}
            </span>
            {(job.funding_status === "Funded" ||
              job.funding_status === "Pending" ||
              job.funding_status === "Paid") && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  job.funding_status === "Paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : job.funding_status === "Funded"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {job.funding_status === "Paid"
                  ? "Paid"
                  : job.funding_status === "Funded"
                  ? "Funded"
                  : "Payment pending"}
              </span>
            )}
            {role === "student" && job.funding_status === "Paid" && job.amount_received_by_you != null && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">
                You received {(job.amount_received_by_you as number).toLocaleString()} for this job
              </span>
            )}
            {role === "student" && (
              <button
                onClick={() => id && toggleSaveJob(id)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                title={isSaved ? t("pages.jobs.removeFromSaved") : t("pages.jobs.saveJob")}
              >
                {isSaved ? (
                  <BookmarkSolidIcon className="h-5 w-5 text-blue-600" />
                ) : (
                  <BookmarkIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            )}
          </div>
        </div>
        {role === "student" && (
          <div className="relative group">
            <Button
              backgroundcolor={isApplyDisabled ? "#6b7280" : "#7f56d9"}
              text={
                hasApplied
                  ? t("pages.jobs.applied")
                  : isCompletedJob
                  ? t("pages.jobs.completed", { defaultValue: "Completed" })
                  : t("pages.jobs.applyNow")
              }
              onClick={() => !isApplyDisabled && setIsModalOpen(true)}
              disabled={isApplyDisabled}
            />
            {isCompletedJob && (
              <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-center text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                {t("pages.jobs.completedNoApplyMessage", {
                  defaultValue: "This job is already completed, so applications are closed.",
                })}
              </div>
            )}
          </div>
        )}
        {(normalizedRole === "employer" || normalizedRole === "superadmin") && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              backgroundcolor="#7f56d9"
              text={`Manage Applications (${job.applications || 0})`}
              onClick={() => navigate(`/dashboard/jobs/${id}/applications`)}
            />
            <Button
              backgroundcolor="#6b7280"
              text={t("pages.jobs.editJob")}
              onClick={() => navigate(`/dashboard/jobs/${id}/edit`)}
            />
          </div>
        )}
        {(normalizedRole === "admin" || normalizedRole === "superadmin") && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              backgroundcolor="#059669"
              text={isAlreadyApproved ? "Approved" : isUpdatingJob ? "Approving..." : "Approve"}
              onClick={async () => {
                if (!id) return;
                if (isReviewLocked) return;
                try {
                  await reviewJob({ id, status: "Active" }).unwrap();
                  toast.success("Job approved successfully.");
                  refetch();
                } catch (error) {
                  console.error("Failed to approve job:", error);
                  const err = error as { data?: { message?: string }; message?: string };
                  toast.error(err?.data?.message || err?.message || "Failed to approve job. Please try again.");
                }
              }}
              disabled={isUpdatingJob || isReviewLocked}
            />
            <Button
              backgroundcolor="#dc2626"
              text={isAlreadyDisapproved ? "Disapproved" : isUpdatingJob ? "Updating..." : "Disapprove"}
              onClick={async () => {
                if (!id) return;
                if (isReviewLocked) return;
                try {
                  await reviewJob({ id, status: "Inactive" }).unwrap();
                  toast.success("Job disapproved successfully.");
                  refetch();
                } catch (error) {
                  console.error("Failed to disapprove job:", error);
                  const err = error as { data?: { message?: string }; message?: string };
                  toast.error(err?.data?.message || err?.message || "Failed to disapprove job. Please try again.");
                }
              }}
              disabled={isUpdatingJob || isReviewLocked}
            />
          </div>
        )}
      </div>

      {/* Job Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Company Info */}
          <div className="flex-shrink-0">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl md:text-3xl shadow-md">
              {companyInitial}
            </div>
          </div>

          {/* Job Details */}
          <div className="flex-1 space-y-4">
            {/* Employer Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                  {employerName}
                </h2>
              </div>
            </div>

            {/* Key Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPinIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm md:text-base">
                  <strong>{t("pages.jobs.location")}:</strong> {job.location}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm md:text-base">
                  <strong>{t("pages.jobs.budget")}:</strong> {formatBudgetWithCurrency(job.budget, job.currency || "USD")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <BriefcaseIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm md:text-base">
                  <strong>Duration:</strong> {job.duration || "Not specified"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm md:text-base">
                  <strong>Posted:</strong>{" "}
                  {job.created_at ? formatRelativeTime(job.created_at) : "Unknown"}
                </span>
              </div>
            </div>

            {/* Student: amount received for this job (when Paid) */}
            {role === "student" && job.funding_status === "Paid" && job.amount_received_by_you != null && (
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800">Amount you received from Ogera</p>
                <p className="text-xl font-bold text-emerald-900 mt-1">
                  {(job.amount_received_by_you as number).toLocaleString()} (paid to your MoMo)
                </p>
              </div>
            )}

            {/* Fund with MoMo (employer only) */}
            {/* Approve work & pay student (employer, job Funded, not yet Paid) */}
            {isEmployerView && fundingStatus === "Funded" && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h3 className="text-lg font-semibold text-emerald-900 mb-2">Approve work & pay student</h3>
                <p className="text-sm text-emerald-700 mb-3">
                  When the student has completed the work, click below to pay them the job budget via MoMo. The student must have a mobile number in their profile.
                </p>
                {payError && (
                  <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{payError}</div>
                )}
                <Button
                  backgroundcolor="#059669"
                  text={isPaying ? "Paying…" : "Approve work & pay student"}
                  onClick={async () => {
                    setPayError("");
                    try {
                      await approveWorkAndPay({ jobId: id! }).unwrap();
                      refetch();
                    } catch (e: unknown) {
                      const err = e as { data?: { message?: string }; message?: string };
                      setPayError(err?.data?.message || err?.message || "Failed to pay student.");
                    }
                  }}
                  disabled={isPaying}
                />
              </div>
            )}

            {isEmployerView && fundingStatus !== "Funded" && fundingStatus !== "Paid" && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Fund job with MoMo</h3>
                <p className="text-sm text-purple-700 mb-3">
                  Pay the job budget via MTN Mobile Money. A payment request will be sent to your MoMo number (from your profile). Approve on your phone to fund this job.
                </p>
                {momoError && (
                  <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{momoError}</div>
                )}
                {fundingStatus === "Pending" ? (
                  <p className="text-amber-700 font-medium">
                    Payment request sent. Approve on your MoMo app. This page will update when payment is confirmed (wait up to 2 minutes).
                  </p>
                ) : (
                  <Button
                    backgroundcolor="#7c3aed"
                    text={isFunding ? "Sending request…" : "Fund with MoMo"}
                    onClick={() => {
                      setMomoError("");
                      setIsFundModalOpen(true);
                    }}
                    disabled={isFunding}
                  />
                )}
              </div>
            )}

            {/* Fund confirmation modal */}
            {isFundModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                onClick={() => !isFunding && setIsFundModalOpen(false)}
              >
                <div
                  className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Confirm job funding</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        This payment will be sent to the <strong>Ogera wallet</strong> for this job.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                      onClick={() => !isFunding && setIsFundModalOpen(false)}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center justify-between text-sm text-gray-700">
                      <span>Job amount</span>
                      <span className="font-semibold">{feeInfo.budget.toLocaleString()} {job.currency || "USD"}</span>
                    </div>
                    <div className="h-px bg-gray-200 my-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 font-semibold">Total to pay</span>
                      <span className="text-xl font-extrabold text-purple-700">{feeInfo.budget.toLocaleString()} {job.currency || "USD"}</span>
                    </div>
                    {jobPayment?.transaction_details?.funding && (
                      <div className="mt-3 text-xs text-gray-600">
                        Wallet credit preview: {jobPayment.transaction_details.funding.original_amount.toLocaleString()} {jobPayment.transaction_details.funding.original_currency} to {jobPayment.transaction_details.funding.converted_amount.toLocaleString()} {jobPayment.transaction_details.funding.converted_currency} @ {jobPayment.transaction_details.funding.exchange_rate}
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-4">
                    After you submit, you’ll receive an MTN MoMo prompt on your phone. Approve it to mark this job as <strong>Funded</strong>.
                  </p>

                  {momoError && (
                    <div className="mt-3 p-2 bg-red-100 text-red-700 rounded text-sm">{momoError}</div>
                  )}

                  <div className="mt-5 flex gap-2 justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => !isFunding && setIsFundModalOpen(false)}
                      disabled={isFunding}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                      disabled={isFunding}
                      onClick={async () => {
                        setMomoError("");
                        try {
                          const res = await fundJob({ jobId: id! }).unwrap();
                          if (res.success && res.data?.referenceId) {
                            setIsFundModalOpen(false);
                            const refId = res.data.referenceId;
                            const interval = setInterval(async () => {
                              try {
                                const statusRes = await getMoMoStatus(refId).unwrap();
                                const status = statusRes.data?.status;
                                if (status === "SUCCESSFUL") {
                                  clearInterval(interval);
                                  dispatch(apiSlice.util.invalidateTags(["MoMoPayments"]));
                                  refetch();
                                }
                              } catch {
                                // ignore poll errors
                              }
                            }, 8000);
                            setTimeout(() => clearInterval(interval), 120000);
                            refetch();
                          }
                        } catch (e: unknown) {
                          const err = e as { data?: { message?: string }; message?: string };
                          setMomoError(err?.data?.message || err?.message || "Failed to send payment request.");
                        }
                      }}
                    >
                      {isFunding ? "Sending…" : `Pay ${feeInfo.budget.toLocaleString()} ${job.currency || "USD"}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Employer transaction details with FX breakdown */}
            {isEmployerView && jobPayment && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Transaction conversion details</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <div>
                    Job currency: <strong>{jobPayment.currency || job.currency || "USD"}</strong> | Wallet currency: <strong>{jobPayment.wallet_currency || "USD"}</strong>
                  </div>
                  {jobPayment.transaction_details?.funding && (
                    <div>
                      Funding: {jobPayment.transaction_details.funding.original_amount.toLocaleString()} {jobPayment.transaction_details.funding.original_currency} to {jobPayment.transaction_details.funding.converted_amount.toLocaleString()} {jobPayment.transaction_details.funding.converted_currency} @ {jobPayment.transaction_details.funding.exchange_rate}
                    </div>
                  )}
                  {jobPayment.transaction_details?.wallet_deduction && (
                    <div>
                      Wallet deduction: {jobPayment.transaction_details.wallet_deduction.original_amount.toLocaleString()} {jobPayment.transaction_details.wallet_deduction.original_currency} to {jobPayment.transaction_details.wallet_deduction.converted_amount.toLocaleString()} {jobPayment.transaction_details.wallet_deduction.converted_currency} @ {jobPayment.transaction_details.wallet_deduction.exchange_rate}
                    </div>
                  )}
                  {jobPayment.transaction_details?.student_payout && (
                    <div>
                      Student payout: {jobPayment.transaction_details.student_payout.original_amount.toLocaleString()} {jobPayment.transaction_details.student_payout.original_currency} to {jobPayment.transaction_details.student_payout.converted_amount.toLocaleString()} {jobPayment.transaction_details.student_payout.converted_currency} @ {jobPayment.transaction_details.student_payout.exchange_rate}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Category and Tags */}
            <div className="flex flex-wrap gap-2">
              {job.category && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {job.category}
                </span>
              )}
              {job.employment_type && (
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  {job.employment_type}
                </span>
              )}
              {job.experience_level && (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                  {job.experience_level}
                </span>
              )}
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {job.applications || 0} applicants
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
            {t("pages.jobs.jobDescription")}
          </h3>
          <p className="text-gray-700 text-sm md:text-base whitespace-pre-wrap">
            {job.description}
          </p>
        </div>
      )}

      {/* Requirements */}
      {job.requirements && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
            {t("pages.jobs.requirements")}
          </h3>
          <p className="text-gray-700 text-sm md:text-base whitespace-pre-wrap">
            {job.requirements}
          </p>
        </div>
      )}

      {/* Skills */}
      {job.skills && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
            Skills Required
          </h3>
          <p className="text-gray-700 text-sm md:text-base">{job.skills}</p>
        </div>
      )}

      {/* Questions Preview (for students) */}
      {role === "student" && job.questions && job.questions.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-blue-900 mb-2">
            Application Questions
          </h3>
          <p className="text-sm md:text-base text-blue-700 mb-3">
            You will be asked to answer {job.questions.length} question
            {job.questions.length > 1 ? "s" : ""} when applying for this job.
          </p>
          <ul className="space-y-2">
            {job.questions
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map((question, index) => (
                <li key={question.question_id || index} className="text-sm md:text-base text-blue-800">
                  <span className="font-medium">{index + 1}.</span> {question.question_text}
                  {question.is_required && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Apply Job Modal */}
      {isModalOpen && job && (
        <ApplyJobModal
          job={job}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            // Refetch application status
            refetchApplicationCheck();
          }}
        />
      )}
    </div>
  );
};

export default JobDetails;



