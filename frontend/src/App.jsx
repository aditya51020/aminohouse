// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Menu from './pages/Menu';
import CustomerDashboard from './pages/CustomerDashboard';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrderHistory from './pages/OrderHistory';
import OrderSuccess from './pages/OrderSuccess';

import Kitchen from './pages/Kitchen';
import POS from './pages/POS';
import QRPage from './pages/QRPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/menu" element={<Menu />} />

            {/* Admin & Staff - Protected */}
            <Route path="/admin/login" element={<Login />} />

            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Kitchen - No Login Required */}
            <Route path="/kitchen" element={<Kitchen />} />

            {/* QR Code Generator - Admin only */}
            <Route path="/admin/qr" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <QRPage />
              </ProtectedRoute>
            } />

            <Route path="/pos" element={
              <ProtectedRoute allowedRoles={['admin', 'cashier']}>
                <POS />
              </ProtectedRoute>
            } />

            {/* Customer */}
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            <Route path="/order-success" element={<OrderSuccess />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;