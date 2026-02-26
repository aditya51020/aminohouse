// src/pages/OrderSuccess.jsx
import React, { useEffect, useState } from 'react';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('lastOrderId');
    if (!id) return setLoading(false);

    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => { })
      .finally(() => setLoading(false));

    const t = setTimeout(() => navigate('/menu'), 6000);
    return () => clearTimeout(t);
  }, [navigate]);

  if (loading) return <p className="text-center">Loading…</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Order Placed!</h1>
        {order && (
          <>
            <p><strong>Order ID:</strong> {order._id}</p>
            <p><strong>Customer:</strong> {order.customer?.name} {order.customer?.phone && `(${order.customer.phone})`}</p>
            <p><strong>Total:</strong> ₹{order.totalAmount}</p>
            <p><strong>Payment:</strong> {order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'PhonePe'}</p>
            <div className="mt-4">
              <p className="font-medium">Items:</p>
              <ul className="text-left mx-auto max-w-xs">
                {order.items.map((i, idx) => (
                  <li key={idx}>{i.menuItem?.name} × {i.quantity}</li>
                ))}
              </ul>
            </div>
          </>
        )}
        <p className="mt-6 text-sm text-gray-500">Redirecting to menu in 6s…</p>
      </div>
    </div>
  );
};

export default OrderSuccess;