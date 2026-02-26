import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import adminApi from '../utils/adminAxios';
import { Save, Building, Receipt, CreditCard } from 'lucide-react';

const SettingsPanel = () => {
    const [config, setConfig] = useState({
        storeName: '',
        address: '',
        phone: '',
        currency: '₹',
        taxName: 'GST',
        taxRate: 5
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await adminApi.get('/settings/config');
            if (res.data) setConfig(res.data);
        } catch (err) {
            console.error("Settings fetch error:", err);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setMsg('');
        try {
            const res = await adminApi.put('/settings/config', config);
            setConfig(res.data);
            setMsg('Settings Saved Successfully!');
        } catch (err) {
            setMsg('Failed to save settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Global Settings</h2>
                    <p className="text-sm text-gray-500">Manage store details and tax configuration.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-all shadow-lg"
                >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {msg && <div className={`p-3 rounded-lg text-center font-bold ${msg.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{msg}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* STORE INFO */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-bold flex items-center gap-2 text-gray-700">
                        <Building size={20} /> Store Information
                    </h3>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Store Name</label>
                        <input
                            className="w-full border p-3 rounded-lg font-medium"
                            value={config.storeName}
                            onChange={e => setConfig({ ...config, storeName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
                        <textarea
                            className="w-full border p-3 rounded-lg font-medium h-24 resize-none"
                            value={config.address}
                            onChange={e => setConfig({ ...config, address: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Phone / Support</label>
                        <input
                            className="w-full border p-3 rounded-lg font-medium"
                            value={config.phone}
                            onChange={e => setConfig({ ...config, phone: e.target.value })}
                        />
                    </div>
                </div>

                {/* TAX & FINANCIAL */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-bold flex items-center gap-2 text-gray-700">
                        <Receipt size={20} /> Tax & Currency
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tax Name</label>
                            <input
                                className="w-full border p-3 rounded-lg font-medium"
                                placeholder="GST, VAT..."
                                value={config.taxName}
                                onChange={e => setConfig({ ...config, taxName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tax Rate (%)</label>
                            <input
                                type="number"
                                className="w-full border p-3 rounded-lg font-medium"
                                value={config.taxRate}
                                onChange={e => setConfig({ ...config, taxRate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Currency Symbol</label>
                        <input
                            className="w-full border p-3 rounded-lg font-medium"
                            value={config.currency}
                            onChange={e => setConfig({ ...config, currency: e.target.value })}
                        />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-xs text-blue-700 font-bold">Preview Calculation</p>
                        <div className="flex justify-between mt-2 text-sm">
                            <span>Item Price:</span>
                            <span>{config.currency}100.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>{config.taxName} ({config.taxRate}%):</span>
                            <span>{config.currency}{(100 * (config.taxRate / 100)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold mt-1 border-t pt-1 border-blue-200">
                            <span>Total:</span>
                            <span>{config.currency}{(100 * (1 + config.taxRate / 100)).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
