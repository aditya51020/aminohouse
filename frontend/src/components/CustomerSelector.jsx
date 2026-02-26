import React, { useState } from 'react';
import { Search, UserPlus, Check, X } from 'lucide-react';
import adminApi from '../utils/adminAxios';

const CustomerSelector = ({ onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '' });

    const handleSearch = async (val) => {
        setQuery(val);
        if (val.length < 3) return;

        setLoading(true);
        try {
            const res = await adminApi.get(`/customers?query=${val}`);
            setResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await adminApi.post('/customers', formData);
            onSelect(res.data);
        } catch (err) {
            alert('Error creating customer');
        }
    };

    if (showRegister) {
        return (
            <div className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-2xl border p-4 z-50 animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold">New Customer</h3>
                    <button onClick={() => setShowRegister(false)}><X size={16} /></button>
                </div>
                <form onSubmit={handleRegister} className="space-y-3">
                    <input
                        className="w-full border p-2 rounded-lg"
                        placeholder="Name"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <input
                        className="w-full border p-2 rounded-lg"
                        placeholder="Phone"
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <button type="submit" className="w-full bg-black text-white py-2 rounded-lg font-bold">
                        Create & Attach
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-2xl border p-4 z-50 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Attach Customer</h3>
                <button onClick={onClose}><X size={16} /></button>
            </div>

            <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Search by Phone or Name..."
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
                {results.map(c => (
                    <button
                        key={c._id}
                        onClick={() => onSelect(c)}
                        className="w-full text-left p-2 hover:bg-blue-50 rounded-lg flex justify-between items-center group"
                    >
                        <div>
                            <p className="font-bold text-sm text-gray-800">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.phone}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">{c.points} pts</span>
                        </div>
                    </button>
                ))}

                {query.length > 2 && results.length === 0 && !loading && (
                    <div className="text-center py-4">
                        <p className="text-xs text-gray-400 mb-2">No customer found</p>
                        <button
                            onClick={() => { setShowRegister(true); setFormData({ name: '', phone: query }); }}
                            className="text-blue-600 text-sm font-bold flex items-center justify-center gap-1 w-full hover:bg-blue-50 py-2 rounded-lg"
                        >
                            <UserPlus size={16} /> Create New
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerSelector;
