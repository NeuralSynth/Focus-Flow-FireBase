import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

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

interface PomodoroSession {
  id?: string;
  taskId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  duration: number;
  type: 'work' | 'break';
  userId: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchTasks = async () => {
    if (!currentUser) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const tasksQuery = query(
        collection(db, 'tasks'), 
        where('userId', '==', currentUser.uid),
        orderBy('order')
      );
      
      const querySnapshot = await getDocs(tasksQuery);
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      
      setTasks(tasksData);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'order'>) => {
    if (!currentUser) return null;

    try {
      // Get the highest order to place new task at the end
      const highestOrder = tasks.length > 0 
        ? Math.max(...tasks.map(task => task.order)) 
        : -1;
      
      const newTask = {
        ...taskData,
        completed: false,
        pomodorosCompleted: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: currentUser.uid,
        order: highestOrder + 1
      };
      
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      const taskWithId = { ...newTask, id: docRef.id };
      setTasks([...tasks, taskWithId]);
      return taskWithId;
    } catch (err) {
      setError('Failed to add task');
      console.error(err);
      return null;
    }
  };

  const updateTask = async (id: string, taskData: Partial<Task>) => {
    if (!currentUser) return false;

    try {
      const taskRef = doc(db, 'tasks', id);
      const updatedTask = {
        ...taskData,
        updatedAt: Timestamp.now(),
      };
      
      await updateDoc(taskRef, updatedTask);
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, ...updatedTask } : task
      ));
      return true;
    } catch (err) {
      setError('Failed to update task');
      console.error(err);
      return false;
    }
  };

  const deleteTask = async (id: string) => {
    if (!currentUser) return false;

    try {
      await deleteDoc(doc(db, 'tasks', id));
      setTasks(tasks.filter(task => task.id !== id));
      return true;
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
      return false;
    }
  };

  const reorderTasks = async (reorderedTasks: Task[]) => {
    if (!currentUser) return false;

    try {
      // Update tasks with new order values
      const updatedTasks = reorderedTasks.map((task, index) => ({
        ...task,
        order: index
      }));

      // Update Firestore documents
      const updatePromises = updatedTasks.map(task => 
        updateDoc(doc(db, 'tasks', task.id!), { order: task.order, updatedAt: Timestamp.now() })
      );
      
      await Promise.all(updatePromises);
      setTasks(updatedTasks);
      return true;
    } catch (err) {
      setError('Failed to reorder tasks');
      console.error(err);
      return false;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentUser]);

  return { 
    tasks, 
    loading, 
    error, 
    addTask, 
    updateTask, 
    deleteTask,
    reorderTasks,
    refreshTasks: fetchTasks
  };
};

export const usePomodoroSessions = () => {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchSessions = async () => {
    if (!currentUser) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const sessionsQuery = query(
        collection(db, 'pomodoroSessions'), 
        where('userId', '==', currentUser.uid),
        orderBy('startTime', 'desc')
      );
      
      const querySnapshot = await getDocs(sessionsQuery);
      const sessionsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PomodoroSession[];
      
      setSessions(sessionsData);
    } catch (err) {
      setError('Failed to fetch pomodoro sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addSession = async (sessionData: Omit<PomodoroSession, 'id' | 'userId'>) => {
    if (!currentUser) return null;

    try {
      const newSession = {
        ...sessionData,
        userId: currentUser.uid,
      };
      
      const docRef = await addDoc(collection(db, 'pomodoroSessions'), newSession);
      const sessionWithId = { ...newSession, id: docRef.id };
      setSessions([sessionWithId, ...sessions]);
      
      // Update task's pomodorosCompleted counter
      if (sessionData.type === 'work') {
        const taskRef = doc(db, 'tasks', sessionData.taskId);
        const taskDoc = await getDoc(taskRef);
        
        if (taskDoc.exists()) {
          const taskData = taskDoc.data() as Task;
          await updateDoc(taskRef, { 
            pomodorosCompleted: (taskData.pomodorosCompleted || 0) + 1,
            updatedAt: Timestamp.now()
          });
        }
      }
      
      return sessionWithId;
    } catch (err) {
      setError('Failed to add pomodoro session');
      console.error(err);
      return null;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentUser]);

  return { 
    sessions, 
    loading, 
    error, 
    addSession,
    refreshSessions: fetchSessions
  };
};

export const useUserSettings = () => {
  const [settings, setSettings] = useState<{
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number;
  }>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchSettings = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const settingsRef = doc(db, 'userSettings', currentUser.uid);
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        setSettings(docSnap.data() as typeof settings);
      } else {
        // Default settings are already in state
        // but we should create the document for the user
        await updateSettings(settings);
      }
    } catch (err) {
      setError('Failed to fetch user settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: typeof settings) => {
    if (!currentUser) return false;

    try {
      const settingsRef = doc(db, 'userSettings', currentUser.uid);
      await updateDoc(settingsRef, newSettings);
      setSettings(newSettings);
      return true;
    } catch (err) {
      // If doc doesn't exist yet, try to create it
      try {
        const settingsRef = doc(db, 'userSettings', currentUser.uid);
        await addDoc(collection(db, 'userSettings'), {
          ...newSettings,
          userId: currentUser.uid
        });
        setSettings(newSettings);
        return true;
      } catch (createErr) {
        setError('Failed to update user settings');
        console.error(createErr);
        return false;
      }
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [currentUser]);

  return { 
    settings, 
    loading, 
    error, 
    updateSettings
  };
};