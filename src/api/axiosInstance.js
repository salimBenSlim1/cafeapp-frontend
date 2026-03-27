import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`, 
  withCredentials:true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.redirectTo) {
      localStorage.removeItem('token');
      window.location.href = error.response.data.redirectTo;
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = 'https://cafeapp-frontend-lij4.vercel.app/login';
    }

    return Promise.reject(error);
  }
);

export default api;
