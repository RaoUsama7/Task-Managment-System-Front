import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import useSessionRestore from '../hooks/useSessionRestore';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  
  // Use session restore hook to ensure user data persists on refresh
  useSessionRestore();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Task Management System
          </Link>
          <nav>
            <ul className="flex space-x-4">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link href="/dashboard" className="hover:text-gray-300">
                      Dashboard
                    </Link>
                  </li>
                  {/* {isAdmin && (
                    <li>
                      <Link href="/tasks/create" className="hover:text-gray-300">
                        Create Task
                      </Link>
                    </li>
                  )} */}
                  <li>
                    <Link href="/profile" className="hover:text-gray-300">
                      Profile
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={logout}
                      className="hover:text-gray-300"
                    >
                      Logout
                    </button>
                  </li>
                  <li className="ml-4 text-sm opacity-75">
                    {user?.email} ({isAdmin ? 'Admin' : 'User'})
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="hover:text-gray-300">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="hover:text-gray-300">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Task Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 