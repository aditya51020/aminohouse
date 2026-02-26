// pages/OrderHistory.jsx — Proper Order History Page
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionId } from '../utils/session';

/**
 * OrderHistory redirects to CustomerDashboard which has a full
 * history tab. This prevents duplicate pages and keeps code DRY.
 */
const OrderHistory = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to customer dashboard which shows full history with order tracker
    navigate('/customer-dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">Redirecting to your orders...</p>
    </div>
  );
};

export default OrderHistory;