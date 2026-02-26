import React, { useState, useEffect, useRef } from 'react';
import axios from '../utils/axios';
import adminApi from '../utils/adminAxios';
import { Clock, Check, ChefHat, Bell } from 'lucide-react';

const Kitchen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const audioRef = useRef(null);
    const previousOrderCount = useRef(0);

    // Poll for orders every 5 seconds
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get('/orders');
                // Handle paginated response: { orders, pagination }
                const allOrders = res.data.orders || [];
                // Filter active orders (Pending, Cooking, Ready)
                const activeOrders = allOrders.filter(o =>
                    ['Pending', 'Accepted', 'Cooking', 'Ready'].includes(o.status)
                ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                setOrders(activeOrders);

                // Play sound if new order (simple check: count increased)
                const pendingCount = activeOrders.filter(o => o.status === 'Pending').length;
                if (pendingCount > previousOrderCount.current) {
                    playAlert();
                }
                previousOrderCount.current = pendingCount;
                setLoading(false);
            } catch (err) {
                console.error("KDS Poll Error:", err);
            }
        };

        fetchOrders(); // Initial call
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const playAlert = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
    };

    const updateStatus = async (id, status) => {
        try {
            // Optimistic update
            setOrders(orders.map(o => o.id === id ? { ...o, status } : o));

            if (status === 'Served') {
                setTimeout(() => {
                    setOrders(prev => prev.filter(o => o.id !== id));
                }, 500);
            }

            // Use adminApi for protected PUT route
            await adminApi.put(`/orders/${id}`, { status });
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 border-yellow-300';
            case 'Accepted': return 'bg-blue-100 border-blue-300';
            case 'Cooking': return 'bg-orange-100 border-orange-300';
            case 'Ready': return 'bg-green-100 border-green-300';
            default: return 'bg-white';
        }
    };

    const getElapsedTime = (created) => {
        const diff = Math.floor((new Date() - new Date(created)) / 60000);
        return `${diff} min`;
    };

    // Timer component to update elapsed time every minute
    const TimeElapsed = ({ created }) => {
        const [time, setTime] = useState(getElapsedTime(created));
        useEffect(() => {
            const timer = setInterval(() => setTime(getElapsedTime(created)), 60000);
            return () => clearInterval(timer);
        }, [created]);
        return <span>{time} wait</span>;
    };

    return (
        <div className="min-h-screen bg-gray-900 p-4">
            {/* Hidden Audio Element */}
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

            <div className="flex justify-between items-center mb-6 text-white">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ChefHat /> Kitchen Display System
                </h1>
                <div className="flex gap-4 text-sm font-bold">
                    <span className="px-3 py-1 bg-yellow-500 rounded-full text-black">Pending: {orders.filter(o => o.status === 'Pending').length}</span>
                    <span className="px-3 py-1 bg-blue-500 rounded-full text-white">Accepted: {orders.filter(o => o.status === 'Accepted').length}</span>
                    <span className="px-3 py-1 bg-orange-500 rounded-full text-white">Cooking: {orders.filter(o => o.status === 'Cooking').length}</span>
                    <span className="px-3 py-1 bg-green-500 rounded-full text-white">Ready: {orders.filter(o => o.status === 'Ready').length}</span>
                </div>
            </div>

            {loading ? (
                <div className="text-white text-center mt-20">Loading Orders...</div>
            ) : orders.length === 0 ? (
                <div className="text-gray-500 text-center mt-20 text-xl font-bold">All caught up! No active orders.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {orders.map(order => (
                        <div
                            key={order.id}
                            className={`rounded-xl border-4 p-4 shadow-xl flex flex-col justify-between min-h-[300px] transition-all ${getStatusColor(order.status)}`}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4 border-b pb-2 border-black/10">
                                    <div>
                                        <h2 className="text-lg font-black">#{order.id?.slice(-4)}</h2>
                                        <p className="text-xs font-bold opacity-70">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        <span className="text-[10px] uppercase font-black opacity-50">{order.status}</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-bold text-sm bg-black/10 px-2 py-1 rounded">
                                        <Clock size={14} />
                                        <TimeElapsed created={order.createdAt} />
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-3 text-lg font-bold leading-tight">
                                            <span className="bg-white rounded px-2 h-fit border border-gray-300">{item.quantity}</span>
                                            <span>
                                                {item.menuItem?.name || 'Unknown Item'}
                                                {/* Show simple customizations if any (assuming string or simple structure) */}
                                            </span>
                                        </div>
                                    ))}
                                    {/* Note/Instruction if existing would go here */}
                                </div>
                            </div>

                            <div className="mt-auto">
                                {order.status === 'Pending' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'Accepted')}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-lg shadow-lg uppercase tracking-wider"
                                    >
                                        Accept Order
                                    </button>
                                )}
                                {order.status === 'Accepted' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'Cooking')}
                                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xl rounded-lg shadow-lg uppercase tracking-wider"
                                    >
                                        Start Cooking
                                    </button>
                                )}
                                {order.status === 'Cooking' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'Ready')}
                                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black text-xl rounded-lg shadow-lg uppercase tracking-wider"
                                    >
                                        Meal Ready
                                    </button>
                                )}
                                {order.status === 'Ready' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'Served')}
                                        className="w-full py-4 bg-gray-800 hover:bg-gray-900 text-white font-black text-xl rounded-lg shadow-lg uppercase tracking-wider flex items-center justify-center gap-2"
                                    >
                                        <Check /> Served
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Kitchen;
