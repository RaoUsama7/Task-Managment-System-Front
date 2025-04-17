"use client";

import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { Task, TaskStatus } from "../services/taskService";
import authService, { User } from "../services/authService";
import useSessionRestore from "../hooks/useSessionRestore";
import websocketService from "../services/websocketService";

export default function DashboardPage() {
  const { tasks, isLoading: tasksLoading, error, updateTask, deleteTask, assignTask, createTask, fetchTasks } =
    useTasks();
  const { isAdmin, user } = useAuth();
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [taskToAssign, setTaskToAssign] = useState<string | null>(null);
  const [assignToUserId, setAssignToUserId] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Use session restore hook to ensure user data persists on refresh
  useSessionRestore();

  // Effect to fetch tasks when filter status changes
  useEffect(() => {
    const fetchTasksWithFilter = async () => {
      try {
        setIsFilterLoading(true);
        
        if (filterStatus === 'all') {
          await fetchTasks();
        } else {
          await fetchTasks({ status: filterStatus });
        }
        
        // Track current filter for URL param synchronization
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          
          if (filterStatus === 'all') {
            url.searchParams.delete('status');
          } else {
            url.searchParams.set('status', filterStatus);
          }
          
          window.history.replaceState({}, '', url.toString());
        }
      } catch (error) {
        console.error("Error fetching filtered tasks:", error);
      } finally {
        setIsFilterLoading(false);
      }
    };

    fetchTasksWithFilter();
  }, [filterStatus]);

  // Read initial filter from URL on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const status = url.searchParams.get('status');
      
      if (status && (status === 'pending' || status === 'in_progress' || status === 'completed')) {
        setFilterStatus(status);
      }
    }
  }, []);

  // Effect to fetch users when the form is shown
  

  // Filtered tasks (client-side filtering as backup)
  const filteredTasks = tasks.filter(
    (task) => filterStatus === "all" || task.status === filterStatus
  );

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const userList = await authService.getUsers();
      setUsers(userList);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setShowForm(true);
  };

  const handleUpdateTask = async (data: Partial<Task>) => {
    try {
      if (editTask) {
        // Convert Partial<Task> to UpdateTaskRequest
        const updateData = {
          title: data.title,
          description: data.description === undefined ? null : data.description,
          status: data.status,
          assignedUserId: data.assignedUserId,
          assignedToEmail: data.assignedToEmail || undefined // Convert null to undefined
        };

        await updateTask(editTask.id, updateData);
      } else {
        // Convert Partial<Task> to CreateTaskRequest
        const createData = {
          title: data.title || '', // Ensure title is never undefined
          description: data.description === undefined ? null : data.description,
          status: data.status || 'pending',
          assignedUserId: data.assignedUserId,
          assignedToEmail: data.assignedToEmail || undefined
        };

        await createTask(createData);
      }
      setShowForm(false);
      setEditTask(null);
    } catch (error) {
      console.error("Error saving task:", error);
      // You could set an error state here to display to the user
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await updateTask(id, { status });
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteTask(id);
    }
  };

  const handleAssignTask = (id: string) => {
    setTaskToAssign(id);
    setAssignModalOpen(true);
    fetchUsers();
  };

  const handleAssignSubmit = async () => {
    if (taskToAssign && assignToUserId) {
      await assignTask(taskToAssign, { userId: assignToUserId });
      setAssignModalOpen(false);
      setTaskToAssign(null);
      setAssignToUserId("");
    }
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus | "all";
    setFilterStatus(newStatus);
  };

  // Define function to handle joining rooms for tasks
  const joinTaskRooms = (tasks: Task[]) => {
    if (!websocketService.isConnected()) return;
    
    console.log('Joining task rooms for visible tasks');
    tasks.forEach(task => {
      if (task.id) {
        websocketService.joinTaskRoom(task.id);
      }
    });
  };

  // Clean up task rooms when unmounting
  useEffect(() => {
    return () => {
      console.log('Cleaning up task rooms');
      filteredTasks.forEach(task => {
        if (task.id) {
          websocketService.leaveTaskRoom(task.id);
        }
      });
    };
  }, [filteredTasks]);

  // Join task rooms when tasks change
  useEffect(() => {
    joinTaskRooms(filteredTasks);
  }, [filteredTasks]);

  // Join task room when editing a specific task
  useEffect(() => {
    if (editTask?.id) {
      websocketService.joinTaskRoom(editTask.id);
      
      return () => {
        websocketService.leaveTaskRoom(editTask.id);
      };
    }
  }, [editTask]);

  // Join task room for task assignment
  useEffect(() => {
    if (taskToAssign) {
      websocketService.joinTaskRoom(taskToAssign);
      
      return () => {
        if (taskToAssign) {
          websocketService.leaveTaskRoom(taskToAssign);
        }
      };
    }
  }, [taskToAssign]);

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Task Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-md ${filterStatus === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-md ${filterStatus === 'pending' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-3 py-1 rounded-md ${filterStatus === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1 rounded-md ${filterStatus === 'completed' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`}
            >
              Completed
            </button>
          </div>
          
          {isAdmin && (
            <button
              onClick={() => {
                setEditTask(null);
                setShowForm(true);
                fetchUsers();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create New Task
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {tasksLoading || isFilterLoading ? (
        <div className="text-center py-8">
          <p>Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <p className="text-gray-500">No tasks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks
            .filter(task => task.id)
            .map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onAssign={handleAssignTask}
                onStatusChange={handleStatusChange}
              />
            ))}
        </div>
      )}

      {/* Edit/Create Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {editTask ? "Edit Task" : "Create Task"}
            </h2>
            <TaskForm
              task={editTask || undefined}
              users={users}
              onSubmit={handleUpdateTask}
              onCancel={() => {
                setShowForm(false);
                setEditTask(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {assignModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Assign Task</h2>
            
            {loadingUsers ? (
              <div className="text-center py-4">
                <p>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-4">
                <p>No users found.</p>
              </div>
            ) : (
              <div className="mb-4">
                <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
                </label>
                <select
                  id="user-select"
                  value={assignToUserId}
                  onChange={(e) => setAssignToUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Unassign</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email} {user.role === "admin" ? "(Admin)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setAssignModalOpen(false);
                  setTaskToAssign(null);
                  setAssignToUserId("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={loadingUsers}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {assignToUserId ? 'Assign' : 'Unassign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
