import type { FC } from 'react';
import type { Task } from '@/types/task.types';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskModal: FC<TaskModalProps> = ({ task, isOpen, onClose }) => {
  if (!isOpen || !task) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-100 text-gray-700';
      case 'In Research':
        return 'bg-orange-100 text-orange-700';
      case 'On Track':
        return 'bg-purple-100 text-purple-700';
      case 'Complete':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors duration-200 z-10"
          >
            <span className="text-lg">✕</span>
          </button>

          {/* Modal Content */}
          <div className="p-6 sm:p-8">
            {/* Status Badge */}
            <div className="mb-4 flex items-center gap-3">
              <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(task.statusLabel || '')}`}>
                {task.statusLabel}
              </span>
              <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold capitalize border ${getPriorityColor(task.priority)}`}>
                {task.priority} Priority
              </span>
            </div>

            {/* Title */}
            <h1 className="mb-3 text-3xl font-bold text-gray-900">{task.title}</h1>

            {/* Description */}
            <p className="mb-6 text-lg text-gray-600">{task.description}</p>

            {/* Details Grid */}
            <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
              {/* Due Date */}
              <div>
                <p className="text-sm font-medium text-gray-500">Due Date</p>
                <p className="mt-1 text-base font-semibold text-gray-900">📅 {task.dueDate}</p>
              </div>

              {/* Progress */}
              <div>
                <p className="text-sm font-medium text-gray-500">Progress</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {task.progress.completed}/{task.progress.total}
                </p>
              </div>

              {/* Comments */}
              <div>
                <p className="text-sm font-medium text-gray-500">Comments</p>
                <p className="mt-1 text-base font-semibold text-gray-900">💬 {task.comments}</p>
              </div>

              {/* Links */}
              <div>
                <p className="text-sm font-medium text-gray-500">Links</p>
                <p className="mt-1 text-base font-semibold text-gray-900">🔗 {task.links}</p>
              </div>
            </div>

            {/* Assignees Section */}
            <div className="mb-8">
              <p className="mb-3 text-sm font-medium text-gray-500">Assignees</p>
              <div className="flex flex-wrap gap-2">
                {task.assignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 border border-blue-200"
                  >
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white">
                      {assignee.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{assignee.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <p className="mb-3 text-sm font-medium text-gray-500">Completion Progress</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${(task.progress.completed / task.progress.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {Math.round((task.progress.completed / task.progress.total) * 100)}%
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-gray-200 pt-6">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Close
              </button>
              <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 transition-colors duration-200">
                Edit Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskModal;
