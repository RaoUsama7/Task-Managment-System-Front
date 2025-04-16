import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to restore user session state from localStorage when the page is refreshed
 */
export const useSessionRestore = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!user && !isLoading) {
      // Check if there's stored user info but no current user (page was refreshed)
      const storedUserInfo = localStorage.getItem('userInfo');
      
      if (storedUserInfo) {
        // Force page reload once to ensure all contexts are properly restored
        // This helps when nested contexts depend on user state
        window.location.reload();
      }
    }
  }, [user, isLoading]);

  return null;
};

export default useSessionRestore; 