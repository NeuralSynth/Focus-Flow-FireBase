import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus } from 'lucide-react';
import { useTasks } from '../../hooks/useFirestore';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';

const TaskManager: React.FC = () => {
  const { tasks, loading, error, addTask, updateTask, deleteTask, reorderTasks } = useTasks();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    
    if (startIndex === endIndex) return;
    
    const filteredTasks = getFilteredTasks();
    const reordered = Array.from(filteredTasks);
    const [removed] = reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, removed);
    
    // Map the reordering back to the full task list
    let allTasks = [...tasks];
    
    // First, get the tasks that weren't in the filtered view
    const nonFilteredTasks = tasks.filter(task => {
      return !filteredTasks.some(filteredTask => filteredTask.id === task.id);
    });
    
    // Then merge the reordered filtered tasks and the non-filtered tasks
    // Preserving the original order for non-filtered tasks
    allTasks = [...reordered, ...nonFilteredTasks].sort((a, b) => a.order - b.order);
    
    // Update the order property based on new positions
    const updatedTasks = allTasks.map((task, index) => ({
      ...task,
      order: index
    }));
    
    reorderTasks(updatedTasks);
  };

  const getFilteredTasks = () => {
    switch (filter) {
      case 'active':
        return tasks.filter(task => !task.completed);
      case 'completed':
        return tasks.filter(task => task.completed);
      default:
        return tasks;
    }
  };

  const handleToggleComplete = (taskId: string, isCompleted: boolean) => {
    updateTask(taskId, { completed: isCompleted });
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  const handleAddTask = (title: string, description: string = '') => {
    addTask({ title, description, completed: false, pomodorosCompleted: 0 });
    setShowAddForm(false);
  };

  const handleUpdateTask = (taskId: string, title: string, description: string = '') => {
    updateTask(taskId, { title, description });
    setEditingTaskId(null);
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Task Manager</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md focus:outline-none flex items-center space-x-1"
        >
          <Plus size={18} />
          <span className="hidden sm:inline ml-1">Add Task</span>
        </motion.button>
      </div>
      
      <div className="mb-4">
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-4 font-medium text-sm transition-colors ${
              filter === 'all'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`py-2 px-4 font-medium text-sm transition-colors ${
              filter === 'active'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`py-2 px-4 font-medium text-sm transition-colors ${
              filter === 'completed'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md">
          {error}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          {filter === 'all' ? (
            <>
              <p className="text-lg font-medium">No tasks yet</p>
              <p className="mt-1">Start by adding a new task</p>
            </>
          ) : filter === 'active' ? (
            <p className="text-lg font-medium">No active tasks</p>
          ) : (
            <p className="text-lg font-medium">No completed tasks</p>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                <AnimatePresence>
                  {filteredTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id!} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          {editingTaskId === task.id ? (
                            <TaskForm
                              initialTitle={task.title}
                              initialDescription={task.description || ''}
                              onSubmit={(title, description) => handleUpdateTask(task.id!, title, description)}
                              onCancel={() => setEditingTaskId(null)}
                            />
                          ) : (
                            <motion.li
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <TaskItem
                                task={task}
                                onToggleComplete={handleToggleComplete}
                                onDelete={handleDeleteTask}
                                onEdit={handleEditTask}
                              />
                            </motion.li>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                </AnimatePresence>
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}
      
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <TaskForm
              onSubmit={handleAddTask}
              onCancel={() => setShowAddForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskManager;