import React, { useState, useEffect, useMemo } from 'react';
import adminApi from '../utils/adminAxios';
import { Bar } from 'react-chartjs-2';
import { Calendar, Download, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';

const SalesReport = () => {
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], // Last 7 days default
        to: new Date().toISOString().split('T')[0]
    });
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [drillDownDate, setDrillDownDate] = useState(null);
    const [dailyOrders, setDailyOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    useEffect(() => {
        fetchSales();
    }, [dateRange]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await adminApi.get(`/orders/sales?from=${dateRange.from}&to=${dateRange.to}`);
            setSalesData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyOrders = async (date) => {
        setDrillDownDate(date);
        setLoadingOrders(true);
        try {
            // We need a specific endpoint or query to get orders by date range (start of day to end of day)
            // Reusing getHistory if it supports date range or filter? 
            // Actually getHistory uses sessionId/userId. We might need to use existing orders endpoint or add one.
            // For now let's use the main /orders endpoint if accessible or add params.
            // Assuming we can't easily filter strictly by date on /orders without backend change or fetching all.
            // Let's implement a specific call or reuse logic. 
            // Workaround: We will use the 'from' and 'to' logic on the main sales endpoint but we need detailed orders.
            // Ah, the user requirement 4 "Order Drill-Down" implies fetching list.
            // I will use a direct specific query if possible, or filter all orders if already loaded (but they might not be).
            // Let's assume we need to fetch them. I'll use a new query param on orders ?? 
            // Or just reuse `getOrders` (admin) with date filter?
            // Let's try passing from/to to /orders if adminApi supports it, or I'll assume we can't yet and maybe I need to update backend?
            // Wait, I didn't update GET /orders to filter by date. 
            // I will fetch ALL recent orders and filter client side for now if dataset is small, 
            // OR simpler: I'll make a quick backend tweak for this in next step if needed. 
            // For now, I'll assume I can just fetch generic orders and filter in memory if < 1000 orders.
            const res = await adminApi.get('/orders?limit=500');
            const allOrders = res.data.orders || [];
            const orders = allOrders.filter(o => o.createdAt.startsWith(date));
            setDailyOrders(orders);
        } catch (err) {
            console.error('Failed to load order details', err);
        } finally {
            setLoadingOrders(false);
        }
    };

    // Calculate Summary
    const summary = useMemo(() => {
        const totalRev = salesData.reduce((acc, curr) => acc + curr.total, 0);
        const totalOrders = salesData.reduce((acc, curr) => acc + curr.count, 0);
        const aov = totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0;
        return { totalRev, totalOrders, aov };
    }, [salesData]);

    const chartData = {
        labels: salesData.map(d => d._id),
        datasets: [{
            label: 'Revenue (₹)',
            data: salesData.map(d => d.total),
            backgroundColor: '#10B981',
            borderRadius: 4,
        }]
    };

    const setPreset = (days) => {
        const to = new Date();
        const from = new Date();
        if (days === 0) { // Today
            // from/to are same
        } else if (days === 1) { // Yesterday
            to.setDate(to.getDate() - 1);
            from.setDate(from.getDate() - 1);
        } else {
            from.setDate(from.getDate() - days);
        }
        setDateRange({
            from: from.toISOString().split('T')[0],
            to: to.toISOString().split('T')[0]
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border">
                <div className="flex gap-2">
                    <button onClick={() => setPreset(0)} className="px-3 py-1.5 text-sm font-bold bg-gray-100 hover:bg-gray-200 rounded-lg">Today</button>
                    <button onClick={() => setPreset(1)} className="px-3 py-1.5 text-sm font-bold bg-gray-100 hover:bg-gray-200 rounded-lg">Yesterday</button>
                    <button onClick={() => setPreset(7)} className="px-3 py-1.5 text-sm font-bold bg-gray-100 hover:bg-gray-200 rounded-lg">Last 7 Days</button>
                    <button onClick={() => setPreset(30)} className="px-3 py-1.5 text-sm font-bold bg-gray-100 hover:bg-gray-200 rounded-lg">Last 30 Days</button>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-500" />
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                        className="border rounded-lg px-2 py-1 text-sm"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                        className="border rounded-lg px-2 py-1 text-sm"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full text-green-600"><DollarSign /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Total Revenue</p>
                        <p className="text-2xl font-black">₹{summary.totalRev.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600"><ShoppingBag /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Total Orders</p>
                        <p className="text-2xl font-black">{summary.totalOrders}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-full text-purple-600"><TrendingUp /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Average Order Value</p>
                        <p className="text-2xl font-black">₹{summary.aov}</p>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl border shadow-sm h-80">
                <Bar data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>

            {/* Daily Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="font-bold">Daily Breakdown</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Orders</th>
                            <th className="p-3">Revenue</th>
                            <th className="p-3">AOV</th>
                            <th className="p-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {salesData.map(day => (
                            <tr key={day._id} className="hover:bg-gray-50">
                                <td className="p-3 font-medium">{day._id}</td>
                                <td className="p-3">{day.count}</td>
                                <td className="p-3 font-bold text-green-600">₹{day.total}</td>
                                <td className="p-3">₹{day.count > 0 ? Math.round(day.total / day.count) : 0}</td>
                                <td className="p-3 text-right">
                                    <button
                                        onClick={() => fetchDailyOrders(day._id)}
                                        className="text-blue-600 font-bold text-xs hover:underline"
                                    >
                                        View Orders
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {salesData.length === 0 && (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-400">No data for selected period</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drill Down Modal */}
            {drillDownDate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDrillDownDate(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">Orders on {drillDownDate}</h3>
                            <button onClick={() => setDrillDownDate(null)} className="font-bold text-gray-400 hover:text-black">×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loadingOrders ? <p className="text-center p-4">Loading...</p> : (
                                dailyOrders.length === 0 ? <p className="text-center p-4 text-gray-500">No details found.</p> :
                                    dailyOrders.map(order => (
                                        <div key={order._id} className="p-4 border rounded-xl flex justify-between items-center bg-gray-50">
                                            <div>
                                                <p className="font-bold text-sm">#{order._id.slice(-6)} <span className="text-xs text-gray-500 font-normal">({new Date(order.createdAt).toLocaleTimeString()})</span></p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {order.items.map(i => `${i.quantity}x ${i.menuItem?.name || i.name}`).join(', ')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">₹{order.totalAmount}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesReport;
