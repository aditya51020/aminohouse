// src/utils/axios.js
import axios from "axios";

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return url.endsWith("/api") ? url : `${url.replace(/\/$/, "")}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use(
  (config) => {
    // Agar URL mein /orders/sales, /orders, /menu etc hai → admin token bhejo
    if (config.url.includes('/orders') || config.url.includes('/menu')) {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers["Authorization"] = `Bearer ${adminToken}`;
      }
    } else {
      // Baaki sab ke liye customer token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;