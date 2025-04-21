import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Play } from 'lucide-react';
import { usePomodoroSessions, useTasks } from '../../hooks/useFirestore';
import { Timestamp } from 'firebase/firestore';

interface TaskMap {
  [key: string]: {
    title: string;
    description?: string;
  };
}

const TaskHistory: React.FC = () => {
  const { sessions, loading } = usePomodoroSessions();
  const { tasks } = useTasks();
  const [taskMap, setTaskMap] = useState<TaskMap>({});
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('today');

  useEffect(() => {
    // Build task map for lookup
    const map: TaskMap = {};
    tasks.forEach(task => {
      map[task.id!] = {
        title: task.title,
        description: task.description
      };
    });
    setTaskMap(map);
  }, [tasks]);

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getFilteredSessions = () => {
    if (!sessions.length) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    switch (filter) {
      case 'today':
        return sessions.filter(session => {
          const sessionDate = session.startTime.toDate();
          return sessionDate >= today;
        });
      case 'week':
        return sessions.filter(session => {
          const sessionDate = session.startTime.toDate();
          return sessionDate >= weekAgo;
        });
      case 'month':
        return sessions.filter(session => {
          const sessionDate = session.startTime.toDate();
          return sessionDate >= monthAgo;
        });
      default:
        return sessions;
    }
  };

  const filteredSessions = getFilteredSessions();
  
  // Group sessions by day
  const sessionsByDay: { [key: string]: typeof sessions } = {};
  filteredSessions.forEach(session => {
    const date = session.startTime.toDate();
    const dayKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    
    if (!sessionsByDay[dayKey]) {
      sessionsByDay[dayKey] = [];
    }
    
    sessionsByDay[dayKey].push(session);
  });
  
  // Sort days (most recent first)
  const sortedDays = Object.keys(sessionsByDay).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pomodoro History</h2>
      </div>
      
      <div className="mb-6">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
          <button
            onClick={() => setFilter('today')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === 'today'
                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === 'week'
                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === 'month'
                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Time
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No sessions recorded yet</p>
          <p className="mt-1">Complete some pomodoro sessions to see them here</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDays.map((dayKey) => {
            const date = new Date(dayKey);
            const formattedDate = new Intl.DateTimeFormat('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            }).format(date);
            
            const daySessions = sessionsByDay[dayKey];
            const workSessions = daySessions.filter(s => s.type === 'work');
            const totalWorkTime = workSessions.reduce((sum, s) => sum + s.duration, 0);
            const totalPomodoros = workSessions.length;
            
            return (
              <div key={dayKey}>
                <div className="flex items-center mb-3">
                  <Calendar size={18} className="text-indigo-500 dark:text-indigo-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{formattedDate}</h3>
                </div>
                
                <div className="mb-4 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <div className="flex flex-wrap gap-4 justify-between">
                    <div className="flex items-center">
                      <Clock size={16} className="text-indigo-600 dark:text-indigo-400 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Total Focus Time: <span className="font-medium">{Math.floor(totalWorkTime / 60)} minutes</span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Play size={16} className="text-indigo-600 dark:text-indigo-400 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Completed: <span className="font-medium">{totalPomodoros} pomodoros</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {daySessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`p-4 rounded-lg border-l-4 ${
                        session.type === 'work'
                          ? 'bg-white dark:bg-gray-700 border-indigo-500 dark:border-indigo-400'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-green-500 dark:border-green-400'
                      }`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {taskMap[session.taskId]?.title || 'Unknown Task'}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {session.type === 'work' ? 'Work Session' : 'Break Session'} • {formatDuration(session.duration)}
                          </p>
                        </div>
                        <div className="text-sm text-right text-gray-500 dark:text-gray-400">
                          {formatDate(session.startTime)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskHistory;