import React, { useState, useEffect } from 'react';
import adminApi from '../utils/adminAxios';
import { User, Shield, Trash2, Key } from 'lucide-react';

const StaffManager = () => {
    const [staff, setStaff] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'cashier' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        // We need an endpoint to list users. I might need to add this to authRoutes/authController first.
        // For now, I'll assume I'll create it.
        try {
            const res = await adminApi.get('/auth/users');
            setStaff(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async () => {
        if (!formData.username || !formData.password) return alert('Fill all fields');
        setLoading(true);
        try {
            await adminApi.post('/auth/register', formData);
            alert('Staff created!');
            setShowAdd(false);
            setFormData({ username: '', password: '', role: 'cashier' });
            fetchStaff();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this user?')) return;
        try {
            await adminApi.delete(`/auth/users/${id}`);
            setStaff(staff.filter(u => u._id !== id));
        } catch (err) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Staff Management</h2>
                    <p className="text-sm text-gray-500">Create accounts for your Cashiers and Kitchen staff.</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm"
                >
                    + Add New Staff
                </button>
            </div>

            {/* ADD MODAL */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4">Add New User</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500">Username</label>
                                <input
                                    className="w-full border p-2 rounded-lg"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Password</label>
                                <input
                                    type="password"
                                    className="w-full border p-2 rounded-lg"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Role</label>
                                <select
                                    className="w-full border p-2 rounded-lg"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="cashier">Cashier (POS Only)</option>
                                    <option value="kitchen">Kitchen (KDS Only)</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-2"
                            >
                                {loading ? 'Creating...' : 'Create Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map(user => (
                    <div key={user._id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.role === 'admin' ? 'bg-red-500' :
                                user.role === 'kitchen' ? 'bg-orange-500' : 'bg-blue-500'
                                }`}>
                                <User size={20} />
                            </div>
                            <div>
                                <p className="font-bold">{user.username}</p>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded uppercase font-bold text-gray-500">{user.role}</span>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(user._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StaffManager;
