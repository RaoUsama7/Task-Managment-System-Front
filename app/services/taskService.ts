import apiService from './apiService';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedUserId?: string;
  assignedToEmail?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface CreateTaskRequest {
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedUserId?: string;
  assignedToEmail?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  assignedUserId?: string;
  assignedToEmail?: string;
}

export interface AssignTaskRequest {
  userId: string;
}

export interface TaskListParams {
  status?: TaskStatus;
}

export const taskService = {
  getAllTasks: async (params?: TaskListParams): Promise<Task[]> => {
    return apiService.get<Task[]>('/tasks', { params });
  },
  
  getTaskById: async (id: string): Promise<Task> => {
    return apiService.get<Task>(`/tasks/${id}`);
  },
  
  createTask: async (taskData: CreateTaskRequest): Promise<Task> => {
    return apiService.post<Task>('/tasks', taskData);
  },
  
  updateTask: async (id: string, taskData: UpdateTaskRequest): Promise<Task> => {
    return apiService.patch<Task>(`/tasks/${id}`, taskData);
  },
  
  deleteTask: async (id: string): Promise<void> => {
    return apiService.delete<void>(`/tasks/${id}`);
  },
  
  assignTask: async (id: string, assignData: AssignTaskRequest): Promise<Task> => {
    return apiService.patch<Task>(`/tasks/${id}/assign`, assignData);
  }
};

export default taskService; 