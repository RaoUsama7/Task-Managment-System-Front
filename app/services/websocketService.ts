import { io, Socket } from 'socket.io-client';
import { Task } from './taskService';
import { logEnvVariables } from '../lib/debug';

export type WebSocketEvent = 'taskCreated' | 'taskUpdated' | 'taskAssigned' | 'taskStatusUpdated';

export interface WebSocketEventData {
  task: Task;
  message?: string;
  taskId?: string;
  createdBy?: string;
  updatedBy?: string;
  status?: string;
}

export interface WebSocketEventHandler {
  (data: WebSocketEventData): void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Log environment variables in development
if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
  logEnvVariables();
  console.log('WebSocket Service using URL:', SOCKET_URL);
}

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;
let currentUserId: string | null = null;
let currentUserRole: string | null = null;
let joinedTaskRooms: Set<string> = new Set();

const eventHandlers: Record<WebSocketEvent, WebSocketEventHandler[]> = {
  taskCreated: [],
  taskUpdated: [],
  taskAssigned: [],
  taskStatusUpdated: []
};

export const websocketService = {
  connect: (token: string, userId?: string, userRole?: string): void => {
    if (socket && socket.connected) {
      console.log('WebSocket already connected, skipping connection attempt');
      // If already connected but user ID or role has changed, update rooms
      if ((userId && userId !== currentUserId) || (userRole && userRole !== currentUserRole)) {
        websocketService.updateUserRooms(userId, userRole);
      }
      return;
    }
    
    if (socket) {
      // Clean up existing socket if it exists but is not connected
      socket.disconnect();
      socket = null;
    }
    
    // Store current user ID and role
    if (userId) {
      currentUserId = userId;
    }
    
    if (userRole) {
      currentUserRole = userRole;
    }
    
    console.log(`Attempting to connect to WebSocket at: ${SOCKET_URL}`);
    connectionAttempts = 0;
    
    socket = io(SOCKET_URL, {
      auth: {
        token
      },
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
    });

    socket.on('connect', () => {
      console.log('✅ Successfully connected to WebSocket server');
      connectionAttempts = 0;
      
      // Log debug info about the connection
      console.log(`Socket ID: ${socket?.id}`);
      console.log(`Connection URL: ${SOCKET_URL}`);
      console.log(`Transport: ${socket?.io.engine.transport.name}`);
      
      // Join appropriate rooms based on user info
      websocketService.updateUserRooms(currentUserId, currentUserRole);
    });

    socket.on('connect_error', (error) => {
      connectionAttempts++;
      console.error(`❌ WebSocket connection error (attempt ${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS}):`, error.message);
      
      if (connectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        console.error('Maximum reconnection attempts reached, giving up');
        socket?.disconnect();
        socket = null;
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to WebSocket server after ${attemptNumber} attempts`);
      
      // Rejoin rooms after reconnection
      websocketService.updateUserRooms(currentUserId, currentUserRole);
      
      // Rejoin any task rooms
      joinedTaskRooms.forEach(taskId => {
        websocketService.joinTaskRoom(taskId);
      });
    });

    socket.on('reconnect_error', (error) => {
      console.error('Failed to reconnect to WebSocket server:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Disconnected from WebSocket server. Reason: ${reason}`);
      
      // Handle various disconnect scenarios
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, will not attempt to reconnect automatically
        console.log('Server initiated disconnect, manual reconnection required');
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        // Transport closed or timed out, normally auto-reconnect will handle this
        console.log('Transport closed or timed out, reconnecting...');
      }
    });

    // Register event listeners for all events
    Object.keys(eventHandlers).forEach((event) => {
      socket?.on(event, (data: WebSocketEventData) => {
        console.log(`Received ${event} event:`, data);
        
        if (!data || !data.task) {
          console.error(`Invalid WebSocket data received for ${event} event:`, data);
          return;
        }
        
        const handlers = eventHandlers[event as WebSocketEvent];
        handlers.forEach(handler => handler(data));
      });
    });
  },
  
  updateUserRooms: (userId?: string | null, userRole?: string | null): void => {
    if (!socket || !socket.connected) {
      console.warn('Cannot update user rooms: Socket not connected');
      return;
    }
    
    // Join appropriate rooms based on user info
    if (userId) {
      websocketService.joinUserRoom(userId);
    }
    
    if (userRole === 'admin') {
      websocketService.joinAdminRoom();
    }
  },
  
  joinUserRoom: (userId: string): void => {
    if (!socket || !socket.connected) {
      console.warn('Cannot join user room: Socket not connected');
      return;
    }
    
    console.log(`Joining user room for userId: ${userId}`);
    socket.emit('joinUserRoom', userId);
    currentUserId = userId;
  },
  
  leaveUserRoom: (userId: string): void => {
    if (!socket || !socket.connected) {
      console.warn('Cannot leave user room: Socket not connected');
      return;
    }
    
    console.log(`Leaving user room for userId: ${userId}`);
    socket.emit('leaveUserRoom', userId);
    
    if (currentUserId === userId) {
      currentUserId = null;
    }
  },
  
  joinAdminRoom: (): void => {
    if (!socket || !socket.connected) {
      console.warn('Cannot join admin room: Socket not connected');
      return;
    }
    
    console.log('Joining admin room');
    socket.emit('joinAdminRoom');
  },
  
  leaveAdminRoom: (): void => {
    if (!socket || !socket.connected) {
      console.warn('Cannot leave admin room: Socket not connected');
      return;
    }
    
    console.log('Leaving admin room');
    socket.emit('leaveAdminRoom');
  },
  
  joinTaskRoom: (taskId: string): void => {
    if (!socket || !socket.connected) {
      console.warn('Cannot join task room: Socket not connected');
      return;
    }
    
    console.log(`Joining task room for taskId: ${taskId}`);
    socket.emit('joinTaskRoom', taskId);
    joinedTaskRooms.add(taskId);
  },
  
  leaveTaskRoom: (taskId: string): void => {
    if (!socket || !socket.connected) {
      console.warn('Cannot leave task room: Socket not connected');
      return;
    }
    
    console.log(`Leaving task room for taskId: ${taskId}`);
    socket.emit('leaveTaskRoom', taskId);
    joinedTaskRooms.delete(taskId);
  },
  
  disconnect: (): void => {
    if (!socket) {
      console.log('No WebSocket connection to disconnect');
      return;
    }
    
    // Leave all rooms before disconnecting
    if (currentUserId) {
      websocketService.leaveUserRoom(currentUserId);
    }
    
    if (currentUserRole === 'admin') {
      websocketService.leaveAdminRoom();
    }
    
    // Leave all task rooms
    joinedTaskRooms.forEach(taskId => {
      websocketService.leaveTaskRoom(taskId);
    });
    
    console.log('Disconnecting from WebSocket server...');
    socket.disconnect();
    socket = null;
    currentUserId = null;
    currentUserRole = null;
    joinedTaskRooms.clear();
  },
  
  on: (event: WebSocketEvent, handler: WebSocketEventHandler): () => void => {
    console.log(`Registering handler for ${event} event`);
    const handlers = eventHandlers[event];
    handlers.push(handler);
    
    // Return a function to remove this handler
    return () => {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        console.log(`Removed handler for ${event} event`);
      }
    };
  },
  
  isConnected: (): boolean => {
    return socket?.connected || false;
  }
};

export default websocketService; 