import React from 'react';
import { motion } from 'framer-motion';
import PomodoroTimer from '../components/pomodoro/PomodoroTimer';
import TaskManager from '../components/tasks/TaskManager';

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-6 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <PomodoroTimer />
            </div>
            
            <div>
              <TaskManager />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;