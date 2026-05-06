import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon, Square3Stack3DIcon, ListBulletIcon, TableCellsIcon, CalendarIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetJobTaskManagementQuery,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
} from "../../services/api/tasksApi";
import type { TaskStatus } from "../../services/api/tasksApi";
import { transformTasksToKanban, transformKanbanStatusToAPI } from "../../utils/taskTransformer";
import type { TasksState } from '@/types/task.types';
import TaskBoard from "../../components/Tasks/TaskBoard";
import TaskOverview from "../../components/Tasks/TaskOverview";
import TaskListView from "../../components/Tasks/TaskListView";
import TaskTableView from "../../components/Tasks/TaskTableView";
import TaskTimelineView from "../../components/Tasks/TaskTimelineView";
import TabsNavigation from "../../components/Tasks/TabsNavigation";

type EditableTask = {
  task_id: string;
  title: string;
  description?: string | null;
  deadline?: string | null;
  assigned_student_id?: string;
  assignedStudent?: { user_id: string; full_name: string };
};

const JobTasksKanban: React.FC = () => {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, error } = useGetJobTaskManagementQuery(id);
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [activeTab, setActiveTab] = useState("overview");
  const isCreateMode = searchParams.get("create") === "1";
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    deadline: "",
    assigned_student_id: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<EditableTask | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<EditableTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    deadline: "",
    assigned_student_id: "",
  });

  const [createTask] = useCreateTaskMutation();

  const taskData = data?.data;
  const approvedStudents = taskData?.approved_students || [];
  const tasks = taskData?.tasks || [];

  // Convert API tasks to Kanban format
  const kanbanTasks = useMemo<TasksState>(() => {
    if (!tasks.length) {
      return { todo: [], 'in-progress': [], done: [] };
    }
    return transformTasksToKanban(tasks);
  }, [tasks]);

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.assigned_student_id) {
      toast.error("Pick an approved student before creating the task.");
      return;
    }

    setIsCreating(true);
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
      setSearchParams({});
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create task.");
    } finally {
      setIsCreating(false);
    }
  };

  const openEditTaskModal = (task: EditableTask) => {
    setEditingTask(task);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : "",
      assigned_student_id: task.assignedStudent?.user_id || task.assigned_student_id || "",
    });
  };

  const closeEditTaskModal = () => {
    setEditingTask(null);
    setEditForm({
      title: "",
      description: "",
      deadline: "",
      assigned_student_id: "",
    });
  };

  const handleEditTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTask) return;
    if (!editForm.assigned_student_id) {
      toast.error("Please select an approved student.");
      return;
    }
    setIsSavingEdit(true);
    try {
      await updateTask({
        jobId: id,
        taskId: editingTask.task_id,
        data: {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          deadline: editForm.deadline ? editForm.deadline : null,
          assigned_student_id: editForm.assigned_student_id,
        },
      }).unwrap();
      toast.success("Task updated successfully.");
      closeEditTaskModal();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update task.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTask({ jobId: id, taskId: taskToDelete.task_id }).unwrap();
      toast.success("Task deleted.");
      setTaskToDelete(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete task.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveTask = async (taskId: string, _fromStatus: string, toStatus: string) => {
    const apiStatus = transformKanbanStatusToAPI(toStatus);
    try {
      await updateTaskStatus({ jobId: id, taskId, status: apiStatus as TaskStatus }).unwrap();
      toast.success(`Task moved to ${toStatus.replaceAll("-", " ")}.`);
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
      {/* Header */}
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
              Manage tasks using an interactive Kanban board. Create tasks for approved students only.
            </p>
          </div>
        </div>
        <button
          onClick={() => setSearchParams({ create: "1" })}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition duration-200"
        >
          + New Task
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-t-2xl border border-gray-200 border-b-0 bg-white">
        <TabsNavigation
          tabs={[
            { id: "overview", label: "Overview", icon: <ChartBarIcon className="h-5 w-5" /> },
            { id: "board", label: "Board", icon: <Square3Stack3DIcon className="h-5 w-5" /> },
            { id: "list", label: "List", icon: <ListBulletIcon className="h-5 w-5" /> },
            { id: "table", label: "Table", icon: <TableCellsIcon className="h-5 w-5" /> },
            { id: "timeline", label: "Timeline", icon: <CalendarIcon className="h-5 w-5" /> },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {isCreateMode ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
            <button
              onClick={() => setSearchParams({})}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Task Board
            </button>
          </div>
          <form onSubmit={handleCreateTask} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Task Title *</label>
              <input
                type="text"
                value={formState.title}
                onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formState.description}
                onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Deadline</label>
                <input
                  type="date"
                  value={formState.deadline}
                  onChange={(e) => setFormState((prev) => ({ ...prev, deadline: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Assign To *</label>
                <select
                  value={formState.assigned_student_id}
                  onChange={(e) => setFormState((prev) => ({ ...prev, assigned_student_id: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select an approved student</option>
                  {approvedStudents.map((entry) => (
                    <option key={entry.student.user_id} value={entry.student.user_id}>
                      {entry.student.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isCreating || approvedStudents.length === 0 || !formState.assigned_student_id}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Task"}
            </button>
          </form>
        </section>
      ) : (
      <div className="rounded-b-2xl border border-t-0 border-gray-200 bg-white p-6 shadow-sm">
        {activeTab === "overview" && (
          <TaskOverview taskData={taskData} kanbanTasks={kanbanTasks} />
        )}
        {activeTab === "board" && (
          <TaskBoard tasks={kanbanTasks} onMoveTask={handleMoveTask} onOpenCreateTask={() => setSearchParams({ create: "1" })} />
        )}
        {activeTab === "list" && (
          <TaskListView tasks={tasks} onEditTask={openEditTaskModal} onDeleteTask={setTaskToDelete} />
        )}
        {activeTab === "table" && (
          <TaskTableView tasks={tasks} onEditTask={openEditTaskModal} onDeleteTask={setTaskToDelete} />
        )}
        {activeTab === "timeline" && (
          <TaskTimelineView tasks={tasks} />
        )}
      </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">Edit Task</h3>
            <form onSubmit={handleEditTask} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Task Title *</label>
                <input
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Deadline</label>
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Assign To *</label>
                  <select
                    required
                    value={editForm.assigned_student_id}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, assigned_student_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select an approved student</option>
                    {approvedStudents.map((entry) => (
                      <option key={entry.student.user_id} value={entry.student.user_id}>
                        {entry.student.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={closeEditTaskModal}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Delete Task</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{taskToDelete.title}</span>?
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTasksKanban;
