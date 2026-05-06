import React, { useState } from 'react';
import { ChevronUpDownIcon, TrashIcon } from '@heroicons/react/24/outline';

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

interface TaskTableViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
}

type SortField = 'title' | 'status' | 'deadline' | 'assigned_student';
type SortOrder = 'asc' | 'desc';

const TaskTableView: React.FC<TaskTableViewProps> = ({ tasks, onTaskClick, onEditTask, onDeleteTask }) => {
  const normalizeStatus = (status: string) => status?.toUpperCase().replaceAll('-', '_');

  const [sortField, setSortField] = useState<SortField>('created_at' as any);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let aValue: any = a[sortField as keyof Task];
    let bValue: any = b[sortField as keyof Task];

    if (sortField === 'assigned_student') {
      aValue = a.assigned_student?.full_name || '';
      bValue = b.assigned_student?.full_name || '';
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'NOT_STARTED':
      case 'TODO':
      case 'TO_DO':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
      case 'INPROGRESS':
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-800';
      case 'COMPLETED':
      case 'DONE':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'NOT_STARTED':
      case 'TODO':
      case 'TO_DO':
        return 'Not Started';
      case 'IN_PROGRESS':
      case 'INPROGRESS':
        return 'In Progress';
      case 'SUBMITTED':
        return 'Submitted';
      case 'UNDER_REVIEW':
        return 'In Review';
      case 'COMPLETED':
      case 'DONE':
        return 'Completed';
      case 'REJECTED':
        return 'Rejected';
      case 'DISPUTED':
        return 'Disputed';
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const SortHeader = ({
    label,
    field,
  }: {
    label: string;
    field: SortField;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900 transition"
    >
      {label}
      <ChevronUpDownIcon
        className={`h-4 w-4 transition ${sortField === field ? 'opacity-100' : 'opacity-40'}`}
      />
    </button>
  );

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <p className="text-gray-600">No tasks to display. Create a task to get started!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4 text-left">
                <SortHeader label="Task Title" field="title" />
              </th>
              <th className="px-6 py-4 text-left">
                <SortHeader label="Status" field="status" />
              </th>
              <th className="px-6 py-4 text-left">
                <SortHeader label="Assigned To" field="assigned_student" />
              </th>
              <th className="px-6 py-4 text-left">
                <SortHeader label="Deadline" field="deadline" />
              </th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task, index) => (
              <tr
                key={task.task_id}
                onClick={() => onTaskClick?.(task)}
                className={`cursor-pointer transition hover:bg-blue-50 ${
                  index !== sortedTasks.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="max-w-sm">
                    <p className="font-medium text-gray-900 truncate">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 text-xs text-gray-500 truncate">{task.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {(task.assigned_student || (task as any).assignedStudent) ? (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-semibold text-white">
                        {((task.assigned_student || (task as any).assignedStudent)?.full_name || "")
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700">{(task.assigned_student || (task as any).assignedStudent)?.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{formatDate(task.deadline)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-1">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTableView;
