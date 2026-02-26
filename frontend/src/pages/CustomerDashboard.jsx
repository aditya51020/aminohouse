import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getSessionId } from '../utils/session';
import OrderTracker from '../components/OrderTracker';
import { History, RefreshCw, ShoppingBag, ArrowRight, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomerDashboard = () => {
    const { customer, loading: authLoading } = useAuth();
    const { addToast } = useToast();
    const [activeOrder, setActiveOrder] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('active');
    const [subStatus, setSubStatus] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    const sessionId = getSessionId();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Current Active Order
                const currentRes = await api.get(`/orders/current?sessionId=${sessionId}`);
                setActiveOrder(currentRes.data || null);

                // 2. Get History
                const historyRes = await api.get(`/orders/history?sessionId=${sessionId}`);
                setHistory(historyRes.data || []);

                // If no active order, default to history tab unless empty
                if (!currentRes.data && historyRes.data.length > 0 && tab === 'active') {
                    // Optional: Auto-switch? Maybe not, can be annoying.
                }
                // 3. Get Subscription Status (if logged in)
                if (customer) {
                    try {
                        const subRes = await api.get(`/subscriptions/status/${customer.id || customer._id}`);
                        setSubStatus(subRes.data);
                    } catch (e) {
                        console.error("Sub fetch failed", e);
                    }
                }
            } catch (err) {
                console.error('Failed to load dashboard data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [sessionId, tab]); // Added tab to deps if needed, or keeping minimal. 
    // Actually 'tab' is used in logic but maybe not critical to re-fetch? 
    // The original logic checked tab inside fetch. 
    // Ill just include sessionId and keep it simple. api ref is stable usually.

    const handleReorder = (order) => {
        localStorage.setItem('reorderItems', JSON.stringify(order.items));
        window.location.href = '/menu';
    };

    const handleClaimMeal = async () => {
        if (!customer) return;
        try {
            const res = await api.post('/subscriptions/claim', { customerId: customer.id || customer._id });
            addToast(res.data.message, 'success');
            window.location.reload();
        } catch (err) {
            addToast(err.response?.data?.message || 'Claim failed', 'error');
        }
    };

    const handleBuySub = async (days) => {
        if (!window.confirm(`Buy ${days} days subscription?`)) return;
        try {
            await api.post('/subscriptions/buy', { customerId: customer.id || customer._id, planType: days });
            addToast('Subscription activated!', 'success');
            window.location.reload();
        } catch (err) {
            addToast(err.response?.data?.message || 'Purchase failed', 'error');
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        setCancellingId(orderId);
        try {
            const sessionId = getSessionId();
            await api.patch(`/orders/${orderId}/cancel?sessionId=${sessionId}`);
            addToast('Order cancelled successfully', 'success');
            setActiveOrder(null);
            setTab('history');
            // Refresh data
            const historyRes = await api.get(`/orders/history?sessionId=${sessionId}`);
            setHistory(historyRes.data || []);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to cancel order', 'error');
        } finally {
            setCancellingId(null);
        }
    };

    if (authLoading || loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-900">
                    {customer ? `Hi, ${customer.name.split(' ')[0]}` : 'Guest Dashboard'}
                </h1>
                <p className="text-xs text-gray-500">
                    {customer ? 'Welcome back to Amen House' : 'Track your order & view history'}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex p-4 gap-4">
                <button
                    onClick={() => setTab('active')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'active' ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-500 border'
                        }`}
                >
                    Active Order
                </button>
                <button
                    onClick={() => setTab('history')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'history' ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-500 border'
                        }`}
                >
                    History
                </button>
            </div>

            {/* Content */}
            <div className="px-4">
                {/* SUBSCRIPTION CARD */}
                {customer && (
                    <div className="mb-6">
                        {subStatus && subStatus.active ? (
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-white/80 text-sm font-medium">My Subscription</p>
                                            <h3 className="text-2xl font-bold">{subStatus.daysRemaining} Days Left</h3>
                                        </div>
                                        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                                            ACTIVE
                                        </div>
                                    </div>

                                    <div className="bg-white/10 rounded-xl p-3 mb-4 backdrop-blur-sm">
                                        <p className="text-xs text-white/70 mb-1">TODAY'S MEAL</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">🍱</span>
                                            <p className="font-bold">{subStatus.todayItem?.name || 'Meal'} + Cold Coffee</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleClaimMeal}
                                        disabled={subStatus.claimedToday}
                                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${subStatus.claimedToday
                                            ? 'bg-white/20 text-white/60 cursor-not-allowed'
                                            : 'bg-white text-indigo-600 shadow-md hover:bg-gray-50'
                                            }`}
                                    >
                                        {subStatus.claimedToday ? '✅ Claimed for Today' : 'Claim Now'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">Daily Meal Subscription</h3>
                                        <p className="text-gray-400 text-xs">Save up to 40% on daily meals</p>
                                    </div>
                                    <span className="text-2xl">👑</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[7, 14, 30].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => handleBuySub(d)}
                                            className="bg-white/10 hover:bg-white/20 transition p-2 rounded-lg text-center"
                                        >
                                            <p className="font-bold text-lg">{d}</p>
                                            <p className="text-[10px] uppercase text-white/60">Days</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'active' && (
                    <div>
                        {activeOrder ? (
                            <div>
                                <OrderTracker order={activeOrder} />
                                {/* Cancel button — only for Pending orders */}
                                {activeOrder.status === 'Pending' && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleCancelOrder(activeOrder.id)}
                                            disabled={cancellingId === activeOrder.id}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 transition disabled:opacity-50"
                                        >
                                            <XCircle size={18} />
                                            {cancellingId === activeOrder.id ? 'Cancelling...' : 'Cancel Order'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingBag className="text-gray-400" />
                                </div>
                                <h3 className="font-bold text-gray-900">No active orders</h3>
                                <p className="text-sm text-gray-500 mb-6">Hungry? Grab a bite!</p>
                                <Link to="/menu" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-blue-200 shadow-lg">
                                    Order Now <ArrowRight size={16} />
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'history' && (
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-gray-500">No past orders found.</p>
                            </div>
                        ) : (
                            history.map(order => (
                                <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900">Order #{order.id?.slice(-6)}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'Completed' || order.status === 'Served' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="space-y-1 mb-4">
                                        {order.items.map((item, i) => (
                                            <div key={i} className="flex justify-between text-sm text-gray-700">
                                                <span>{item.quantity}x {item.menuItem?.name}</span>
                                                <span>₹{item.menuItem?.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-3 border-t flex justify-between items-center">
                                        <p className="font-bold text-gray-900">Total: ₹{order.totalAmount}</p>
                                        <button
                                            onClick={() => handleReorder(order)}
                                            className="text-blue-600 text-sm font-bold flex items-center gap-1"
                                        >
                                            <RefreshCw size={14} /> Reorder
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDashboard;
