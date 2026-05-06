import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";
import {
  useCreateTaskMutation,
  useGetJobTaskManagementQuery,
  useUpdateTaskStatusMutation,
} from "../../services/api/tasksApi";
import type { TaskRecord, TaskStatus } from "../../services/api/tasksApi";

const employerStatusOptions: Partial<Record<TaskStatus, TaskStatus[]>> = {
  IN_PROGRESS: ["DISPUTED"],
  SUBMITTED: ["UNDER_REVIEW", "DISPUTED"],
  UNDER_REVIEW: ["COMPLETED", "REJECTED", "DISPUTED"],
  REJECTED: ["UNDER_REVIEW"],
};

const statusStyles: Record<TaskStatus, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-violet-100 text-violet-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  DISPUTED: "bg-red-100 text-red-700",
};

const JobTasks: React.FC = () => {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetJobTaskManagementQuery(id);
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTaskStatus, { isLoading: isUpdatingStatus }] = useUpdateTaskStatusMutation();
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    deadline: "",
    assigned_student_id: "",
  });

  const taskData = data?.data;
  const approvedStudents = taskData?.approved_students || [];
  const tasks = taskData?.tasks || [];

  const tasksByStatus = useMemo(() => {
    return tasks.reduce<Record<TaskStatus, TaskRecord[]>>(
      (acc, task) => {
        acc[task.status].push(task);
        return acc;
      },
      {
        NOT_STARTED: [],
        IN_PROGRESS: [],
        SUBMITTED: [],
        UNDER_REVIEW: [],
        COMPLETED: [],
        REJECTED: [],
        DISPUTED: [],
      },
    );
  }, [tasks]);

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.assigned_student_id) {
      toast.error("Pick an approved student before creating the task.");
      return;
    }

    try {
      await createTask({
        jobId: id,
        data: {
          title: formState.title,
          description: formState.description || undefined,
          deadline: formState.deadline || null,
          assigned_student_id: formState.assigned_student_id,
        },
      }).unwrap();

      toast.success("Task created and assigned successfully.");
      setFormState({
        title: "",
        description: "",
        deadline: "",
        assigned_student_id: "",
      });
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create task.");
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus({ jobId: id, taskId, status }).unwrap();
      toast.success(`Task moved to ${status.replaceAll("_", " ")}.`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update task status.");
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error || !taskData) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        Unable to load this job's task workspace.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate("/dashboard/jobs/tasks")}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{taskData.job.job_title}</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create tasks for approved students only, then track submission, review, and completion inside this job.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Applicants</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{taskData.summary.applicant_count}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs text-emerald-700">Approved Students</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">{taskData.summary.approved_students_count}</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
          <p className="text-xs text-indigo-700">Tasks Created</p>
          <p className="mt-2 text-3xl font-bold text-indigo-900">{taskData.summary.task_count}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs text-amber-700">Overall Progress</p>
          <p className="mt-2 text-3xl font-bold text-amber-900">{taskData.summary.overall_progress}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr,1.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Approved Students</h2>
            </div>

            {approvedStudents.length === 0 ? (
              <p className="text-sm text-gray-600">
                Approve applicants first. Tasks cannot be assigned until a student is accepted for this job.
              </p>
            ) : (
              <div className="space-y-3">
                {approvedStudents.map((entry) => (
                  <div key={entry.application_id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{entry.student.full_name}</p>
                        <p className="text-sm text-gray-500">{entry.student.email}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Approved
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                        TrustScore: {entry.student.trust_score ?? "N/A"}
                      </span>
                      {entry.student.mobile_number ? (
                        <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                          {entry.student.mobile_number}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Create Task</h2>
            <p className="mt-2 text-sm text-gray-600">
              Every task stays tied to this job and must be assigned to one approved student.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleCreateTask}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Task title</label>
                <input
                  value={formState.title}
                  onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formState.description}
                  onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Deadline</label>
                <input
                  type="date"
                  value={formState.deadline}
                  onChange={(event) => setFormState((prev) => ({ ...prev, deadline: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Assign To</label>
                <select
                  value={formState.assigned_student_id}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, assigned_student_id: event.target.value }))
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-indigo-500"
                >
                  <option value="">Select an approved student</option>
                  {approvedStudents.map((entry) => (
                    <option key={entry.student.user_id} value={entry.student.user_id}>
                      {entry.student.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isCreating || approvedStudents.length === 0}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {isCreating ? "Creating task..." : "Create and Assign Task"}
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Task Board</h2>
              <p className="mt-2 text-sm text-gray-600">
                Submission, review, completion, and payment readiness are tracked per task.
              </p>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-600">
              No tasks created for this job yet.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {(
                [
                  "NOT_STARTED",
                  "IN_PROGRESS",
                  "SUBMITTED",
                  "UNDER_REVIEW",
                  "COMPLETED",
                  "REJECTED",
                  "DISPUTED",
                ] as TaskStatus[]
              ).map((status) =>
                tasksByStatus[status].length > 0 ? (
                  <div key={status}>
                    <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-500">
                      {status.replaceAll("_", " ")}
                    </h3>
                    <div className="space-y-3">
                      {tasksByStatus[status].map((task) => (
                        <div key={task.task_id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-lg font-semibold text-gray-900">{task.title}</h4>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[task.status]}`}>
                                  {task.status.replaceAll("_", " ")}
                                </span>
                              </div>
                              {task.description ? (
                                <p className="text-sm text-gray-600">{task.description}</p>
                              ) : null}

                              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                                  Assigned to: {task.assignedStudent?.full_name || "Student"}
                                </span>
                                {task.deadline ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm">
                                    <ClockIcon className="h-3.5 w-3.5" />
                                    {new Date(task.deadline).toLocaleDateString()}
                                  </span>
                                ) : null}
                                {task.payment_amount ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm">
                                    <CurrencyDollarIcon className="h-3.5 w-3.5" />
                                    {task.payment_amount.toLocaleString()}
                                  </span>
                                ) : null}
                              </div>

                              {task.payment_release_blocked ? (
                                <div className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                                  <ExclamationTriangleIcon className="h-4 w-4" />
                                  Payment is blocked until the dispute is resolved.
                                </div>
                              ) : task.payment_release_ready ? (
                                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                                  <CheckCircleIcon className="h-4 w-4" />
                                  Payment can be released because this task is completed.
                                </div>
                              ) : null}
                            </div>

                            <div className="min-w-[220px]">
                              {employerStatusOptions[task.status]?.length ? (
                                <div className="space-y-2">
                                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Move status
                                  </label>
                                  <select
                                    defaultValue=""
                                    disabled={isUpdatingStatus}
                                    onChange={(event) => {
                                      const nextStatus = event.target.value as TaskStatus;
                                      if (nextStatus) {
                                        handleStatusChange(task.task_id, nextStatus);
                                        event.target.value = "";
                                      }
                                    }}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500"
                                  >
                                    <option value="">Choose next step</option>
                                    {employerStatusOptions[task.status]?.map((option) => (
                                      <option key={option} value={option}>
                                        {option.replaceAll("_", " ")}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div className="rounded-xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                                  No employer action available from this state.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default JobTasks;
