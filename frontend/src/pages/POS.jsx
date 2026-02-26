import React, { useState, useEffect } from 'react';
import adminApi from '../utils/adminAxios';
import axios from '../utils/axios';
import PosInterface from '../components/PosInterface';
import { LogOut } from 'lucide-react';

const POS = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [kitchenOpen, setKitchenOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Auth Check
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            window.location.href = '/admin/login';
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Menu
                const menuResponse = await adminApi.get('/menu');
                setMenuItems(menuResponse.data.map(item => ({
                    ...item,
                    inStock: item.inStock ?? true,
                })));

                // Fetch Kitchen Status
                try {
                    const settingRes = await axios.get('/settings/status');
                    setKitchenOpen(settingRes.data.open);
                } catch (e) {
                    console.error("Setting fetch failed", e);
                }

            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('userRole');
                    window.location.href = '/admin/login';
                } else {
                    setError('Failed to load POS data');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Polling for updates (optional but good for POS)
        const pollInterval = setInterval(() => {
            adminApi.get('/menu').then(res => {
                setMenuItems(res.data);
            }).catch(() => { });
        }, 15000);

        return () => clearInterval(pollInterval);
    }, []);


    if (loading) return <div className="flex h-screen items-center justify-center text-xl font-bold text-gray-500">Loading POS System...</div>;
    if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Minimal Header for POS */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">POS TERMINAL</h1>
                    <p className="text-xs text-gray-500 font-medium">CASHIER MODE</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${kitchenOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {kitchenOpen ? 'KITCHEN OPEN' : 'KITCHEN CLOSED'}
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem('adminToken');
                            window.location.href = '/admin/login';
                        }}
                        className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-hidden">
                <PosInterface menuItems={menuItems} kitchenOpen={kitchenOpen} />
            </div>
        </div>
    );
};

export default POS;
