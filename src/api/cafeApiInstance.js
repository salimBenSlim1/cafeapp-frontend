import axios from "axios";

const cafeApi = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
  withCredentials: true, // باش الكوكي (refresh token) يتبع مع request
});

// ✅ FIX: Initialize token from localStorage on app start
let accessToken = localStorage.getItem('token');

// وظيفة لتحديث التوكن (تستعملها بعد login)
export function setAccessToken(token) {
  accessToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

// 🧠 interceptor قبل كل request
cafeApi.interceptors.request.use((config) => {
  // ✅ FIX: Use the accessToken variable (already initialized from localStorage)
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 🧩 interceptor للـresponse
cafeApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // إذا جاوب السيرفر 401 و مازال ما جربناش refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // نحاول نجيب توكن جديد من /refresh
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/refresh`,
          {},
          { withCredentials: true }
        );

        // ✅ FIX: Save the new token properly
        const newToken = res.data.accessToken;
        setAccessToken(newToken); // This updates both variable and localStorage

        // نعاود نفس الـrequest بالـtoken الجديد
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return cafeApi(originalRequest);
      } catch (err) {
        console.error("Refresh failed:", err);
        // ✅ Clear token before redirect
        setAccessToken(null);
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default cafeApi;
