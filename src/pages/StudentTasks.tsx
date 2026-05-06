import React from "react";
import { ClipboardDocumentListIcon, ClockIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import { useGetMyAssignedTasksQuery, useUpdateTaskStatusMutation } from "../services/api/tasksApi";
import type { TaskStatus } from "../services/api/tasksApi";

const statusLabel = (status: TaskStatus) => {
  switch (status) {
    case "NOT_STARTED":
      return "Not Started";
    case "IN_PROGRESS":
      return "In Progress";
    case "SUBMITTED":
      return "Submitted";
    case "UNDER_REVIEW":
      return "Under Review";
    case "COMPLETED":
      return "Completed";
    case "REJECTED":
      return "Rejected";
    case "DISPUTED":
      return "Disputed";
    default:
      return status;
  }
};

const StudentTasks: React.FC = () => {
  const { data, isLoading, error } = useGetMyAssignedTasksQuery();
  const [updateTaskStatus, { isLoading: isUpdating }] = useUpdateTaskStatusMutation();
  const tasks = data?.data || [];

  const getStudentTransitions = (status: TaskStatus): TaskStatus[] => {
    if (status === "NOT_STARTED") return ["IN_PROGRESS"];
    if (status === "IN_PROGRESS") return ["SUBMITTED", "COMPLETED", "DISPUTED"];
    if (status === "SUBMITTED") return ["COMPLETED", "DISPUTED"];
    if (status === "UNDER_REVIEW") return ["DISPUTED"];
    if (status === "REJECTED") return ["IN_PROGRESS", "DISPUTED"];
    return [];
  };

  const handleStatusChange = async (jobId: string, taskId: string, nextStatus: TaskStatus) => {
    try {
      await updateTaskStatus({ jobId, taskId, status: nextStatus }).unwrap();
      toast.success(`Task moved to ${statusLabel(nextStatus)}.`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update task status.");
    }
  };

  if (isLoading) return <Loader />;
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        Unable to load your tasks right now.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <ClipboardDocumentListIcon className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-600">Tasks assigned to you from approved jobs.</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600">
          No tasks assigned yet.
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const transitions = getStudentTransitions(task.status);
            return (
              <div key={task.task_id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    {task.description ? (
                      <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-indigo-700">
                        Job: {task.job?.job_title || task.job_id}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1.5">
                        Status: {statusLabel(task.status)}
                      </span>
                      {task.deadline ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-[220px]">
                    {transitions.length > 0 ? (
                      <select
                        defaultValue=""
                        disabled={isUpdating}
                        onChange={(event) => {
                          const next = event.target.value as TaskStatus;
                          if (next) {
                            handleStatusChange(task.job_id, task.task_id, next);
                            event.target.value = "";
                          }
                        }}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500"
                      >
                        <option value="">Update status</option>
                        {transitions.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                        No action available from current status.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentTasks;
