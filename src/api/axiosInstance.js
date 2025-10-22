import axios from 'axios';

// Create a reusable axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // your backend base URL
});

// ✅ Add interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend says redirect
    if (error.response?.data?.redirectTo) {
      // Clear stored token
      localStorage.removeItem('token');

      // Force browser to login page
      window.location.href = error.response.data.redirectTo;
    }

    // Optional: handle unauthorized API key
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = 'http://localhost:3000/login';
    }

    return Promise.reject(error);
  }
);

export default api;
