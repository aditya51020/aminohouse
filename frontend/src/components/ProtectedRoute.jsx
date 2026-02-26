import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('adminToken');
    const role = localStorage.getItem('userRole');

    if (!token) {
        return <Navigate to="/admin/login" replace />;
    }

    // Admin can access everything provided the route allows 'admin'
    // But if we are strictly checking, allow 'admin' to pass if included
    if (allowedRoles && !allowedRoles.includes(role)) {
        if (role === 'admin') {
            // If admin is NOT in allowedRoles (e.g. strict waiter page?), redirect.
            // But for now, if admin tries to access Dashboard, allowedRoles=['admin'], so we skip this block.
            // If admin tries to access POS, allowedRoles=['admin', 'cashier'], so we skip this block.
            return <Navigate to="/admin/dashboard" replace />;
        }
        if (role === 'cashier') return <Navigate to="/pos" replace />;
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
