import React, { useState, useEffect } from 'react';
import websocketService from '../services/websocketService';
import websocketTestHelper from '../services/websocketTestHelper';
import { Task } from '../services/taskService';
import { useAuth } from '../context/AuthContext';

interface WebSocketEventLog {
  id: string;
  event: string;
  data: Task;
  timestamp: Date;
}

const WebSocketTester: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [eventLogs, setEventLogs] = useState<WebSocketEventLog[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const { isAuthenticated } = useAuth();

  // Check connection status periodically
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkConnection = () => {
      const connected = websocketService.isConnected();
      setIsConnected(connected);
    };
    
    // Check immediately and then every 2 seconds
    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Register event listeners for all event types
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const handleTaskEvent = (eventType: string) => (data: Task) => {
      const newLog: WebSocketEventLog = {
        id: Math.random().toString(36).substr(2, 9),
        event: eventType,
        data,
        timestamp: new Date()
      };
      
      setEventLogs(prev => [newLog, ...prev].slice(0, 10));
    };
    
    // Register handlers for all event types
    const unsubscribeTaskCreated = websocketService.on('taskCreated', handleTaskEvent('taskCreated'));
    const unsubscribeTaskUpdated = websocketService.on('taskUpdated', handleTaskEvent('taskUpdated'));
    const unsubscribeTaskAssigned = websocketService.on('taskAssigned', handleTaskEvent('taskAssigned'));
    
    return () => {
      unsubscribeTaskCreated();
      unsubscribeTaskUpdated();
      unsubscribeTaskAssigned();
    };
  }, [isAuthenticated]);

  const runWebSocketTest = () => {
    if (!isConnected) {
      alert('Cannot run test: Not connected to WebSocket server');
      return;
    }
    
    setIsTestRunning(true);
    
    // Get access to the socket instance for testing
    // Note: This is a bit hacky but necessary for testing
    const socketInstance = (websocketService as any).socket;
    
    websocketTestHelper.runFullTest(socketInstance);
    
    // Reset test running state after the test completes
    setTimeout(() => {
      setIsTestRunning(false);
    }, 6000);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">WebSocket Status</h2>
      
      <div className="flex items-center mb-6">
        <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="font-medium">
          {isConnected ? 'Connected to WebSocket server' : 'Disconnected from WebSocket server'}
        </span>
      </div>
      
      {/* Test controls */}
      <div className="mb-6 border-t border-b py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-medium">WebSocket Testing</h3>
            <p className="text-sm text-gray-600">
              Run a test to simulate WebSocket events without a backend.
            </p>
          </div>
          <button
            onClick={runWebSocketTest}
            disabled={!isConnected || isTestRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isTestRunning ? 'Test running...' : 'Run WebSocket Test'}
          </button>
        </div>
        
        <div className="mt-3 text-sm">
          <p className="text-gray-600">
            <strong>What this does:</strong> Simulates receiving WebSocket events from the server to test that your frontend is correctly handling real-time updates.
          </p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Real-Time Event Log:</h3>
        
        {eventLogs.length === 0 ? (
          <p className="text-gray-500 italic">No events received yet. Events will appear here when tasks are created, updated, or assigned.</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {eventLogs.map(log => (
              <div key={log.id} className="border rounded p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">
                    {log.event === 'taskCreated' && '✨ Task Created'}
                    {log.event === 'taskUpdated' && '🔄 Task Updated'}
                    {log.event === 'taskAssigned' && '👤 Task Assigned'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm">
                  <p><span className="font-medium">Title:</span> {log.data.title}</p>
                  <p><span className="font-medium">Status:</span> {log.data.status}</p>
                  {log.event === 'taskAssigned' && (
                    <p><span className="font-medium">Assigned To:</span> {log.data.assignedUserId || 'None'}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketTester;