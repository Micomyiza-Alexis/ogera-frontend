import type { Task, TasksState } from '@/types/task.types';
/**
 * Transform API task data to TasksState format
 * This bridges between your existing API format and the Kanban board component
 */
export const transformTasksToKanban = (apiTasks: any[]): TasksState => {
  const kanbanTasks: TasksState = {
    todo: [],
    'in-progress': [],
    done: [],
  };

  // Map API status to Kanban status
  const statusMap: Record<string, keyof TasksState> = {
    'NOT_STARTED': 'todo',
    'IN_PROGRESS': 'in-progress',
    'SUBMITTED': 'in-progress',
    'UNDER_REVIEW': 'in-progress',
    'COMPLETED': 'done',
    'REJECTED': 'todo',
    'DISPUTED': 'in-progress',
  };

  // Map API status to display label
  const statusLabelMap: Record<string, string> = {
    'NOT_STARTED': 'Not Started',
    'IN_PROGRESS': 'In Progress',
    'SUBMITTED': 'Submitted',
    'UNDER_REVIEW': 'In Review',
    'COMPLETED': 'Completed',
    'REJECTED': 'Rejected',
    'DISPUTED': 'Disputed',
  };

  apiTasks.forEach((apiTask: any) => {
    const kanbanStatus = statusMap[apiTask.status] || 'todo';
    const assignedStudent = apiTask.assignedStudent || apiTask.assigned_student;
    const assignedName = assignedStudent?.full_name || assignedStudent?.name;
    const task: Task = {
      id: apiTask.task_id || apiTask.id,
      title: apiTask.title,
      description: apiTask.description || 'No description provided',
      status: kanbanStatus as any,
      statusLabel: statusLabelMap[apiTask.status] || 'Not Started',
      priority: determinePriority(apiTask),
      dueDate: formatDate(apiTask.deadline),
      assignees: [
        {
          id: apiTask.assigned_student_id || '0',
          name: assignedName || 'Unassigned',
          avatar: assignedStudent?.avatar,
        },
      ],
      comments: apiTask.comments_count || 0,
      links: apiTask.links_count || 0,
      progress: {
        completed: apiTask.status === 'COMPLETED' ? 1 : 0,
        total: 1,
      },
    };

    kanbanTasks[kanbanStatus].push(task);
  });

  return kanbanTasks;
};

/**
 * Determine priority based on payment amount or deadline
 */
const determinePriority = (task: any): 'low' | 'medium' | 'high' => {
  if (!task.payment_amount && !task.deadline) return 'low';
  if (task.payment_amount && task.payment_amount > 5000) return 'high';
  if (isDeadlineSoon(task.deadline)) return 'high';
  return 'medium';
};

/**
 * Check if deadline is within 7 days
 */
const isDeadlineSoon = (deadline: string | null): boolean => {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const daysUntilDeadline = Math.ceil(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilDeadline <= 7;
};

/**
 * Format date for display
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'No due date';
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Transform Kanban status back to API format
 */
export const transformKanbanStatusToAPI = (kanbanStatus: string): string => {
  const reverseMap: Record<string, string> = {
    'todo': 'NOT_STARTED',
    'in-progress': 'IN_PROGRESS',
    'done': 'COMPLETED',
  };
  return reverseMap[kanbanStatus] || 'NOT_STARTED';
};
