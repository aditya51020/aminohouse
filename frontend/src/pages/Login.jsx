// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) return setMessage('Fill all fields');
    setLoading(true);
    setMessage('');
    try {
      // Safety cleanup
      localStorage.removeItem('adminToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');

      const { data } = await api.post('/auth/login', { username, password });

      localStorage.setItem('adminToken', data.token);

      // Force 'admin' role if username is admin (SafetyNet)
      if (username.toLowerCase() === 'admin') {
        localStorage.setItem('userRole', 'admin');
        data.role = 'admin';
      } else {
        localStorage.setItem('userRole', data.role);
      }

      localStorage.setItem('userName', data.username);

      if (data.role === 'cashier') {
        window.location.href = '/pos';
      } else if (data.role === 'kitchen') {
        window.location.href = '/kitchen';
      } else {
        window.location.href = '/admin/dashboard';
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) return setMessage('Enter email');
    setLoading(true);
    setMessage('');
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('OTP sent! Check console (or email in prod)');
      setMode('reset');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Email not found');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!otp || !newPassword) return setMessage('Fill all fields');
    setLoading(true);
    setMessage('');
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setMessage('Password reset! Login now.');
      setMode('login');
      setOtp(''); setNewPassword('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Admin Login' : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">Secure access to dashboard</p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm text-center font-medium ${message.includes('sent') || message.includes('reset') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* LOGIN */}
        {mode === 'login' && (
          <div className="space-y-5">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
            />
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:bg-gray-500 transition-all"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button
              onClick={() => { setMode('forgot'); setMessage(''); }}
              className="w-full text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Forgot Password?
            </button>
          </div>
        )}

        {/* FORGOT */}
        {mode === 'forgot' && (
          <div className="space-y-5">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Registered Email"
              className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 transition-all"
            />
            <button
              onClick={handleForgot}
              disabled={loading}
              className="w-full py-3.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:bg-green-400 transition-all"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <button
              onClick={() => { setMode('login'); setMessage(''); }}
              className="w-full text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* RESET */}
        {mode === 'reset' && (
          <div className="space-y-5">
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 transition-all text-center text-lg font-mono"
            />
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 transition-all"
            />
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-3.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:bg-green-400 transition-all"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              onClick={() => { setMode('login'); setMessage(''); }}
              className="w-full text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;