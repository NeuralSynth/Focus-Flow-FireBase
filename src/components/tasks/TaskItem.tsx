import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, GripVertical, Clock } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface Task {
  id?: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  pomodorosCompleted: number;
  userId: string;
  order: number;
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleComplete, onDelete, onEdit }) => {
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4 border-l-4 ${
        task.completed 
          ? 'border-green-500 dark:border-green-400' 
          : 'border-indigo-500 dark:border-indigo-400'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="cursor-move text-gray-400 dark:text-gray-500 mt-1">
          <GripVertical size={18} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleComplete(task.id!, !task.completed)}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
              />
              
              <div>
                <h3 className={`text-lg font-medium ${
                  task.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {task.title}
                </h3>
                
                {task.description && (
                  <p className={`mt-1 text-sm ${
                    task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {task.description}
                  </p>
                )}

                <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400 space-x-3">
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    {formatDate(task.updatedAt)}
                  </div>
                  
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                      {task.pomodorosCompleted} {task.pomodorosCompleted === 1 ? 'pomodoro' : 'pomodoros'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(task.id!)}
                className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(task.id!)}
                className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskItem;