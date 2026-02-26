import React, { useState, useEffect } from 'react';
import adminApi from '../utils/adminAxios';
import { DollarSign, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

const ProfitReport = () => {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await adminApi.get('/menu/analysis');
            // Sort by margin low to high (problem areas first)
            setReport(res.data.sort((a, b) => a.margin - b.margin));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black mb-1">Profit Analysis</h2>
                    <p className="text-gray-400 text-sm">Optimize your menu margins by tracking food costs.</p>
                </div>
                <button onClick={fetchReport} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold">
                    Refresh Data
                </button>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="p-4">Dish</th>
                            <th className="p-4">Selling Price</th>
                            <th className="p-4">Food Cost (COGS)</th>
                            <th className="p-4">Net Profit</th>
                            <th className="p-4">Margin %</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {report.map(item => {
                            let statusColor = 'text-yellow-600 bg-yellow-100';
                            let statusText = 'Fair';
                            if (item.margin >= 70) { statusColor = 'text-green-600 bg-green-100'; statusText = 'Excellent'; }
                            else if (item.margin <= 30) { statusColor = 'text-red-600 bg-red-100'; statusText = 'Critical'; }

                            // If cost is 0, warn user
                            const isCostMissing = item.cost === 0 && item.price > 0;

                            return (
                                <tr key={item._id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.category}</p>
                                    </td>
                                    <td className="p-4 font-bold">₹{item.price}</td>
                                    <td className="p-4 font-medium text-gray-600">
                                        {isCostMissing ? (
                                            <span className="flex items-center gap-1 text-orange-500 text-xs font-bold">
                                                <AlertCircle size={14} /> Needs Data
                                            </span>
                                        ) : (
                                            `₹${item.cost}`
                                        )}
                                    </td>
                                    <td className="p-4 font-bold text-gray-900">₹{item.profit}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${item.margin >= 70 ? 'bg-green-500' : item.margin <= 30 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                                    style={{ width: `${Math.min(item.margin, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-bold">{item.margin}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-black uppercase ${statusColor}`}>
                                            {statusText}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {report.length === 0 && !loading && <div className="p-8 text-center text-gray-400">No items found.</div>}
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-800">
                <AlertCircle className="shrink-0" size={20} />
                <p>
                    <strong>Tip:</strong> Margins appear as 100% or "Needs Data" if you haven't set ingredient costs yet.
                    Go to the <strong>Inventory</strong> tab, click "Manage" on ingredients (like Buns, Patties) and set their <strong>Cost Per Unit</strong>.
                    The profit calculation will update automatically!
                </p>
            </div>
        </div>
    );
};

export default ProfitReport;
