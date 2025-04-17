import React, { useState, useEffect } from 'react';
import websocketService, { WebSocketEventData } from '../services/websocketService';
import { Task, TaskStatus } from '../services/taskService';
import { useAuth } from '../context/AuthContext';

interface TaskNotification {
  id: string;
  type: 'create' | 'update' | 'assign' | 'status';
  task: Task;
  message?: string;
  timestamp: Date;
  seen: boolean;
}

// Toast notification component
const Toast = ({ message, type }: { message: string, type: string }) => {
  const getBgColor = (type: string) => {
    switch (type) {
      case 'create':
        return 'bg-green-500';
      case 'update':
        return 'bg-blue-500';
      case 'assign':
        return 'bg-yellow-500';
      case 'status':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`${getBgColor(type)} text-white p-4 rounded-md shadow-lg mb-4 fixed bottom-4 right-4 z-50 animate-slide-up`}
    >
      <p>{message}</p>
    </div>
  );
};

const TaskNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [toast, setToast] = useState<{ message: string, type: string } | null>(null);
  const [toastTimeout, setToastTimeout] = useState<NodeJS.Timeout | null>(null);
  const { isAuthenticated, user, isAdmin } = useAuth();

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => {
        setToast(null);
      }, 5000);
      
      setToastTimeout(timeout);
      
      return () => {
        if (toastTimeout) {
          clearTimeout(toastTimeout);
        }
      };
    }
  }, [toast]);

  // Listen for WebSocket events and create notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleTaskCreated = (data: WebSocketEventData) => {
      if (!data || !data.task) {
        console.error("Invalid data received for taskCreated event:", data);
        return;
      }

      const { task, message, createdBy } = data;
      const notificationMessage = message || `New task created${createdBy ? ` by ${createdBy}` : ''}: ${task.title}`;
      
      addNotification('create', task, notificationMessage);
      showToast(notificationMessage, 'create');
    };

    const handleTaskUpdated = (data: WebSocketEventData) => {
      if (!data || !data.task) {
        console.error("Invalid data received for taskUpdated event:", data);
        return;
      }
      
      const { task, message, updatedBy } = data;
      const statusUpdate = task.status ? ` (${task.status.replace('_', ' ')})` : '';
      const notificationMessage = message || `Task updated${updatedBy ? ` by ${updatedBy}` : ''}: ${task.title}${statusUpdate}`;
      
      console.log(`TaskNotifications: Received update for task ${task.id}. Is admin: ${isAdmin}`);
      addNotification('update', task, notificationMessage);
      
      // Show toast if admin or if assigned to current user
      if (isAdmin || task.assignedUserId === user.id || task.assignedToEmail === user.email) {
        console.log(`TaskNotifications: Showing toast notification for task update to ${user.email}`);
        showToast(notificationMessage, 'update');
      }
    };

    const handleTaskAssigned = (data: WebSocketEventData) => {
      if (!data || !data.task) {
        console.error("Invalid data received for taskAssigned event:", data);
        return;
      }

      const { task, message } = data;
      const notificationMessage = message || `Task assigned to ${task.assignedToEmail || 'you'}: ${task.title}`;
      
      addNotification('assign', task, notificationMessage);
      
      // Show toast if admin or if assigned to current user
      if (isAdmin || task.assignedUserId === user.id || task.assignedToEmail === user.email) {
        console.log(`TaskNotifications: Showing toast notification for task update to ${user.email}`);
        showToast(notificationMessage, 'assign');
      }
    };

    const handleTaskStatusUpdated = (data: WebSocketEventData) => {
      if (!data || !data.taskId || !data.status || !data.task) {
        console.error("Invalid data received for taskStatusUpdated event:", data);
        return;
      }

      const { task, taskId, status, updatedBy } = data;
      const formattedStatus = status.replace('_', ' ');
      const notificationMessage = `Task status changed${updatedBy ? ` by ${updatedBy}` : ''}: "${task.title}" → ${formattedStatus}`;
      
      console.log(`TaskNotifications: Received status update for task ${taskId}: ${status}`);
      addNotification('status', task, notificationMessage);
      
      // Show toast for status updates to everyone (admins see all, users only see their own)
      if (isAdmin || task.assignedUserId === user.id || task.assignedToEmail === user.email) {
        showToast(notificationMessage, 'status');
      }
    };

    const addNotification = (type: 'create' | 'update' | 'assign' | 'status', task: Task, message?: string) => {
      const notification: TaskNotification = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        task,
        message,
        timestamp: new Date(),
        seen: false
      };

      setNotifications(prev => [notification, ...prev].slice(0, 10));
      setUnseenCount(count => count + 1);
    };
    
    const showToast = (message: string, type: string) => {
      console.log(`TaskNotifications: Showing toast - ${type}: ${message}`);
      
      // Clear any existing timeout
      if (toastTimeout) {
        clearTimeout(toastTimeout);
        setToastTimeout(null);
      }
      
      setToast({ message, type });
    };

    // Register WebSocket event handlers
    const unsubscribeCreate = websocketService.on('taskCreated', handleTaskCreated);
    const unsubscribeUpdate = websocketService.on('taskUpdated', handleTaskUpdated);
    const unsubscribeAssign = websocketService.on('taskAssigned', handleTaskAssigned);
    const unsubscribeStatusUpdate = websocketService.on('taskStatusUpdated', handleTaskStatusUpdated);

    return () => {
      unsubscribeCreate();
      unsubscribeUpdate();
      unsubscribeAssign();
      unsubscribeStatusUpdate();
    };
  }, [isAuthenticated, user, isAdmin, toastTimeout]);

  const markAllAsSeen = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, seen: true }))
    );
    setUnseenCount(0);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      markAllAsSeen();
    }
  };
  
  const closeToast = () => {
    setToast(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  const formatStatusText = (status?: string) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  return (
    <>
      <div className="relative">
        <button 
          onClick={toggleNotifications}
          className="relative p-2 text-white hover:text-gray-300 focus:outline-none"
          aria-label="Notifications"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          
          {unseenCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unseenCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
            <div className="p-2 bg-gray-100 border-b flex justify-between items-center">
              <h3 className="font-medium">Notifications</h3>
              <button 
                onClick={markAllAsSeen}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No new notifications
                </div>
              ) : (
                <div>
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-3 border-b hover:bg-gray-50 ${notification.seen ? '' : 'bg-blue-50'}`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {notification.type === 'create' && '✨ New Task'}
                          {notification.type === 'update' && '🔄 Task Updated'}
                          {notification.type === 'assign' && '👤 Task Assigned'}
                          {notification.type === 'status' && '📊 Status Changed'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {notification.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1 truncate">{notification.task.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message || (
                          <>
                            {notification.type === 'create' && 'A new task has been created'}
                            {notification.type === 'update' && `Status: ${formatStatusText(notification.task.status)}`}
                            {notification.type === 'assign' && `Assigned to: ${notification.task.assignedToEmail || 'No one'}`}
                            {notification.type === 'status' && `Status changed to: ${formatStatusText(notification.task.status)}`}
                          </>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
        />
      )}
    </>
  );
};

export default TaskNotifications; 