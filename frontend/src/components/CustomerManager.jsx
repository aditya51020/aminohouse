import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { Search, UserPlus, Star, Edit, Trash2 } from 'lucide-react';
import adminApi from '../utils/adminAxios';

const CustomerManager = () => {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    const fetchCustomers = async () => {
        try {
            const res = await adminApi.get(`/customers?query=${search}`);
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await adminApi.post('/customers', formData);
            setShowAdd(false);
            setFormData({ name: '', phone: '', email: '' });
            fetchCustomers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add customer');
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                        className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Search by Name or Phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-gray-800"
                >
                    <UserPlus size={18} /> Add Customer
                </button>
            </div>

            {/* LIST */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-sm text-gray-500">Customer</th>
                            <th className="p-4 text-sm text-gray-500">Phone</th>
                            <th className="p-4 text-sm text-gray-500">Loyalty Points</th>
                            <th className="p-4 text-sm text-gray-500">Visits</th>
                            <th className="p-4 text-sm text-gray-500">Last Visit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(c => (
                            <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-bold text-gray-800">{c.name}</td>
                                <td className="p-4 text-gray-600">{c.phone}</td>
                                <td className="p-4">
                                    <span className="bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded-full text-xs flex items-center w-fit gap-1">
                                        <Star size={12} fill="currentColor" /> {c.points}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600">{c.visitCount}</td>
                                <td className="p-4 text-gray-500 text-sm">{c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {customers.length === 0 && <p className="text-center p-8 text-gray-400">No customers found.</p>}
            </div>

            {/* MODAL */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                className="w-full border p-3 rounded-lg"
                                placeholder="Full Name"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <input
                                className="w-full border p-3 rounded-lg"
                                placeholder="Phone Number"
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerManager;
