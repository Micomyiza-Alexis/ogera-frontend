import { useState } from 'react';
import type { FC } from 'react';

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import type { DragEndEvent } from '@dnd-kit/core';
import type { Task, TasksState } from '@/types/task.types';

import TaskColumn from './TaskColumn';
import TaskModal from './TaskModal';
interface TaskBoardProps {
  tasks: TasksState;
  onMoveTask: (taskId: string, fromStatus: string, toStatus: string) => void;
  onOpenCreateTask?: () => void;
}

const TaskBoard: FC<TaskBoardProps> = ({ tasks, onMoveTask, onOpenCreateTask }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Find which column the task came from
    let fromStatus = '';
    let taskId = '';

    // Check in all columns to find the task
    (Object.keys(tasks) as Array<keyof TasksState>).forEach((status) => {
      const task = tasks[status].find((t) => t.id === active.id);
      if (task) {
        fromStatus = status;
        taskId = task.id;
      }
    });

    const toStatus = over.id as string;

    if (fromStatus && fromStatus !== toStatus) {
      onMoveTask(taskId, fromStatus, toStatus);
    }
  };

  const handleCardClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleAddTask = (columnId: string) => {
    if (onOpenCreateTask) {
      onOpenCreateTask();
    }
  };

  const tabs = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-400' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-400' },
    { id: 'done', title: 'Done', color: 'bg-green-400' },
  ];

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-auto">
          {/* Columns Container */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-max lg:auto-rows-fr">
            {tabs.map((column) => (
              <TaskColumn
                key={column.id}
                columnId={column.id}
                columnTitle={column.title}
                columnColor={column.color}
                tasks={tasks[column.id as keyof TasksState] || []}
                onCardClick={handleCardClick}
                onAddTask={() => handleAddTask(column.id)}
              />
            ))}
          </div>
        </div>
      </DndContext>

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
      />
    </>
  );
};

export default TaskBoard;
