import React, { useState, useRef, useEffect } from "react";
import { XMarkIcon, DocumentIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useApplyForJobMutation, type JobApplicationAnswer } from "../services/api/jobApplicationApi";
import { uploadResume } from "../services/api/resumeApi";
import { useGetUserProfileQuery } from "../services/api/authApi";
import toast from "react-hot-toast";
import type { Job } from "../services/api/jobsApi";
import { SUPPORTED_CURRENCIES } from "../constants/currencies";

const MIN_COVER_LETTER_LENGTH = 50;

interface ApplyJobModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [preferredPayoutCurrency, setPreferredPayoutCurrency] = useState("USD");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [applyForJob, { isLoading }] = useApplyForJobMutation();

  // Pull the student's existing profile so we can reuse any resume already on file.
  // This way a student who already uploaded a resume to their profile doesn't have
  // to re-upload for every job application.
  const { data: profileData } = useGetUserProfileQuery(undefined, { skip: !isOpen });
  const profileResumeUrl = (profileData as any)?.data?.resume_url || null;

  // If profile has a resume and the modal state doesn't have one yet, seed it.
  useEffect(() => {
    if (isOpen && profileResumeUrl && !resumeUrl && !resumeFile) {
      setResumeUrl(profileResumeUrl);
    }
  }, [isOpen, profileResumeUrl, resumeUrl, resumeFile]);

  // Initialize answers when job questions are loaded
  useEffect(() => {
    if (job.questions && job.questions.length > 0) {
      const initialAnswers: Record<string, string> = {};
      job.questions.forEach((q, index) => {
        // Use question_id if available, otherwise use index as fallback
        const key = q.question_id || `question_${index}`;
        initialAnswers[key] = "";
      });
      setAnswers(initialAnswers);
    }
  }, [job.questions]);

  useEffect(() => {
    setPreferredPayoutCurrency(job.currency || "USD");
  }, [job.currency, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file."
      );
      return;
    }

    if (file.size > maxSize) {
      toast.error("File size too large. Please upload a file smaller than 5MB.");
      return;
    }

    setResumeFile(file);

    // Upload resume immediately
    try {
      setIsUploadingResume(true);
      const response = await uploadResume(file);
      setResumeUrl(response.data.resume_url);
      toast.success("Resume uploaded successfully!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to upload resume"
      );
      setResumeFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (job.status === "Completed") {
      toast.error("This job is already completed and no longer accepts applications.");
      onClose();
      return;
    }

    // Resume is required: either just uploaded in this modal OR already on the profile.
    if (!resumeUrl) {
      toast.error("Please upload your resume (or add one to your profile first)");
      return;
    }

    // Cover letter is required and must be substantive.
    const trimmedCover = coverLetter.trim();
    if (!trimmedCover) {
      toast.error("Please write a cover letter");
      return;
    }
    if (trimmedCover.length < MIN_COVER_LETTER_LENGTH) {
      toast.error(
        `Cover letter is too short — please write at least ${MIN_COVER_LETTER_LENGTH} characters`
      );
      return;
    }

    // Validate required questions
    if (job.questions && job.questions.length > 0) {
      const requiredQuestions = job.questions.filter((q) => q.is_required);
      const missingAnswers = requiredQuestions.filter((q, index) => {
        const key = q.question_id || `question_${index}`;
        return !answers[key] || answers[key].trim() === "";
      });

      if (missingAnswers.length > 0) {
        toast.error("Please answer all required questions");
        return;
      }
    }

    const isUnfundedJob =
      job.funding_status !== "Funded" && job.funding_status !== "Paid";
    let unfundedWarningToastId: string | undefined;

    try {
      if (isUnfundedJob) {
        unfundedWarningToastId = toast("This job is not funded, kindly contact your employer before doing anything and agree on payment method.", {
          icon: "⚠️",
          style: {
            background: "#fffbeb",
            color: "#92400e",
            border: "1px solid #fde68a",
          },
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Prepare answers array - only include questions with question_id (from saved jobs)
      const answersArray: JobApplicationAnswer[] = [];
      if (job.questions && job.questions.length > 0) {
        job.questions.forEach((q) => {
          // Only submit answers for questions that have question_id (from database)
          if (q.question_id) {
            const key = q.question_id;
            if (answers[key] && answers[key].trim() !== "") {
              answersArray.push({
                question_id: q.question_id,
                answer_text: answers[key],
              });
            }
          }
        });
      }

      await applyForJob({
        job_id: job.job_id,
        data: {
          cover_letter: coverLetter.trim() || undefined,
          resume_url: resumeUrl || undefined,
          preferred_payout_currency: preferredPayoutCurrency,
          answers: answersArray.length > 0 ? answersArray : undefined,
        },
      }).unwrap();
      if (unfundedWarningToastId) {
        toast.dismiss(unfundedWarningToastId);
      }
      toast.success("Successfully applied on this job.", {
        duration: 4000,
        style: {
          background: "#ecfdf3",
          color: "#065f46",
          border: "1px solid #a7f3d0",
        },
      });
      setCoverLetter("");
      setResumeFile(null);
      setResumeUrl(null);
      setAnswers({});
      setPreferredPayoutCurrency(job.currency || "USD");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage =
        err?.data?.message || err?.data?.error || "Failed to apply for job";
      const isFundingInfo = String(errorMessage)
        .toLowerCase()
        .includes("not funded");

      if (isFundingInfo) {
        return;
      } else {
        toast.error(errorMessage);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm">
      <style>{`
        .apply-job-modal-scroll::-webkit-scrollbar { width: 6px; }
        .apply-job-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .apply-job-modal-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
        .apply-job-modal-scroll::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        .apply-job-modal-scroll { scrollbar-width: thin; scrollbar-color: #e5e7eb transparent; }
      `}</style>
      <div className="apply-job-modal-scroll bg-white rounded-none md:rounded-xl shadow-2xl max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Apply for Job</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1 truncate">{job.job_title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
          >
            <XMarkIcon className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Job Details */}
          <div className="bg-gray-50 rounded-lg p-3 md:p-4 space-y-2">
            <h3 className="text-sm md:text-base font-semibold text-gray-900">Job Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {job.location}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Budget:</span>
                <span className="ml-2 font-medium text-gray-900">
                  ${job.budget.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {job.duration}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {job.category}
                </span>
              </div>
            </div>
            {job.description && (
              <div className="mt-3">
                <span className="text-gray-600 text-sm">Description:</span>
                <p className="text-sm text-gray-700 mt-1">{job.description}</p>
              </div>
            )}
          </div>

          {/* Resume Upload */}
          <div>
            <label
              htmlFor="resume"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Resume <span className="text-red-500">*</span>
              {profileResumeUrl && !resumeFile && (
                <span className="ml-2 text-xs text-green-600 font-normal">
                  ✓ Using resume from your profile
                </span>
              )}
            </label>
            {!resumeFile ? (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-400 transition-colors">
                <div className="space-y-1 text-center">
                  <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="resume"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="resume"
                        name="resume"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt"
                        className="sr-only"
                        disabled={isUploadingResume}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, TXT up to 5MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="flex items-center gap-3">
                  <DocumentIcon className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {resumeFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(resumeFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  {isUploadingResume && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </div>
                  )}
                  {resumeUrl && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Uploaded
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRemoveResume}
                  className="text-red-600 hover:text-red-700 transition-colors"
                  disabled={isUploadingResume}
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Upload your resume to increase your chances of being selected
            </p>
          </div>

          {/* Questions */}
          {job.questions && job.questions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Application Questions
              </h3>
              {[...job.questions]
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((question, index) => {
                  const questionId = question.question_id || `question_${index}`;
                  return (
                    <div key={questionId} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {question.question_text}
                        {question.is_required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      
                      {question.question_type === "text" && (
                        <textarea
                          rows={3}
                          value={answers[questionId] || ""}
                          onChange={(e) =>
                            setAnswers({ ...answers, [questionId]: e.target.value })
                          }
                          placeholder="Your answer..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                          required={question.is_required}
                        />
                      )}
                      
                      {question.question_type === "number" && (
                        <input
                          type="number"
                          value={answers[questionId] || ""}
                          onChange={(e) =>
                            setAnswers({ ...answers, [questionId]: e.target.value })
                          }
                          placeholder="Enter a number"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          required={question.is_required}
                        />
                      )}
                      
                      {question.question_type === "yes_no" && (
                        <select
                          value={answers[questionId] || ""}
                          onChange={(e) =>
                            setAnswers({ ...answers, [questionId]: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          required={question.is_required}
                        >
                          <option value="">Select an option</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      )}
                      
                      {question.question_type === "multiple_choice" && (
                        <select
                          value={answers[questionId] || ""}
                          onChange={(e) =>
                            setAnswers({ ...answers, [questionId]: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          required={question.is_required}
                        >
                          <option value="">Select an option</option>
                          {(() => {
                            const options = Array.isArray(question.options)
                              ? question.options
                              : typeof question.options === "string"
                              ? question.options.split(",").map((o) => o.trim())
                              : [];
                            return options.map((option, idx) => (
                              <option key={idx} value={option}>
                                {option}
                              </option>
                            ));
                          })()}
                        </select>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Cover Letter */}
          <div>
            <label
              htmlFor="preferredPayoutCurrency"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Preferred payout currency
            </label>
            <select
              id="preferredPayoutCurrency"
              value={preferredPayoutCurrency}
              onChange={(e) => setPreferredPayoutCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cover Letter */}
          <div>
            <label
              htmlFor="coverLetter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Cover Letter <span className="text-red-500">*</span>
            </label>
            <textarea
              id="coverLetter"
              rows={6}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit for this position..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
            />
            <p className={`mt-2 text-sm ${
              coverLetter.trim().length > 0 && coverLetter.trim().length < MIN_COVER_LETTER_LENGTH
                ? "text-red-600"
                : "text-gray-500"
            }`}>
              {coverLetter.trim().length}/{MIN_COVER_LETTER_LENGTH} characters minimum —
              tell the employer why you're a great fit
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-4 md:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 md:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-sm md:text-base order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingResume}
              className="px-4 md:px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-semibold transition text-sm md:text-base order-1 sm:order-2"
            >
              {isLoading
                ? "Submitting..."
                : isUploadingResume
                ? "Uploading Resume..."
                : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyJobModal;

