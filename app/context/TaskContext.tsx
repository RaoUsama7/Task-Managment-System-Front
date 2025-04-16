'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import taskService, { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  AssignTaskRequest 
} from '../services/taskService';
import websocketService, { WebSocketEvent } from '../services/websocketService';
import { useAuth } from './AuthContext';

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  createTask: (taskData: CreateTaskRequest) => Promise<Task>;
  updateTask: (id: string, taskData: UpdateTaskRequest) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  assignTask: (id: string, assignData: AssignTaskRequest) => Promise<Task>;
  fetchTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Fetch tasks on initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated]);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (isAuthenticated) {
      const handleTaskEvent = (task: Task) => {
        setTasks(prevTasks => {
          // Check if the task already exists in the array
          const index = prevTasks.findIndex(t => t.id === task.id);
          
          if (index !== -1) {
            // Update existing task
            const newTasks = [...prevTasks];
            newTasks[index] = task;
            return newTasks;
          } else {
            // Add new task
            return [...prevTasks, task];
          }
        });
      };

      // Register WebSocket event handlers
      const events: WebSocketEvent[] = ['taskCreated', 'taskUpdated', 'taskAssigned'];
      const unsubscribers = events.map(event => 
        websocketService.on(event, handleTaskEvent)
      );

      // Clean up event listeners
      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    }
  }, [isAuthenticated]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await taskService.getAllTasks();
      setTasks(data);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async (taskData: CreateTaskRequest) => {
    try {
      const newTask = await taskService.createTask(taskData);
      setTasks(prevTasks => [...prevTasks, newTask]);
      return newTask;
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
      throw err;
    }
  };

  const updateTask = async (id: string, taskData: UpdateTaskRequest) => {
    try {
      const updatedTask = await taskService.updateTask(id, taskData);
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === id ? updatedTask : task)
      );
      return updatedTask;
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  const assignTask = async (id: string, assignData: AssignTaskRequest) => {
    try {
      const updatedTask = await taskService.assignTask(id, assignData);
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === id ? updatedTask : task)
      );
      return updatedTask;
    } catch (err) {
      setError('Failed to assign task');
      console.error('Error assigning task:', err);
      throw err;
    }
  };

  const value = {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    fetchTasks
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export default TaskContext; 