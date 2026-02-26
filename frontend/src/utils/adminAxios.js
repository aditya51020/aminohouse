// src/utils/adminAxios.js
import axios from "axios";

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return url.endsWith("/api") ? url : `${url.replace(/\/$/, "")}/api`;
};

const adminApi = axios.create({
  baseURL: getBaseURL(),
});

adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('userRole');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default adminApi;