import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useTasks, usePomodoroSessions, useUserSettings } from '../../hooks/useFirestore';
import TimerSettings from './TimerSettings';
import { Timestamp } from 'firebase/firestore';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const PomodoroTimer: React.FC = () => {
  const { tasks } = useTasks();
  const { addSession } = usePomodoroSessions();
  const { settings } = useUserSettings();
  
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs to track session timing
  const startTimeRef = useRef<Date | null>(null);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  // Set up initial timer based on mode
  useEffect(() => {
    let duration = 0;
    
    switch (mode) {
      case 'work':
        duration = settings.workDuration * 60;
        break;
      case 'shortBreak':
        duration = settings.shortBreakDuration * 60;
        break;
      case 'longBreak':
        duration = settings.longBreakDuration * 60;
        break;
    }
    
    setTimeLeft(duration);
  }, [mode, settings]);

  // Timer logic
  useEffect(() => {
    if (isActive) {
      timerIdRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Timer finished
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      // If we're starting a new timer, record the start time
      if (!startTimeRef.current) {
        startTimeRef.current = new Date();
      }
    } else if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }

    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
    };
  }, [isActive]);

  const handleTimerComplete = async () => {
    // Pause the timer
    setIsActive(false);
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }
    
    // Play notification sound
    const audio = new Audio('https://assets.coderrocketfuel.com/pomodoro-times-up.mp3');
    await audio.play().catch(e => console.log("Audio play failed:", e));
    
    // Record completed session if a task was selected
    if (mode === 'work' && selectedTaskId && startTimeRef.current) {
      const endTime = new Date();
      const durationInSeconds = Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 1000);
      
      await addSession({
        taskId: selectedTaskId,
        startTime: Timestamp.fromDate(startTimeRef.current),
        endTime: Timestamp.fromDate(endTime),
        duration: durationInSeconds,
        type: 'work'
      });
      
      // Increment completed pomodoros
      setCompletedPomodoros(prev => prev + 1);
    }
    
    // Reset start time
    startTimeRef.current = null;
    
    // Determine next timer mode
    if (mode === 'work') {
      // After work session, decide if it should be a short or long break
      if (completedPomodoros % settings.longBreakInterval === settings.longBreakInterval - 1) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      // After any break, go back to work mode
      setMode('work');
    }
  };

  const toggleTimer = () => {
    // Don't allow starting work timer without a selected task
    if (!isActive && mode === 'work' && !selectedTaskId) {
      alert('Please select a task before starting a work session');
      return;
    }
    
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }
    
    let duration = 0;
    switch (mode) {
      case 'work':
        duration = settings.workDuration * 60;
        break;
      case 'shortBreak':
        duration = settings.shortBreakDuration * 60;
        break;
      case 'longBreak':
        duration = settings.longBreakDuration * 60;
        break;
    }
    
    setTimeLeft(duration);
    startTimeRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage for the circular timer
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  
  let totalDuration = 0;
  switch (mode) {
    case 'work':
      totalDuration = settings.workDuration * 60;
      break;
    case 'shortBreak':
      totalDuration = settings.shortBreakDuration * 60;
      break;
    case 'longBreak':
      totalDuration = settings.longBreakDuration * 60;
      break;
  }
  
  const dashOffset = circumference * (1 - timeLeft / totalDuration);
  
  const getTimerColor = () => {
    switch (mode) {
      case 'work':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'shortBreak':
        return 'text-green-500 dark:text-green-400';
      case 'longBreak':
        return 'text-blue-500 dark:text-blue-400';
    }
  };

  const getProgressColor = () => {
    switch (mode) {
      case 'work':
        return 'stroke-indigo-600 dark:stroke-indigo-400';
      case 'shortBreak':
        return 'stroke-green-500 dark:stroke-green-400';
      case 'longBreak':
        return 'stroke-blue-500 dark:stroke-blue-400';
    }
  };

  const switchMode = (newMode: TimerMode) => {
    if (isActive) {
      if (window.confirm('Changing modes will reset the current timer. Continue?')) {
        setIsActive(false);
        if (timerIdRef.current) {
          clearInterval(timerIdRef.current);
        }
        setMode(newMode);
        startTimeRef.current = null;
      }
    } else {
      setMode(newMode);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pomodoro Timer</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          <Settings size={20} />
        </motion.button>
      </div>
      
      <div className="flex justify-center mb-4">
        <div className="w-full max-w-xs">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
            <button
              onClick={() => switchMode('work')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'work'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Work
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'shortBreak'
                  ? 'bg-white dark:bg-gray-600 text-green-500 dark:text-green-400 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Short Break
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'longBreak'
                  ? 'bg-white dark:bg-gray-600 text-blue-500 dark:text-blue-400 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Long Break
            </button>
          </div>
        </div>
      </div>

      {mode === 'work' && (
        <div className="mb-6">
          <label htmlFor="task-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select a task:
          </label>
          <select
            id="task-select"
            value={selectedTaskId || ''}
            onChange={e => setSelectedTaskId(e.target.value || null)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isActive}
          >
            <option value="">-- Select a task --</option>
            {tasks
              .filter(task => !task.completed)
              .map(task => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
          </select>
        </div>
      )}
      
      <div className="relative flex justify-center items-center py-4">
        <svg width="280" height="280" viewBox="0 0 280 280" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={`${getProgressColor()} transition-all duration-1000 ease-in-out`}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-6xl font-bold ${getTimerColor()}`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            {mode === 'work' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </span>
        </div>
      </div>
      
      <div className="flex justify-center space-x-4 mt-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className={`p-4 rounded-full shadow-md focus:outline-none ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isActive ? <Pause size={24} /> : <Play size={24} />}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetTimer}
          className="p-4 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 shadow-md focus:outline-none"
          disabled={isActive && timeLeft > 0}
        >
          <RotateCcw size={24} />
        </motion.button>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Completed today: <span className="font-semibold">{completedPomodoros}</span> pomodoros</p>
      </div>

      {showSettings && (
        <TimerSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default PomodoroTimer;