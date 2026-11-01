import axios from "axios";

const cafeApi = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`,
  withCredentials: true, 
});

let accessToken = localStorage.getItem('token');

export function setAccessToken(token,id) {
  accessToken = token;
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('cafeId', id);
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('cafeId');
  }
}
cafeApi.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

cafeApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;
        const id=res.data.id
        setAccessToken(newToken,id); 
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return cafeApi(originalRequest);
      } catch (err) {
        console.error("Refresh failed:", err);
        setAccessToken(null);
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    if (error.response?.status === 403) {
  const redirectTo = error.response.data?.redirectTo;
  if (redirectTo) window.location.href = redirectTo;
  return Promise.reject(error);
}

    return Promise.reject(error);
  }
);

export default cafeApi;
