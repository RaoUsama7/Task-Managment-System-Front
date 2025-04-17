'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import taskService, { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  AssignTaskRequest,
  TaskListParams
} from '../services/taskService';
import websocketService, { WebSocketEvent, WebSocketEventData } from '../services/websocketService';
import { useAuth } from './AuthContext';

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  createTask: (taskData: CreateTaskRequest) => Promise<Task>;
  updateTask: (id: string, taskData: UpdateTaskRequest) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  assignTask: (id: string, assignData: AssignTaskRequest) => Promise<Task>;
  fetchTasks: (params?: TaskListParams) => Promise<void>;
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
      const handleTaskEvent = (data: WebSocketEventData) => {
        if (!data || !data.task) {
          console.error(`TaskContext: Received invalid WebSocket event data:`, data);
          return;
        }
        
        const task = data.task;
        console.log(`TaskContext: Received WebSocket event for task:`, task);
        
        setTasks(prevTasks => {
          // Check if the task already exists in the array
          const index = prevTasks.findIndex(t => t.id === task.id);
          
          if (index !== -1) {
            // Update existing task
            console.log(`TaskContext: Updating existing task with ID ${task.id}`);
            const newTasks = [...prevTasks];
            newTasks[index] = {
              ...newTasks[index],
              ...task,
              updatedAt: new Date()
            };
            return newTasks;
          } else {
            // Add new task
            console.log(`TaskContext: Adding new task with ID ${task.id}`);
            return [...prevTasks, task];
          }
        });
      };
      
      const handleTaskStatusUpdate = (data: WebSocketEventData) => {
        if (!data || !data.taskId || !data.status) {
          console.error(`TaskContext: Received invalid taskStatusUpdated data:`, data);
          return;
        }
        
        console.log(`TaskContext: Received status update for task ${data.taskId}: ${data.status}`);
        
        setTasks(prevTasks => {
          // Find the task with the matching ID
          const index = prevTasks.findIndex(t => t.id === data.taskId);
          
          if (index !== -1) {
            // Update the task status
            console.log(`TaskContext: Updating status of task with ID ${data.taskId}`);
            const newTasks = [...prevTasks];
            newTasks[index] = {
              ...newTasks[index],
              status: data.status as TaskStatus,
              updatedAt: new Date()
            };
            return newTasks;
          }
          
          return prevTasks;
        });
      };

      // Register WebSocket event handlers
      const events: WebSocketEvent[] = ['taskCreated', 'taskUpdated', 'taskAssigned'];
      console.log('TaskContext: Registering WebSocket event handlers for:', events.join(', '));
      
      const unsubscribers = events.map(event => {
        console.log(`TaskContext: Setting up listener for ${event} events`);
        return websocketService.on(event, handleTaskEvent);
      });
      
      // Register the status update handler separately
      console.log('TaskContext: Setting up listener for taskStatusUpdated events');
      const unsubscribeStatusUpdated = websocketService.on('taskStatusUpdated', handleTaskStatusUpdate);

      // Clean up event listeners
      return () => {
        console.log('TaskContext: Cleaning up WebSocket event handlers');
        unsubscribers.forEach(unsubscribe => unsubscribe());
        unsubscribeStatusUpdated();
      };
    }
  }, [isAuthenticated]);

  const fetchTasks = async (params?: TaskListParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await taskService.getAllTasks(params);
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
      // Only add the task if it has a valid ID
      if (newTask && newTask.id) {
        setTasks(prevTasks => [...prevTasks, newTask]);
      } else {
        console.error('Created task has no ID:', newTask);
        setError('Task created but has invalid data. Please refresh.');
      }
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
      
      // Update the tasks in the local state
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === id ? {...task, ...updatedTask} : task)
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
      
      if (updatedTask && updatedTask.id) {
        setTasks(prevTasks => 
          prevTasks.map(task => task.id === id ? updatedTask : task)
        );
        return updatedTask;
      } else {
        console.error('Updated task has invalid data:', updatedTask);
        setError('Task update failed with invalid data. Please refresh.');
        throw new Error('Invalid task data received from server');
      }
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