"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./context/AuthContext";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
    console.log("Socket URL:", process.env.NEXT_PUBLIC_SOCKET_URL);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-slate-800">
                Task Management System
              </h1>
            </div>
            <div className="flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Profile
                  </Link>
                  <button className="text-slate-600 hover:text-slate-900 font-medium">
                    Logout
                  </button>
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-slate-700">
                      {user?.email} ({user?.role === "admin" ? "Admin" : "User"}
                      )
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-slate-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-6 md:text-5xl">
              Task Management System
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              A comprehensive solution for managing tasks, assignments, and team
              collaboration
            </p>

            {process.env.NEXT_PUBLIC_APP_ENV === "development" && (
              <div className="bg-slate-100 p-4 mb-8 text-sm text-left rounded-lg">
                <div>
                  <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL}
                </div>
                <div>
                  <strong>Socket URL:</strong>{" "}
                  {process.env.NEXT_PUBLIC_SOCKET_URL}
                </div>
              </div>
            )}

            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Sign in to your account
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-3 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300 shadow-sm transition-colors"
                >
                  Create an account
                </Link>
              </div>
            ) : (
              <div className="flex justify-center">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Go to your dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Task Tracking
            </h3>
            <p className="text-slate-600">
              Create, assign and monitor tasks with real-time status updates.
              Keep track of progress and deadlines.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              User Management
            </h3>
            <p className="text-slate-600">
              Role-based access control for administrators and team members.
              Manage permissions and user roles.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Real-time Updates
            </h3>
            <p className="text-slate-600">
              Instant notifications when tasks are created, updated, or
              assigned. Stay informed with live updates.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Account</h3>
              <p className="text-slate-600">
                Sign up and set up your profile with role-based access
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Tasks</h3>
              <p className="text-slate-600">
                Add new tasks with detailed descriptions and deadlines
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Assign & Manage</h3>
              <p className="text-slate-600">
                Assign tasks to team members and track progress
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold mb-2">Complete & Review</h3>
              <p className="text-slate-600">
                Update status and review completed tasks
              </p>
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-white shadow-inner py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Task Management System. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
