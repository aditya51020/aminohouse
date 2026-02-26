import React, { useState, useEffect } from 'react';
import adminApi from '../utils/adminAxios';
import { Trash2, Copy, Plus } from 'lucide-react';

const CouponManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        type: 'flat', // or 'percent'
        value: '',
        expiryDate: '',
        minOrderValue: 0,
        usageLimit: 0 // 0 for unlimited
    });

    const fetchCoupons = async () => {
        try {
            const res = await adminApi.get('/coupons');
            setCoupons(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreate = async () => {
        if (!newCoupon.code || !newCoupon.value || !newCoupon.expiryDate) return alert('Fill required fields');

        try {
            setLoading(true);
            await adminApi.post('/coupons', newCoupon);
            await fetchCoupons();
            setNewCoupon({ code: '', type: 'flat', value: '', expiryDate: '', minOrderValue: 0, usageLimit: 0 });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create coupon');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete coupon?')) return;
        try {
            await adminApi.delete(`/coupons/${id}`);
            setCoupons(coupons.filter(c => c._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold mb-4">Coupon Management</h2>

            {/* CREATE FORM */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500">Code</label>
                    <input
                        value={newCoupon.code}
                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                        className="w-full p-2 border rounded uppercase font-mono"
                        placeholder="SAVE50"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500">Type</label>
                    <select
                        value={newCoupon.type}
                        onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })}
                        className="w-full p-2 border rounded"
                    >
                        <option value="flat">Flat ₹</option>
                        <option value="percent">% Off</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500">Value</label>
                    <input
                        type="number"
                        value={newCoupon.value}
                        onChange={e => setNewCoupon({ ...newCoupon, value: e.target.value })}
                        className="w-full p-2 border rounded"
                        placeholder="50"
                    />
                </div>
                <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500">Expiry Date</label>
                    <input
                        type="date"
                        value={newCoupon.expiryDate}
                        onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="col-span-6 flex justify-end">
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                        <Plus size={16} /> Create Coupon
                    </button>
                </div>
            </div>

            {/* LIST */}
            <div className="space-y-3">
                {coupons.length === 0 && <p className="text-gray-400 text-sm">No active coupons.</p>}
                {coupons.map(coupon => (
                    <div key={coupon._id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                            <div className="flex gap-2 items-center">
                                <span className="font-mono font-bold text-lg">{coupon.code}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${new Date(coupon.expiryDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {new Date(coupon.expiryDate) < new Date() ? 'Expired' : 'Active'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">
                                {coupon.type === 'flat' ? `₹${coupon.value} OFF` : `${coupon.value}% OFF`} • Expires {new Date(coupon.expiryDate).toLocaleDateString()}
                            </p>
                        </div>
                        <button onClick={() => handleDelete(coupon._id)} className="text-red-500 p-2 hover:bg-red-50 rounded">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CouponManager;
