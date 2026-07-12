import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // required for refresh token cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// TODO: Add request interceptor to inject access token from store
// TODO: Add response interceptor to handle token refresh logic automatically

export default axiosInstance;
