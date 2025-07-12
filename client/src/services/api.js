import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.PROD ? 'https://creators.tresr.com' : 'http://localhost:3002',
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