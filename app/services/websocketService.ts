import { io, Socket } from 'socket.io-client';
import { Task } from './taskService';
import { logEnvVariables } from '../lib/debug';

export type WebSocketEvent = 'taskCreated' | 'taskUpdated' | 'taskAssigned';

export interface WebSocketEventHandler {
  (data: Task): void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Log environment variables in development
if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
  logEnvVariables();
  console.log('WebSocket Service using URL:', SOCKET_URL);
}

let socket: Socket | null = null;
const eventHandlers: Record<WebSocketEvent, WebSocketEventHandler[]> = {
  taskCreated: [],
  taskUpdated: [],
  taskAssigned: []
};

export const websocketService = {
  // Expose socket instance for testing purposes
  get socket() {
    return socket;
  },
  
  connect: (token: string): void => {
    if (socket) return;
    
    console.log(`Attempting to connect to WebSocket at: ${SOCKET_URL}`);
    
    socket = io(SOCKET_URL, {
      auth: {
        token
      }
    });

    socket.on('connect', () => {
      console.log('✅ Successfully connected to WebSocket server');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Disconnected from WebSocket server. Reason: ${reason}`);
    });

    // Register event listeners
    Object.keys(eventHandlers).forEach((event) => {
      socket?.on(event, (data: Task) => {
        const handlers = eventHandlers[event as WebSocketEvent];
        handlers.forEach(handler => handler(data));
      });
    });
  },
  
  disconnect: (): void => {
    if (!socket) return;
    
    socket.disconnect();
    socket = null;
  },
  
  on: (event: WebSocketEvent, handler: WebSocketEventHandler): () => void => {
    const handlers = eventHandlers[event];
    handlers.push(handler);
    
    // Return a function to remove this handler
    return () => {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    };
  },
  
  isConnected: (): boolean => {
    return socket?.connected || false;
  }
};

export default websocketService; 