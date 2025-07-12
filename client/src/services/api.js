import axios from 'axios';

// Determine API base URL based on current host
const getBaseURL = () => {
  const currentHost = window.location.hostname;
  
  // If running on ngrok or localhost, use same origin
  if (currentHost.includes('ngrok') || currentHost === 'localhost') {
    return window.location.origin;
  }
  
  // If on production domain, use production API
  if (currentHost === 'creators.tresr.com') {
    return 'https://creators.tresr.com';
  }
  
  // Fallback to local development
  return 'http://localhost:3002';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Include cookies in requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Could redirect to login here if needed
      console.log('Unauthorized - user needs to login');
    }
    return Promise.reject(error);
  }
);

export default api;