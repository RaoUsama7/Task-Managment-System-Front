import React from 'react';
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
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onDelete, 
  onAssign,
  onStatusChange
}) => {
  const { isAdmin } = useAuth();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(task.id, e.target.value as TaskStatus);
  };

  return (
    <div className="border rounded-lg shadow-sm p-4 bg-white">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold">{task.title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${StatusColors[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4">{task.description}</p>
      
      <div className="text-sm text-gray-500 mb-4">
        <div>Created: {formatDate(task.createdAt)}</div>
        <div>Updated: {formatDate(task.updatedAt)}</div>
        <div>
          {task.assignedUserId ? 
            `Assigned to user: ${task.assignedUserId}` : 
            'Not assigned'
          }
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {(isAdmin || !task.assignedUserId) && (
          <select 
            value={task.status}
            onChange={handleStatusChange}
            className="px-3 py-1 bg-gray-100 rounded text-sm"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}

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