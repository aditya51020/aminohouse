import React, { useState } from 'react';
import { Plus, Minus, X, AlertTriangle, Save } from 'lucide-react';
import adminApi from '../utils/adminAxios';

const StockManager = ({ ingredient, onClose, onUpdate }) => {
    const [mode, setMode] = useState('add'); // 'add', 'remove', 'set'
    const [amount, setAmount] = useState('');
    const [cost, setCost] = useState(ingredient.costPerUnit || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || isNaN(amount) || amount < 0) return alert('Invalid amount');

        setLoading(true);
        try {
            let newStock = ingredient.currentStock;
            const val = parseFloat(amount);

            if (mode === 'add') newStock += val;
            if (mode === 'remove') newStock = Math.max(0, newStock - val);
            if (mode === 'set') newStock = val; // Also supports Cost Set if we wanted, but let's keep it simple

            // If updating cost
            const newCost = cost ? parseFloat(cost) : ingredient.costPerUnit;

            const res = await adminApi.put(`/ingredients/${ingredient._id}`, {
                ...ingredient,
                currentStock: newStock,
                costPerUnit: newCost
            });

            onUpdate(res.data);
            onClose();
        } catch (err) {
            alert('Failed to update stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg">Manage Stock</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={20} /></button>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${ingredient.currentStock <= ingredient.lowStockThreshold ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}>
                            {ingredient.currentStock}
                        </div>
                        <div>
                            <p className="font-bold text-lg leading-none">{ingredient.name}</p>
                            <p className="text-sm text-gray-500">{ingredient.unit} • Alert: {ingredient.lowStockThreshold}</p>
                        </div>
                    </div>

                    {/* Mode Toggles */}
                    <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
                        {['add', 'remove', 'set'].map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`py-2 text-xs font-bold rounded-lg capitalize transition-all ${mode === m ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {m} Stock
                            </button>
                        ))}
                    </div>

                    <div className="relative mb-4">
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Enter stock amount"
                            autoFocus
                            className="w-full text-center text-3xl font-bold py-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                            {ingredient.unit}
                        </span>
                    </div>

                    {/* Cost Input */}
                    <div className="relative mb-6">
                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Cost Per {ingredient.unit}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                            <input
                                type="number"
                                value={cost}
                                onChange={e => setCost(e.target.value)}
                                placeholder={ingredient.costPerUnit || '0'}
                                className="w-full pl-8 py-2 border-2 border-gray-100 rounded-xl focus:border-black focus:outline-none font-bold"
                            />
                        </div>
                    </div>

                    {/* Prediction Preview */}
                    {amount && !isNaN(amount) && (
                        <div className="mb-4 text-center text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                            New Level: <span className="font-bold text-gray-900">
                                {mode === 'add' ? ingredient.currentStock + parseFloat(amount) :
                                    mode === 'remove' ? Math.max(0, ingredient.currentStock - parseFloat(amount)) :
                                        parseFloat(amount)}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !amount}
                        className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <Save size={18} />
                                Confirm Update
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockManager;
