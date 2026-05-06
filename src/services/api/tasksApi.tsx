import { apiSlice } from "./apiSlice";

export type TaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "REJECTED"
  | "DISPUTED";

export interface ApprovedStudent {
  application_id: string;
  student_id: string;
  status: "Approved";
  approved_at?: string;
  student: {
    user_id: string;
    full_name: string;
    email: string;
    mobile_number?: string;
    trust_score?: number | null;
  };
}

export interface EmployerTaskOverviewJob {
  job_id: string;
  job_title: string;
  applications: number;
  status: string;
  budget: number;
  location: string;
  duration: string;
  applicant_count: number;
  approved_students_count: number;
  task_count: number;
  completed_task_count: number;
  disputed_task_count: number;
  overall_progress: number;
}

export interface TaskRecord {
  task_id: string;
  job_id: string;
  assigned_student_id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  deadline?: string | null;
  payment_amount?: number | null;
  payment_release_ready: boolean;
  payment_release_blocked: boolean;
  created_at: string;
  updated_at: string;
  assignedStudent?: {
    user_id: string;
    full_name: string;
    email: string;
    mobile_number?: string;
  };
  job?: {
    job_id: string;
    job_title: string;
    status: string;
  };
}

export interface TaskManagementSummary {
  applicant_count: number;
  approved_students_count: number;
  task_count: number;
  completed_task_count: number;
  disputed_task_count: number;
  overall_progress: number;
}

export interface TaskManagementResponseData {
  job: {
    job_id: string;
    job_title: string;
    status: string;
    budget: number;
    applications: number;
    location: string;
    duration: string;
    funding_status?: string | null;
  };
  approved_students: ApprovedStudent[];
  tasks: TaskRecord[];
  summary: TaskManagementSummary;
}

type ApiResponse<T> = {
  success: boolean;
  status: number;
  data: T;
  message: string;
};

export interface CreateTaskRequest {
  assigned_student_id: string;
  title: string;
  description?: string;
  deadline?: string | null;
}

export interface UpdateTaskRequest {
  assigned_student_id?: string;
  title?: string;
  description?: string;
  deadline?: string | null;
}

export const tasksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEmployerTaskOverview: builder.query<ApiResponse<EmployerTaskOverviewJob[]>, void>({
      query: () => ({
        url: "/employer/task-management/jobs",
        method: "GET",
      }),
      providesTags: ["Task", "Job"],
    }),

    getJobTaskManagement: builder.query<ApiResponse<TaskManagementResponseData>, string>({
      query: (jobId) => ({
        url: `/jobs/${jobId}/task-management`,
        method: "GET",
      }),
      providesTags: (_result, _error, jobId) => [
        "Task",
        { type: "Job", id: jobId },
      ],
    }),

    getMyAssignedTasks: builder.query<ApiResponse<TaskRecord[]>, void>({
      query: () => ({
        url: "/tasks/my-assigned",
        method: "GET",
      }),
      providesTags: ["Task"],
    }),

    createTask: builder.mutation<ApiResponse<TaskRecord>, { jobId: string; data: CreateTaskRequest }>({
      query: ({ jobId, data }) => ({
        url: `/jobs/${jobId}/tasks`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        "Task",
        { type: "Job", id: jobId },
        "Job",
      ],
    }),

    updateTask: builder.mutation<
      ApiResponse<TaskRecord>,
      { jobId: string; taskId: string; data: UpdateTaskRequest }
    >({
      query: ({ jobId, taskId, data }) => ({
        url: `/jobs/${jobId}/tasks/${taskId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        "Task",
        { type: "Job", id: jobId },
        "Job",
      ],
    }),

    deleteTask: builder.mutation<ApiResponse<{ task_id: string }>, { jobId: string; taskId: string }>({
      query: ({ jobId, taskId }) => ({
        url: `/jobs/${jobId}/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        "Task",
        { type: "Job", id: jobId },
        "Job",
      ],
    }),

    updateTaskStatus: builder.mutation<
      ApiResponse<TaskRecord>,
      { jobId: string; taskId: string; status: TaskStatus }
    >({
      query: ({ jobId, taskId, status }) => ({
        url: `/jobs/${jobId}/tasks/${taskId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        "Task",
        { type: "Job", id: jobId },
        "Job",
      ],
    }),
  }),
});

export const {
  useGetEmployerTaskOverviewQuery,
  useGetJobTaskManagementQuery,
  useGetMyAssignedTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
} = tasksApi;
