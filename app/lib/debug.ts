/**
 * Utility for debugging environment variable usage in services
 */

// Logger for environment variables
export const logEnvVariables = () => {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
    console.group('Environment Variables');
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('Socket URL:', process.env.NEXT_PUBLIC_SOCKET_URL);
    console.log('App Environment:', process.env.NEXT_PUBLIC_APP_ENV);
    console.groupEnd();
  }
};

// Export specific environment variables for convenient reuse
export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
};

export default { logEnvVariables, ENV }; 