import React from 'react';
import { TrashIcon, CheckCircleIcon, ClockIcon, ListBulletIcon } from '@heroicons/react/24/outline';

interface Task {
  task_id: string;
  title: string;
  description?: string | null;
  status: string;
  assigned_student?: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
  };
  deadline?: string | null;
  payment_amount?: number | null;
  created_at?: string;
}

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onTaskClick, onEditTask, onDeleteTask }) => {
  const normalizeStatus = (status: string) => status?.toUpperCase().replaceAll('-', '_');

  const getStatusLabel = (status: string) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'NOT_STARTED' || normalized === 'TODO' || normalized === 'TO_DO') return 'Not Started';
    if (normalized === 'IN_PROGRESS' || normalized === 'INPROGRESS') return 'In Progress';
    if (normalized === 'SUBMITTED') return 'Submitted';
    if (normalized === 'UNDER_REVIEW') return 'In Review';
    if (normalized === 'COMPLETED' || normalized === 'DONE') return 'Completed';
    if (normalized === 'REJECTED') return 'Rejected';
    if (normalized === 'DISPUTED') return 'Disputed';
    return status;
  };

  const getStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'NOT_STARTED':
      case 'TODO':
      case 'TO_DO':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          badge: 'bg-gray-200 text-gray-800',
          icon: ListBulletIcon,
        };
      case 'IN_PROGRESS':
      case 'INPROGRESS':
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          badge: 'bg-amber-200 text-amber-800',
          icon: ClockIcon,
        };
      case 'COMPLETED':
      case 'DONE':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          badge: 'bg-emerald-200 text-emerald-800',
          icon: CheckCircleIcon,
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          badge: 'bg-gray-200 text-gray-800',
          icon: ListBulletIcon,
        };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <ListBulletIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-gray-600">No tasks to display. Create a task to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const colors = getStatusColor(task.status);
        const StatusIcon = colors.icon;

        return (
          <div
            key={task.task_id}
            onClick={() => onTaskClick?.(task)}
            className={`rounded-2xl border ${colors.border} ${colors.bg} p-4 shadow-sm transition hover:shadow-md cursor-pointer hover:border-blue-300`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Task Title & Status */}
                <div className="flex items-start gap-3">
                  <StatusIcon className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{task.title}</h3>
                    {task.description && (
                      <p className="mt-1 text-xs text-gray-600 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                </div>

                {/* Task Meta */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors.badge}`}>
                    {getStatusLabel(task.status)}
                  </span>

                  {task.deadline && (
                    <span className="text-xs text-gray-600">
                      📅 <span className="font-medium">{formatDate(task.deadline)}</span>
                    </span>
                  )}

                  {task.payment_amount && (
                    <span className="text-xs text-gray-600">
                      💰 <span className="font-medium">${task.payment_amount}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Assigned Student & Actions */}
              <div className="flex flex-col items-end gap-3">
                {(task.assigned_student || (task as any).assignedStudent) ? (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-semibold text-white">
                      {getInitials((task.assigned_student || (task as any).assignedStudent)?.full_name)}
                    </div>
                    <span className="text-xs text-gray-700 font-medium truncate max-w-[100px]">
                      {(task.assigned_student || (task as any).assignedStudent)?.full_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 italic">Unassigned</span>
                )}

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask?.(task);
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-blue-600 transition"
                    title="Edit task"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask?.(task);
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-red-600 transition"
                    title="Delete task"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskListView;
