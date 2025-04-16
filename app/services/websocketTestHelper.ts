import { Task, TaskStatus } from './taskService';

/**
 * Utility to help test WebSocket functionality
 * This is not used in production but helps to simulate WebSocket events
 */
export const websocketTestHelper = {
  /**
   * Simulate a WebSocket event coming from the server
   * @param socket The socket.io instance
   * @param eventName The name of the event to simulate
   * @param data The data to send with the event
   */
  simulateEvent: (socketInstance: any, eventName: string, data: any): void => {
    if (!socketInstance) {
      console.error('Cannot simulate event: Socket not connected');
      return;
    }
    
    // Access the internal socket events and emit as if from server
    if (socketInstance._callbacks && socketInstance._callbacks[`$${eventName}`]) {
      const handlers = socketInstance._callbacks[`$${eventName}`];
      handlers.forEach((handler: Function) => {
        handler(data);
      });
      console.log(`Simulated ${eventName} event:`, data);
    } else {
      console.warn(`No handlers registered for event: ${eventName}`);
    }
  },
  
  /**
   * Generate a mock task for testing
   */
  generateMockTask: (overrides: Partial<Task> = {}): Task => {
    const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      id: overrides.id || Math.random().toString(36).substr(2, 9),
      title: overrides.title || `Test Task ${Math.floor(Math.random() * 1000)}`,
      description: overrides.description || 'This is a test task description generated for WebSocket testing.',
      status: overrides.status || randomStatus,
      assignedUserId: overrides.assignedUserId,
      createdAt: overrides.createdAt || new Date().toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
    };
  },
  
  /**
   * Test WebSocket connection by simulating all types of events
   * @param socket The socket.io instance to test with
   */
  runFullTest: (socketInstance: any): void => {
    if (!socketInstance) {
      console.error('Cannot run test: Socket not connected');
      return;
    }
    
    console.log('Starting WebSocket test sequence...');
    
    // Simulate task created event
    setTimeout(() => {
      const task = websocketTestHelper.generateMockTask({ 
        title: 'New Task Created via WebSocket'
      });
      websocketTestHelper.simulateEvent(socketInstance, 'taskCreated', task);
    }, 1000);
    
    // Simulate task updated event
    setTimeout(() => {
      const task = websocketTestHelper.generateMockTask({ 
        title: 'Task Updated via WebSocket',
        status: 'in_progress'
      });
      websocketTestHelper.simulateEvent(socketInstance, 'taskUpdated', task);
    }, 3000);
    
    // Simulate task assigned event
    setTimeout(() => {
      const task = websocketTestHelper.generateMockTask({ 
        title: 'Task Assigned via WebSocket',
        assignedUserId: 'test-user-123'
      });
      websocketTestHelper.simulateEvent(socketInstance, 'taskAssigned', task);
    }, 5000);
    
    console.log('Test sequence scheduled. Events will fire over the next 5 seconds.');
  }
};

export default websocketTestHelper;