import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../services/taskService';
import { useAuth } from '../context/AuthContext';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const StatusColors: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800'
};

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onDelete, 
  onAssign,
  onStatusChange
}) => {
  const { isAdmin, user } = useAuth();
  const [previousStatus, setPreviousStatus] = useState<TaskStatus>(task.status);
  const [isStatusChanged, setIsStatusChanged] = useState(false);
  
  // Track status changes for animation
  useEffect(() => {
    if (task.status !== previousStatus) {
      setPreviousStatus(task.status);
      setIsStatusChanged(true);
      
      // Reset the animation flag after animation completes
      const timer = setTimeout(() => {
        setIsStatusChanged(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [task.status, previousStatus]);
  
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      
      // Check if it's today
      const today = new Date();
      const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth() && 
                      date.getFullYear() === today.getFullYear();
      
      if (isToday) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // Check if it's yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.getDate() === yesterday.getDate() && 
                          date.getMonth() === yesterday.getMonth() && 
                          date.getFullYear() === yesterday.getFullYear();
      
      if (isYesterday) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // Otherwise format with date and time
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(task.id, e.target.value as TaskStatus);
  };

  const getRelativeTime = (dateString: string | Date) => {
    if (!dateString) return '';
    
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return 'just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      }
    } catch (error) {
      return '';
    }
  };

  return (
    <div className={`border rounded-lg shadow-sm p-4 bg-white transition-all duration-500 ${isStatusChanged ? 'scale-105 shadow-md' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold">{task.title || 'Untitled Task'}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${StatusColors[task.status] || 'bg-gray-100'} ${isStatusChanged ? 'animate-pulse' : ''}`}>
          {task.status ? task.status.replace('_', ' ') : 'Unknown'}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4">{task.description || 'No description'}</p>
      
      <div className="text-sm text-gray-500 mb-4">
        <div className="flex justify-between">
          <span>Created:</span>
          <span title={formatDate(task.createdAt)}>{getRelativeTime(task.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Updated:</span>
          <span title={formatDate(task.updatedAt)}>{getRelativeTime(task.updatedAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Assigned to:</span>
          <span>{task.assignedToEmail || 'Not assigned'}</span>
        </div>
      </div>

      {/* Status change dropdown - available to all users */}
      <div className="mb-3">
        <label htmlFor={`status-${task.id}`} className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id={`status-${task.id}`}
          value={task.status}
          onChange={handleStatusChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={() => onEdit(task)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Edit
        </button>
        
        {isAdmin && (
          <>
            <button
              onClick={() => onAssign(task.id)}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
            >
              Assign
            </button>
            
            <button
              onClick={() => onDelete(task.id)}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskCard; 