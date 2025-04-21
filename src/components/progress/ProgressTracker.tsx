import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { usePomodoroSessions, useTasks } from '../../hooks/useFirestore';
import { Timestamp } from 'firebase/firestore';

interface TaskWithStats {
  id: string;
  title: string;
  pomodorosCompleted: number;
  totalDuration: number;
  color: string;
}

const ProgressTracker: React.FC = () => {
  const { sessions, loading } = usePomodoroSessions();
  const { tasks } = useTasks();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [chartData, setChartData] = useState<Array<{ date: string; count: number }>>([]);
  const [taskStats, setTaskStats] = useState<TaskWithStats[]>([]);
  const [totalPomodoros, setTotalPomodoros] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);

  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981', 
    '#06B6D4', '#EF4444', '#F59E0B', '#84CC16', '#6366F1'
  ];

  useEffect(() => {
    if (loading || !sessions.length) return;

    // Calculate date range
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    if (timeRange === 'week') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
    } else {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29); // Last 30 days including today
    }
    
    // Filter sessions by date range and type
    const filteredSessions = sessions.filter(session => {
      const sessionDate = session.startTime.toDate();
      return sessionDate >= startDate && session.type === 'work';
    });
    
    // Calculate total stats
    setTotalPomodoros(filteredSessions.length);
    setTotalFocusTime(filteredSessions.reduce((sum, session) => sum + session.duration, 0));
    
    // Generate chart data
    const dateMap = new Map<string, number>();
    
    // Initialize all dates in range with 0 pomodoros
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dateMap.set(dateKey, 0);
    }
    
    // Count pomodoros per day
    filteredSessions.forEach(session => {
      const date = session.startTime.toDate();
      const dateKey = date.toISOString().split('T')[0];
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
    });
    
    // Convert map to array for chart
    const chartDataArray = Array.from(dateMap.entries()).map(([date, count]) => {
      const d = new Date(date);
      const formattedDate = timeRange === 'week' 
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return { date: formattedDate, count };
    });
    
    setChartData(chartDataArray);
    
    // Calculate stats by task
    const taskMap = new Map<string, TaskWithStats>();
    
    tasks.forEach((task, index) => {
      taskMap.set(task.id!, {
        id: task.id!,
        title: task.title,
        pomodorosCompleted: 0,
        totalDuration: 0,
        color: colors[index % colors.length]
      });
    });
    
    filteredSessions.forEach(session => {
      if (!taskMap.has(session.taskId)) return;
      
      const taskStat = taskMap.get(session.taskId)!;
      taskStat.pomodorosCompleted += 1;
      taskStat.totalDuration += session.duration;
    });
    
    // Convert to array and sort by count
    const taskStatsArray = Array.from(taskMap.values())
      .filter(stats => stats.pomodorosCompleted > 0)
      .sort((a, b) => b.pomodorosCompleted - a.pomodorosCompleted);
    
    setTaskStats(taskStatsArray);
    
  }, [sessions, tasks, timeRange, loading]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Progress Tracker</h2>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
          <button
            onClick={() => setTimeRange('week')}
            className={`py-1 px-3 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`py-1 px-3 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Month
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (!sessions.length || !chartData.length) ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No data available yet</p>
          <p className="mt-1">Complete some pomodoro sessions to see your progress</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 text-center"
            >
              <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">Total Pomodoros</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{totalPomodoros}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last {timeRange === 'week' ? '7' : '30'} days</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 text-center"
            >
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Total Focus Time</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{formatDuration(totalFocusTime)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last {timeRange === 'week' ? '7' : '30'} days</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-cyan-50 dark:bg-cyan-900/30 rounded-lg p-4 text-center"
            >
              <p className="text-cyan-600 dark:text-cyan-400 text-sm font-medium">Daily Average</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                {Math.round(totalPomodoros / (timeRange === 'week' ? 7 : 30) * 10) / 10}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pomodoros per day</p>
            </motion.div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Pomodoros by {timeRange === 'week' ? 'Day' : 'Date'}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    axisLine={{ stroke: '#e0e0e0' }} 
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Pomodoros" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {taskStats.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                Time Distribution by Task
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="pomodorosCompleted"
                      nameKey="title"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {taskStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [`${value} pomodoros`, name]}
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProgressTracker;