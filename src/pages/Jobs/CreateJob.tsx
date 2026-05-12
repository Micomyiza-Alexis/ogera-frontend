import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import {
  useCreateJobMutation,
  useUpdateJobMutation,
  useGetJobByIdQuery,
  type JobQuestion,
} from "../../services/api/jobsApi";
import { useGetUserProfileQuery } from "../../services/api/authApi";
import { useGetAllCategoriesQuery } from "../../services/api/jobCategoriesApi";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BriefcaseIcon,
  PlusIcon,
  TrashIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  ClockIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { SUPPORTED_CURRENCIES } from "../../constants/currencies";

interface CreateJobFormValues {
  job_title: string;
  category: string;
  budget: string;
  currency: string;
  duration: string;
  duration_start: string;
  duration_end: string;
  location: string;
  description?: string;
  requirements?: string;
  skills?: string;
  employment_type?: string;
  experience_level?: string;
  status?: "Pending" | "Active" | "Inactive" | "Completed";
  employer_id?: string;
}

// ─── Section Config ────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 0, label: "Basics", icon: BriefcaseIcon },
  { id: 1, label: "Details", icon: DocumentTextIcon },
  { id: 2, label: "Compensation", icon: CurrencyDollarIcon },
  { id: 3, label: "Preferences", icon: AcademicCapIcon },
  { id: 4, label: "Questions", icon: QuestionMarkCircleIcon },
  { id: 5, label: "Review", icon: SparklesIcon },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const renderLabel = (text: string, required = false) => (
  <span>
    {text.replaceAll("*", "").trim()}
    {required && <span className="ml-1 text-red-500 font-bold">*</span>}
  </span>
);

const FieldLabel: React.FC<{ htmlFor?: string; children: React.ReactNode; required?: boolean }> = ({
  htmlFor,
  children,
  required,
}) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-semibold text-slate-700 mb-1.5"
  >
    {children}
    {required && <span className="ml-1 text-red-500">*</span>}
  </label>
);

const HelperText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{children}</p>
);

const ErrorMsg: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
      <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
      {msg}
    </p>
  ) : null;

const inputCls =
  "w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all duration-150 shadow-sm hover:border-slate-300";

const selectCls =
  "w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all duration-150 shadow-sm hover:border-slate-300 cursor-pointer";

const textareaCls =
  "w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all duration-150 shadow-sm hover:border-slate-300 resize-none font-inherit";

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ title, subtitle, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
    <div className="flex items-start gap-3 px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-violet-600" />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="px-6 py-6 space-y-5">{children}</div>
  </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ activeSection: number; total: number }> = ({
  activeSection,
  total,
}) => {
  const pct = Math.round(((activeSection + 1) / total) * 100);
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-400 w-10 text-right">{pct}%</span>
    </div>
  );
};

// ─── Step Nav ─────────────────────────────────────────────────────────────────
const StepNav: React.FC<{
  sections: typeof SECTIONS;
  activeSection: number;
  completedSections: Set<number>;
  onJump: (i: number) => void;
}> = ({ sections, activeSection, completedSections, onJump }) => (
  <nav className="flex gap-1.5 flex-wrap">
    {sections.map((s) => {
      const done = completedSections.has(s.id);
      const active = s.id === activeSection;
      return (
        <button
          key={s.id}
          type="button"
          onClick={() => onJump(s.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            active
              ? "bg-violet-600 text-white shadow-md shadow-violet-200"
              : done
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {done && !active ? (
            <CheckCircleSolid className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <s.icon className="w-3.5 h-3.5" />
          )}
          {s.label}
        </button>
      );
    })}
  </nav>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const CreateJob: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const role = useSelector((state: any) => state.auth.role);

  const [durationStart, setDurationStart] = useState("");
  const [durationEnd, setDurationEnd] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());

  // ── Validation ──────────────────────────────────────────────────────────────
  const validationSchema = Yup.object({
    job_title: Yup.string()
      .min(3, t("pages.jobs.validationJobTitleMin"))
      .max(255, t("pages.jobs.validationJobTitleMax"))
      .required(t("pages.jobs.validationJobTitleRequired")),
    category: Yup.string()
      .required(t("pages.jobs.validationCategoryRequired"))
      .test("not-empty", t("pages.jobs.pleaseSelectCategory"), (v) => !!v && v !== ""),
    budget: Yup.string()
      .required(t("pages.jobs.validationBudgetRequired"))
      .matches(/^\d{1,10}$/, t("pages.jobs.validationBudgetNumbersOnlyMax10"))
      .test("positive", t("pages.jobs.validationBudgetPositive"), (v) => {
        if (!v) return false;
        const n = Number(v);
        return Number.isFinite(n) && n > 0;
      }),
    currency: Yup.string().required(t("pages.jobs.validationCurrencyRequired")),
    duration_start: Yup.string().required(t("pages.jobs.validationDurationStartRequired")),
    duration_end: Yup.string()
      .required(t("pages.jobs.validationDurationEndRequired"))
      .test("end-after-start", t("pages.jobs.validationDurationEndAfterStart"), function (v) {
        const start = this.parent.duration_start as string | undefined;
        if (!start || !v) return true;
        return v >= start;
      }),
    duration: Yup.string()
      .min(2, t("pages.jobs.validationDurationMin"))
      .max(100, t("pages.jobs.validationDurationMax"))
      .required(t("pages.jobs.validationDurationRequired")),
    location: Yup.string()
      .min(2, t("pages.jobs.validationLocationMin"))
      .max(15, t("pages.jobs.validationLocationMax15"))
      .matches(/^[A-Za-z\s]+$/, t("pages.jobs.validationLocationLettersOnly"))
      .required(t("pages.jobs.validationLocationRequired")),
    description: Yup.string().optional(),
    requirements: Yup.string().optional(),
    skills: Yup.string().optional(),
    employment_type: Yup.string().optional(),
    experience_level: Yup.string().optional(),
    status: Yup.string()
      .oneOf(["Pending", "Active", "Inactive", "Completed"], t("pages.jobs.validationInvalidStatus"))
      .optional(),
  });

  useGetUserProfileQuery(undefined);
  const {
    data: categoriesResponse,
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
  } = useGetAllCategoriesQuery();
  const isEditMode = !!id;
  const { data: jobData, isLoading: isLoadingJob } = useGetJobByIdQuery(id || "", {
    skip: !isEditMode,
  });

  const categories = categoriesResponse?.data || [];

  const [createJob, { isLoading: isCreating, isError: isCreateError, error: createError, isSuccess: isCreateSuccess, data: createData }] =
    useCreateJobMutation();

  const [updateJob, { isLoading: isUpdating, isError: isUpdateError, error: updateError, isSuccess: isUpdateSuccess, data: updateData }] =
    useUpdateJobMutation();

  const job = jobData?.data;
  const [questions, setQuestions] = useState<JobQuestion[]>([]);

  const initialValues: CreateJobFormValues = {
    job_title: job?.job_title || "",
    category: job?.category || "",
    budget: job?.budget != null ? String(job.budget) : "",
    currency: job?.currency || "USD",
    duration: job?.duration || "",
    duration_start: "",
    duration_end: "",
    location: job?.location || "",
    description: job?.description || "",
    requirements: job?.requirements || "",
    skills: job?.skills || "",
    employment_type: job?.employment_type || "",
    experience_level: job?.experience_level || "",
    status: job?.status || "Active",
    employer_id: "",
  };

  const formik = useFormik<CreateJobFormValues>({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (!values.category || values.category.trim() === "") {
          formik.setFieldError("category", t("pages.jobs.pleaseSelectCategory"));
          formik.setFieldTouched("category", true);
          toast.error(t("pages.jobs.categoryRequiredToast"));
          return;
        }
        if (categories.length === 0) {
          toast.error(t("pages.jobs.noCategoriesCreateFirst"));
          return;
        }
        const categoryExists = categories.some((c: any) => c.name === values.category.trim());
        if (!categoryExists) {
          formik.setFieldError("category", t("pages.jobs.selectedCategoryUnavailable"));
          toast.error(t("pages.jobs.selectAnotherCategory"));
          return;
        }

        const payload: any = {
          job_title: values.job_title.trim(),
          category: values.category.trim(),
          budget: Number(values.budget),
          currency: values.currency,
          duration: values.duration.trim(),
          location: values.location.trim(),
          status: values.status || "Pending",
        };

        if (values.description?.trim()) payload.description = values.description.trim();
        if (values.requirements?.trim()) payload.requirements = values.requirements.trim();
        if (values.skills?.trim()) payload.skills = values.skills.trim();
        if (values.employment_type?.trim()) payload.employment_type = values.employment_type.trim();
        if (values.experience_level?.trim()) payload.experience_level = values.experience_level.trim();
        if (role === "superadmin" && values.employer_id?.trim()) payload.employer_id = values.employer_id.trim();
        if (questions.length > 0) {
          payload.questions = questions.map((q, i) => ({
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: q.is_required,
            options: q.options,
            display_order: q.display_order !== undefined ? q.display_order : i,
          }));
        }

        if (isEditMode && id) {
          await updateJob({ id, data: payload }).unwrap();
        } else {
          await createJob(payload).unwrap();
        }
      } catch (err) {
        console.error("Create job error:", err);
      }
    },
  });

  const { resetForm } = formik;

  // ── Edit mode: populate form ─────────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode && job && formik.values.job_title === "") {
      formik.setValues({
        job_title: job.job_title || "",
        category: job.category || "",
        budget: job.budget != null ? String(job.budget) : "",
        currency: job.currency || "USD",
        duration: job.duration || "",
        duration_start: "",
        duration_end: "",
        location: job.location || "",
        description: job.description || "",
        requirements: job.requirements || "",
        skills: job.skills || "",
        employment_type: job.employment_type || "",
        experience_level: job.experience_level || "",
        status: job.status || "Active",
        employer_id: "",
      });
      const rawDuration = (job.duration || "").trim();
      const parts = rawDuration.includes(" - ")
        ? rawDuration.split(" - ")
        : rawDuration.toLowerCase().includes(" to ")
        ? rawDuration.split(/ to /i)
        : [];
      if (parts.length === 2) {
        setDurationStart(parts[0].trim());
        setDurationEnd(parts[1].trim());
        formik.setFieldValue("duration_start", parts[0].trim());
        formik.setFieldValue("duration_end", parts[1].trim());
      }
      const rawSkills = (job.skills || "").trim();
      if (rawSkills) {
        setSkillsList(Array.from(new Set(rawSkills.split(",").map((s) => s.trim()).filter(Boolean))));
      }
      if (job.questions?.length) {
        setQuestions(
          job.questions.map((q) => ({
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: q.is_required,
            options: q.options,
            display_order: q.display_order || 0,
          }))
        );
      }
    }
  }, [job, isEditMode]);

  // ── Error handling ───────────────────────────────────────────────────────────
  useEffect(() => {
    const error = isCreateError ? createError : updateError;
    if (error) {
      const err = error as FetchBaseQueryError & { data?: { error?: string; message?: string } };
      toast.error(
        err?.data?.error || err?.data?.message || (isEditMode ? t("pages.jobs.failedToUpdateJob") : t("pages.jobs.failedToCreateJob"))
      );
    }
  }, [isCreateError, createError, isUpdateError, updateError, isEditMode, t]);

  useEffect(() => {
    const data = isCreateSuccess ? createData : updateData;
    const isSuccess = isCreateSuccess || isUpdateSuccess;
    if (data && isSuccess) {
      toast.success(data?.message || (isEditMode ? t("pages.jobs.jobUpdatedSuccess") : t("pages.jobs.jobCreatedSuccess")));
      if (!isEditMode) resetForm();
      navigate("/dashboard/jobs/unfunded");
    }
  }, [isCreateSuccess, createData, isUpdateSuccess, updateData, isEditMode, resetForm, navigate, t]);

  // ── Skills helpers ───────────────────────────────────────────────────────────
  const syncSkills = (next: string[]) => {
    setSkillsList(next);
    formik.setFieldValue("skills", next.join(", "));
  };
  const addSkill = (raw: string) => {
    const skill = raw.trim();
    if (!skill || skillsList.some((s) => s.toLowerCase() === skill.toLowerCase())) return;
    syncSkills([...skillsList, skill]);
  };
  const removeSkill = (skill: string) => syncSkills(skillsList.filter((s) => s !== skill));

  // ── Section completion tracking ──────────────────────────────────────────────
  const markComplete = (i: number) =>
    setCompletedSections((prev) => new Set([...prev, i]));

  const goNext = () => {
    markComplete(activeSection);
    setActiveSection((p) => Math.min(p + 1, SECTIONS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goPrev = () => {
    setActiveSection((p) => Math.max(p - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Review summary fields ────────────────────────────────────────────────────
  const summaryFields = [
    { label: "Job Title", value: formik.values.job_title, icon: BriefcaseIcon },
    { label: "Category", value: formik.values.category, icon: AcademicCapIcon },
    { label: "Location", value: formik.values.location, icon: MapPinIcon },
    { label: "Employment Type", value: formik.values.employment_type, icon: ClockIcon },
    { label: "Experience Level", value: formik.values.experience_level, icon: UserGroupIcon },
    {
      label: "Budget",
      value: formik.values.budget
        ? `${formik.values.currency} ${formik.values.budget}`
        : undefined,
      icon: CurrencyDollarIcon,
    },
    {
      label: "Duration",
      value:
        durationStart && durationEnd
          ? `${durationStart} → ${durationEnd}`
          : durationStart || durationEnd,
      icon: CalendarDaysIcon,
    },
  ];

  const isSubmitting = isCreating || isUpdating;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
              <BriefcaseIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">
                {isEditMode ? "Edit Job Posting" : "Create Job Posting"}
              </h1>
              <p className="text-xs text-slate-400">
                {isEditMode ? "Update your listing" : "Reach thousands of African students"}
              </p>
            </div>
          </div>
          {/* Status badge — superadmin only */}
          {role === "superadmin" && (
            <select
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
            >
              <option value="Pending">⏳ Pending</option>
              <option value="Active">✅ Active</option>
              <option value="Completed">🏁 Completed</option>
            </select>
          )}
        </div>

        {/* Progress + step nav */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-3 space-y-2.5">
          <ProgressBar activeSection={activeSection} total={SECTIONS.length} />
          <StepNav
            sections={SECTIONS}
            activeSection={activeSection}
            completedSections={completedSections}
            onJump={setActiveSection}
          />
        </div>
      </div>

      {/* ── Main Form ────────────────────────────────────────────────────────── */}
      <form onSubmit={formik.handleSubmit}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">

          {/* ── SECTION 0: Basics ─────────────────────────────────────────── */}
          {activeSection === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Superadmin employer ID */}
              {role === "superadmin" && (
                <SectionCard title="Admin Controls" subtitle="Superadmin-only settings" icon={UserGroupIcon}>
                  <div>
                    <FieldLabel htmlFor="employer_id">{renderLabel(t("pages.jobs.employerIdOptional"))}</FieldLabel>
                    <input
                      id="employer_id"
                      name="employer_id"
                      className={inputCls}
                      placeholder={t("pages.jobs.employerIdPlaceholder")}
                      value={formik.values.employer_id}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <HelperText>{t("pages.jobs.employerIdHelper")}</HelperText>
                  </div>
                </SectionCard>
              )}

              <SectionCard
                title="Job Basics"
                subtitle="Start with the essential information about the role"
                icon={BriefcaseIcon}
              >
                {/* Job Title */}
                <div>
                  <FieldLabel htmlFor="job_title" required>
                    {t("pages.jobs.jobTitleLabel")}
                  </FieldLabel>
                  <input
                    id="job_title"
                    name="job_title"
                    className={inputCls}
                    placeholder={t("pages.jobs.jobTitlePlaceholder")}
                    value={formik.values.job_title}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <ErrorMsg msg={formik.touched.job_title ? formik.errors.job_title : undefined} />
                </div>

                {/* Category + Location row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="category" required>
                      {t("pages.jobs.categoryLabel")}
                    </FieldLabel>
                    {isLoadingCategories ? (
                      <select id="category" name="category" disabled className={selectCls}>
                        <option>{t("pages.jobs.loadingCategories")}</option>
                      </select>
                    ) : isCategoriesError ? (
                      <>
                        <select id="category" name="category" disabled className={selectCls}>
                          <option>{t("pages.jobs.errorLoadingCategories")}</option>
                        </select>
                        <ErrorMsg msg={t("pages.jobs.failedToLoadCategories")} />
                      </>
                    ) : categories.length === 0 ? (
                      <>
                        <select id="category" name="category" disabled className={`${selectCls} bg-red-50 border-red-200`}>
                          <option>{t("pages.jobs.noCategoriesAvailable")}</option>
                        </select>
                        <ErrorMsg msg={t("pages.jobs.noCategoriesCreateFirst")} />
                        <HelperText>{t("pages.jobs.onlySuperadminCreateCategories")}</HelperText>
                      </>
                    ) : (
                      <>
                        <select
                          id="category"
                          name="category"
                          className={selectCls}
                          value={formik.values.category}
                          onChange={(e) => {
                            formik.handleChange(e);
                            if (formik.errors.category) formik.setFieldTouched("category", true);
                          }}
                          onBlur={formik.handleBlur}
                          required
                          aria-required="true"
                        >
                          <option value="">{t("pages.jobs.selectCategory")}</option>
                          {categories.map((category: any) => (
                            <option key={category.category_id} value={category.name}>
                              {category.icon || "💼"} {category.name}
                            </option>
                          ))}
                        </select>
                        {formik.touched.category && formik.errors.category ? (
                          <ErrorMsg msg={formik.errors.category} />
                        ) : formik.values.category ? (
                          <p className="mt-1.5 text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircleSolid className="w-3.5 h-3.5" />
                            {t("pages.jobs.categorySelected")}
                          </p>
                        ) : null}
                        <HelperText>{t("pages.jobs.selectCategoryHelper")}</HelperText>
                      </>
                    )}
                  </div>

                  <div>
                    <FieldLabel htmlFor="location" required>
                      {t("pages.jobs.locationLabel")}
                    </FieldLabel>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="location"
                        name="location"
                        className={`${inputCls} pl-9`}
                        placeholder={t("pages.jobs.locationPlaceholder")}
                        value={formik.values.location}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    <ErrorMsg msg={formik.touched.location ? formik.errors.location : undefined} />
                  </div>
                </div>

                {/* Employment Type + Experience Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="employment_type">
                      {t("pages.jobs.employmentTypeOptional")}
                    </FieldLabel>
                    <select
                      id="employment_type"
                      name="employment_type"
                      className={selectCls}
                      value={formik.values.employment_type}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">{t("pages.jobs.selectEmploymentType")}</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="experience_level">
                      {t("pages.jobs.experienceLevelOptional")}
                    </FieldLabel>
                    <select
                      id="experience_level"
                      name="experience_level"
                      className={selectCls}
                      value={formik.values.experience_level}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">{t("pages.jobs.selectExperienceLevel")}</option>
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── SECTION 1: Details ────────────────────────────────────────── */}
          {activeSection === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionCard
                title="Job Details"
                subtitle="Help candidates understand the role clearly"
                icon={DocumentTextIcon}
              >
                <div>
                  <FieldLabel htmlFor="description">
                    {t("pages.jobs.descriptionOptional")}
                  </FieldLabel>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    className={textareaCls}
                    placeholder={t("pages.jobs.descriptionPlaceholder")}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <HelperText>A clear, compelling description improves application rates by up to 3×.</HelperText>
                </div>

                <div>
                  <FieldLabel htmlFor="requirements">
                    {t("pages.jobs.requirementsOptional")}
                  </FieldLabel>
                  <textarea
                    id="requirements"
                    name="requirements"
                    rows={4}
                    className={textareaCls}
                    placeholder={t("pages.jobs.requirementsPlaceholder")}
                    value={formik.values.requirements}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <HelperText>List qualifications, certifications, or skills candidates must have.</HelperText>
                </div>

                {/* Skills */}
                <div>
                  <FieldLabel htmlFor="skills-input">
                    {t("pages.jobs.skillsOptional")}
                  </FieldLabel>
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-2.5 focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-500 transition-all min-h-[44px] flex flex-wrap gap-2 items-center">
                    {skillsList.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSkill(s)}
                          aria-label={`Remove ${s}`}
                          className="text-violet-400 hover:text-red-500 transition-colors ml-0.5 leading-none font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      id="skills-input"
                      className="border-none outline-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 min-w-[160px] h-7 flex-1"
                      placeholder={skillsList.length ? "" : t("pages.jobs.skillsPlaceholder")}
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      onBlur={() => {
                        formik.setFieldTouched("skills", true);
                        if (skillsInput.trim()) { addSkill(skillsInput); setSkillsInput(""); }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addSkill(skillsInput);
                          setSkillsInput("");
                        }
                        if (e.key === "Backspace" && !skillsInput && skillsList.length > 0) {
                          removeSkill(skillsList[skillsList.length - 1]);
                        }
                      }}
                    />
                  </div>
                  <HelperText>Press Enter or comma to add a skill. Press Backspace to remove the last one.</HelperText>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── SECTION 2: Compensation ───────────────────────────────────── */}
          {activeSection === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionCard
                title="Compensation & Duration"
                subtitle="Set your budget and project timeline"
                icon={CurrencyDollarIcon}
              >
                {/* Budget + Currency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="budget" required>
                      {t("pages.jobs.budgetLabel")}
                    </FieldLabel>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="budget"
                        name="budget"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={`${inputCls} pl-9`}
                        placeholder={t("pages.jobs.budgetPlaceholder")}
                        value={formik.values.budget}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/[^\d]/g, "").slice(0, 10);
                          formik.setFieldValue("budget", digitsOnly);
                        }}
                        onBlur={formik.handleBlur}
                      />
                    </div>
                    <ErrorMsg msg={formik.touched.budget ? formik.errors.budget : undefined} />
                  </div>

                  <div>
                    <FieldLabel htmlFor="currency" required>
                      {t("pages.jobs.currencyLabel")}
                    </FieldLabel>
                    <select
                      id="currency"
                      name="currency"
                      className={selectCls}
                      value={formik.values.currency}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.label}
                        </option>
                      ))}
                    </select>
                    <ErrorMsg msg={formik.touched.currency ? formik.errors.currency : undefined} />
                  </div>
                </div>

                {/* Duration dates */}
                <div>
                  <FieldLabel required>{t("pages.jobs.durationLabel")}</FieldLabel>
                  <div className="grid grid-cols-2 gap-0 max-w-md">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5" /> Start date
                      </p>
                      <input
                        id="duration_start"
                        name="duration_start"
                        type="date"
                        className={`${inputCls} rounded-r-none`}
                        value={durationStart}
                        onChange={(e) => {
                          const next = e.target.value;
                          setDurationStart(next);
                          formik.setFieldValue("duration_start", next);
                          const ds = next && durationEnd ? `${next} - ${durationEnd}` : next || durationEnd;
                          formik.setFieldValue("duration", ds || "");
                        }}
                        onBlur={() => {
                          formik.setFieldTouched("duration", true);
                          formik.setFieldTouched("duration_start", true);
                        }}
                      />
                      <ErrorMsg msg={formik.touched.duration_start ? formik.errors.duration_start : undefined} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5" /> End date
                      </p>
                      <input
                        id="duration_end"
                        name="duration_end"
                        type="date"
                        className={`${inputCls} rounded-l-none border-l-0`}
                        value={durationEnd}
                        onChange={(e) => {
                          const next = e.target.value;
                          setDurationEnd(next);
                          formik.setFieldValue("duration_end", next);
                          const ds = durationStart && next ? `${durationStart} - ${next}` : durationStart || next;
                          formik.setFieldValue("duration", ds || "");
                        }}
                        onBlur={() => {
                          formik.setFieldTouched("duration", true);
                          formik.setFieldTouched("duration_end", true);
                        }}
                      />
                      <ErrorMsg msg={formik.touched.duration_end ? formik.errors.duration_end : undefined} />
                    </div>
                  </div>
                  <ErrorMsg msg={formik.touched.duration ? formik.errors.duration : undefined} />
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── SECTION 3: Preferences (already captured in basics, show summary) */}
          {activeSection === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionCard
                title="Candidate Preferences"
                subtitle="These were set in Job Basics — confirm or adjust below"
                icon={AcademicCapIcon}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="employment_type2">
                      {t("pages.jobs.employmentTypeOptional")}
                    </FieldLabel>
                    <select
                      id="employment_type2"
                      name="employment_type"
                      className={selectCls}
                      value={formik.values.employment_type}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">{t("pages.jobs.selectEmploymentType")}</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="experience_level2">
                      {t("pages.jobs.experienceLevelOptional")}
                    </FieldLabel>
                    <select
                      id="experience_level2"
                      name="experience_level"
                      className={selectCls}
                      value={formik.values.experience_level}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="">{t("pages.jobs.selectExperienceLevel")}</option>
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>
                </div>

                {/* Info tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {[
                    { label: "Job Title", value: formik.values.job_title },
                    { label: "Category", value: formik.values.category },
                    { label: "Location", value: formik.values.location },
                  ]
                    .filter((f) => f.value)
                    .map((f) => (
                      <div key={f.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <p className="text-xs text-slate-400 mb-0.5">{f.label}</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{f.value}</p>
                      </div>
                    ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── SECTION 4: Questions ──────────────────────────────────────── */}
          {activeSection === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionCard
                title="Application Questions"
                subtitle="Ask candidates custom questions to filter better"
                icon={QuestionMarkCircleIcon}
              >
                <div className="space-y-4">
                  {questions.length === 0 && (
                    <div className="text-center py-10 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                      <QuestionMarkCircleIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-500">No questions yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Add screening questions to shortlist better candidates
                      </p>
                    </div>
                  )}

                  {questions.map((question, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
                          {t("pages.jobs.questionNumber", { number: index + 1 })}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                          className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <FieldLabel htmlFor={`question_text_${index}`} required>
                          {t("pages.jobs.questionText")}
                        </FieldLabel>
                        <input
                          id={`question_text_${index}`}
                          className={inputCls}
                          value={question.question_text}
                          onChange={(e) => {
                            const nq = [...questions];
                            nq[index].question_text = e.target.value;
                            setQuestions(nq);
                          }}
                          placeholder={t("pages.jobs.questionTextPlaceholder")}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel htmlFor={`question_type_${index}`} required>
                            {t("pages.jobs.questionType")}
                          </FieldLabel>
                          <select
                            id={`question_type_${index}`}
                            className={selectCls}
                            value={question.question_type}
                            onChange={(e) => {
                              const nq = [...questions];
                              nq[index].question_type = e.target.value as JobQuestion["question_type"];
                              if (e.target.value !== "multiple_choice") delete nq[index].options;
                              setQuestions(nq);
                            }}
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="yes_no">Yes / No</option>
                            <option value="multiple_choice">Multiple Choice</option>
                          </select>
                        </div>

                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              id={`question_required_${index}`}
                              checked={question.is_required}
                              onChange={(e) => {
                                const nq = [...questions];
                                nq[index].is_required = e.target.checked;
                                setQuestions(nq);
                              }}
                              className="w-4 h-4 accent-violet-600 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-700">
                              {t("pages.jobs.requiredQuestion")}
                            </span>
                          </label>
                        </div>
                      </div>

                      {question.question_type === "multiple_choice" && (
                        <div>
                          <FieldLabel htmlFor={`question_options_${index}`}>
                            {t("pages.jobs.optionsCommaSeparated")}
                          </FieldLabel>
                          <input
                            id={`question_options_${index}`}
                            className={inputCls}
                            value={
                              Array.isArray(question.options)
                                ? question.options.join(", ")
                                : typeof question.options === "string"
                                ? question.options
                                : ""
                            }
                            onChange={(e) => {
                              const nq = [...questions];
                              nq[index].options = e.target.value;
                              setQuestions(nq);
                            }}
                            placeholder={t("pages.jobs.optionsPlaceholder")}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setQuestions([
                        ...questions,
                        {
                          question_text: "",
                          question_type: "text",
                          is_required: false,
                          display_order: questions.length,
                        },
                      ])
                    }
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-semibold text-sm hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all duration-150"
                  >
                    <PlusIcon className="w-4 h-4" />
                    {t("pages.jobs.addQuestion")}
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── SECTION 5: Review ─────────────────────────────────────────── */}
          {activeSection === 5 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Hero summary card */}
              <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl shadow-violet-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <BriefcaseIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold truncate">
                      {formik.values.job_title || "Untitled Role"}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-violet-200 text-sm">
                      {formik.values.category && <span>{formik.values.category}</span>}
                      {formik.values.category && formik.values.location && (
                        <span>·</span>
                      )}
                      {formik.values.location && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5" />
                          {formik.values.location}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formik.values.employment_type && (
                        <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold">
                          {formik.values.employment_type}
                        </span>
                      )}
                      {formik.values.experience_level && (
                        <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold">
                          {formik.values.experience_level}
                        </span>
                      )}
                      {formik.values.budget && (
                        <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold">
                          {formik.values.currency} {formik.values.budget}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <SectionCard title="Posting Summary" subtitle="Review all fields before publishing" icon={CheckCircleIcon}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {summaryFields
                    .filter((f) => f.value)
                    .map((f) => (
                      <div key={f.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <f.icon className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-xs text-slate-400">{f.label}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate">{f.value}</p>
                      </div>
                    ))}
                </div>

                {formik.values.description && (
                  <div className="mt-2 rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs font-semibold text-slate-400 mb-1.5">Description</p>
                    <p className="text-sm text-slate-700 line-clamp-3">{formik.values.description}</p>
                  </div>
                )}

                {skillsList.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-slate-400 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsList.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {questions.length > 0 && (
                  <div className="mt-2 rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs font-semibold text-slate-400 mb-2">
                      {questions.length} Application Question{questions.length > 1 ? "s" : ""}
                    </p>
                    <ul className="space-y-1">
                      {questions.map((q, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-violet-500 font-bold text-xs mt-0.5">{i + 1}.</span>
                          <span className="truncate">{q.question_text || "Untitled question"}</span>
                          {q.is_required && (
                            <span className="ml-auto text-xs text-red-500 font-semibold flex-shrink-0">Required</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Validation warnings */}
                {!formik.values.job_title && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 font-medium flex items-center gap-2">
                    <span>⚠️</span> Job Title is required — go back to Basics to fill it in.
                  </div>
                )}
              </SectionCard>

              {/* Publish CTA */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Ready to publish?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your job will be visible to thousands of African students immediately.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingJob || isLoadingCategories || categories.length === 0 || isCategoriesError}
                  className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-violet-200 transition-all duration-150 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {isEditMode ? "Updating..." : "Publishing..."}
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      {isEditMode ? "Update Job" : "Publish Job"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Bottom navigation ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <button
              type="button"
              onClick={goPrev}
              disabled={activeSection === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRightIcon className="w-4 h-4 rotate-180" />
              Previous
            </button>

            {activeSection < SECTIONS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow-md shadow-violet-200 transition-all active:scale-95"
              >
                Continue
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || isLoadingJob || isLoadingCategories || categories.length === 0 || isCategoriesError}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-violet-200 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {isEditMode ? "Updating..." : "Publishing..."}
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    {isEditMode ? "Update Job" : "Publish Job"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateJob;