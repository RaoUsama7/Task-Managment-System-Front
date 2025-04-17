import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '../services/taskService';
import { User } from '../services/authService';
import { useAuth } from '../context/AuthContext';

interface TaskFormProps {
  task?: Task;
  users?: User[];
  onSubmit: (taskData: CreateTaskRequest | UpdateTaskRequest) => Promise<void>;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, users = [], onSubmit, onCancel }) => {
  const { isAdmin, user } = useAuth();
  const [formData, setFormData] = useState<CreateTaskRequest | UpdateTaskRequest>({
    title: '',
    description: null,
    status: 'pending' as TaskStatus,
    assignedUserId: undefined,
    assignedToEmail: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form with task data if editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        assignedUserId: task.assignedUserId,
        assignedToEmail: task.assignedToEmail || undefined
      });
    }
  }, [task]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation - ensure title is not empty
    if (!formData.title?.trim()) {
      setError('Title is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Create a copy of formData for submission, keeping any existing assignments
      const submissionData = {
        ...formData,
      };
      
      await onSubmit(submissionData);
      
      // Reset form after successful submission if creating new task
      if (!task) {
        setFormData({
          title: '',
          description: null,
          status: 'pending',
          assignedUserId: undefined,
          assignedToEmail: undefined
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save task. Please try again.');
      console.error('Error submitting task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {isAdmin && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}

      {/* Show assignment info if task is assigned to someone (in edit mode) */}
      {task && task.assignedToEmail && (
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Currently assigned to:</span> {task.assignedToEmail}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Assignment can be changed by an admin using the Assign button.
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm; 