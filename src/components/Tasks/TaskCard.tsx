import type { FC } from 'react';
import type { Task } from '@/types/task.types';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
  onCardClick: (task: Task) => void;
}

const TaskCard: FC<TaskCardProps> = ({ task, onCardClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-100 text-gray-700';
      case 'In Progress':
      case 'Submitted':
      case 'In Review':
        return 'bg-orange-100 text-orange-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'high':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onCardClick(task)}
      className="group cursor-grab active:cursor-grabbing rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
    >
      {/* Status Badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.statusLabel || '')}`}>
          {task.statusLabel}
        </span>
        <div className="h-2 w-2 rounded-full bg-gray-300 opacity-0 group-hover:opacity-100" />
      </div>

      {/* Title */}
      <h3 className="mb-2 font-bold text-gray-900 line-clamp-2">{task.title}</h3>

      {/* Description */}
      <p className="mb-3 text-sm text-gray-600 line-clamp-2">{task.description}</p>

      {/* Assignees */}
      <div className="mb-3 flex -space-x-2">
        {task.assignees.slice(0, 3).map((assignee) => (
          <div
            key={assignee.id}
            title={assignee.name}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white"
          >
            {assignee.name.charAt(0)}
          </div>
        ))}
        {task.assignees.length > 3 && (
          <div className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-bold text-gray-600">
            +{task.assignees.length - 3}
          </div>
        )}
      </div>

      {/* Due Date and Priority */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500">📅 {task.dueDate}</span>
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${(task.progress.completed / task.progress.total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 font-medium">{task.progress.completed}/{task.progress.total}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex gap-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            💬 {task.comments}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            🔗 {task.links}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
