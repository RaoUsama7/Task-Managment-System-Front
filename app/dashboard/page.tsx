"use client";

import React, { useState } from "react";
import Layout from "../components/Layout";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import WebSocketTester from "../components/WebSocketTester";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { Task, TaskStatus } from "../services/taskService";
import authService, { User } from "../services/authService";
import useSessionRestore from "../hooks/useSessionRestore";

export default function DashboardPage() {
  const { tasks, isLoading, error, updateTask, deleteTask, assignTask } =
    useTasks();
  const { isAdmin } = useAuth();
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [taskToAssign, setTaskToAssign] = useState<string | null>(null);
  const [assignToUserId, setAssignToUserId] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showWebSocketTester, setShowWebSocketTester] = useState(false);

  // Use session restore hook to ensure user data persists on refresh
  useSessionRestore();

  // Filtered tasks based on status
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
    if (!editTask) return;

    await updateTask(editTask.id, data);
    setShowForm(false);
    setEditTask(null);
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

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Task Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "all")}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          {isAdmin && (
            <button
              onClick={() => {
                setEditTask(null);
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create New Task
            </button>
          )}
          
          <button
            onClick={() => setShowWebSocketTester(!showWebSocketTester)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            {showWebSocketTester ? 'Hide WebSocket Tester' : 'Show WebSocket Tester'}
          </button>
        </div>
      </div>

      {showWebSocketTester && (
        <WebSocketTester />
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p>Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <p className="text-gray-500">No tasks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
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
      {assignModalOpen && (
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
                  <option value="">Select a user</option>
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
                disabled={!assignToUserId || loadingUsers}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
