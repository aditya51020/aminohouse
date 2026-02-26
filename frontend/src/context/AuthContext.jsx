import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');

    if (adminToken) {
      setLoading(false);
      return;
    }

    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      api.get('/customer-auth/me')
        .then(res => setCustomer(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);
  
  const login = async (phone) => {
    const res = await api.post('/customer-auth/login', { phone });
    const { token, customer: user } = res.data;
    localStorage.setItem('token', token);
    api.defaults.headers.Authorization = `Bearer ${token}`;
    setCustomer(user);
    return user;
  };

  const completeProfile = async (name, email) => {
    const res = await api.post('/customer-auth/profile', { name, email });
    setCustomer(res.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.Authorization;
    setCustomer(null);
  };

  return (
    <AuthContext.Provider value={{ customer, login, completeProfile, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};