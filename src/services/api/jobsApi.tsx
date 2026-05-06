import { apiSlice } from "./apiSlice";

export interface JobQuestion {
  question_id?: string;
  question_text: string;
  question_type: "text" | "number" | "yes_no" | "multiple_choice";
  is_required: boolean;
  options?: string | string[];
  display_order?: number;
}

export interface Job {
  job_id: string;
  employer_id: string;
  job_title: string;
  applications: number;
  category: string;
  budget: number;
  currency?: string;
  duration: string;
  location: string;
  description?: string;
  requirements?: string;
  skills?: string;
  employment_type?: string;
  experience_level?: string;
  status: "Pending" | "Active" | "Inactive" | "Completed";
  funding_status?: "Unfunded" | "Pending" | "Funded" | "Paid" | null;
  momo_reference_id?: string | null;
  momo_paid_at?: string | null;
  disbursement_reference_id?: string | null;
  paid_at?: string | null;
  amount_paid_to_student?: number | null;
  amount_received_by_you?: number | null;
  created_at: string;
  updated_at: string;
  questions?: JobQuestion[];
  employer?: {
    user_id: string;
    full_name: string;
    email: string;
  };
}

export interface CreateJobRequest {
  employer_id?: string;
  job_title: string;
  category: string;
  budget: number;
  currency?: string;
  duration: string;
  location: string;
  description?: string;
  requirements?: string;
  skills?: string;
  employment_type?: string;
  experience_level?: string;
  status?: "Pending" | "Active" | "Inactive" | "Completed";
  questions?: JobQuestion[];
}

export interface UpdateJobRequest {
  job_title?: string;
  category?: string;
  budget?: number;
  currency?: string;
  duration?: string;
  location?: string;
  description?: string;
  requirements?: string;
  skills?: string;
  employment_type?: string;
  experience_level?: string;
  status?: "Pending" | "Active" | "Inactive" | "Completed";
  employer_name?: string;
  questions?: JobQuestion[];
}

export interface JobResponse {
  success: boolean;
  status: number;
  data: Job;
  message: string;
}

export interface JobsListResponse {
  success: boolean;
  status: number;
  data: Job[];
  message: string;
}

export interface JobsQueryParams {
  status?: "Pending" | "Active" | "Inactive" | "Completed";
  funded?: boolean;
  search?: string;
  location?: string;
  category?: string;
  currency?: string;
  payment_range?: string;
}

export interface DeleteJobResponse {
  success: boolean;
  status: number;
  data: {
    message: string;
  };
  message: string;
}

export const jobsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all jobs
    getAllJobs: builder.query<JobsListResponse, JobsQueryParams | void>({
      query: (params) => ({
        url: "/jobs",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Job"],
    }),

    // Get active jobs
    getActiveJobs: builder.query<JobsListResponse, void>({
      query: () => ({
        url: "/jobs/active",
        method: "GET",
      }),
      providesTags: ["Job"],
    }),

    // Get pending jobs
    getPendingJobs: builder.query<JobsListResponse, void>({
      query: () => ({
        url: "/jobs/pending",
        method: "GET",
      }),
      providesTags: ["Job"],
    }),

    // Get completed jobs
    getCompletedJobs: builder.query<JobsListResponse, void>({
      query: () => ({
        url: "/jobs/completed",
        method: "GET",
      }),
      providesTags: ["Job"],
    }),

    // Get job by ID
    getJobById: builder.query<JobResponse, string>({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Job", id }],
    }),

    // Create job
    createJob: builder.mutation<JobResponse, CreateJobRequest>({
      query: (jobData) => ({
        url: "/jobs",
        method: "POST",
        body: jobData,
      }),
      invalidatesTags: ["Job"],
    }),

    // Update job
    updateJob: builder.mutation<JobResponse, { id: string; data: UpdateJobRequest }>({
      query: ({ id, data }) => ({
        url: `/jobs/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Job", id }, "Job"],
    }),

    // Delete job
    deleteJob: builder.mutation<DeleteJobResponse, string>({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Job", id }, "Job"],
    }),

    // Toggle job status (Active/Inactive)
    toggleJobStatus: builder.mutation<JobResponse, string>({
      query: (id) => ({
        url: `/jobs/${id}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Job", id }, "Job"],
    }),

    // Admin/Superadmin review job (Approve/Disapprove)
    reviewJob: builder.mutation<JobResponse, { id: string; status: "Active" | "Inactive" }>({
      query: ({ id, status }) => ({
        url: `/jobs/${id}/review`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Job", id }, "Job"],
    }),
  }),
});

export const {
  useGetAllJobsQuery,
  useGetActiveJobsQuery,
  useGetPendingJobsQuery,
  useGetCompletedJobsQuery,
  useGetJobByIdQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useToggleJobStatusMutation,
  useReviewJobMutation,
} = jobsApi;

