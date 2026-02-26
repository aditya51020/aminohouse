import React, { useState } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, Flame, Bell } from 'lucide-react';

const KitchenDisplay = ({ orders, onUpdateStatus }) => {
    // Columns
    const columns = [
        { id: 'Pending', label: 'PENDING', icon: Bell, color: 'orange' },
        { id: 'Cooking', label: 'COOKING', icon: Flame, color: 'blue' },
        { id: 'Ready', label: 'READY TO SERVE', icon: CheckCircle, color: 'green' }
    ];

    const getElapsedTime = (createdAt) => {
        const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
        return diff < 1 ? 'Just now' : `${diff}m ago`;
    };

    return (
        <div className="flex gap-4 h-[calc(100vh-200px)] overflow-x-auto pb-4">
            {columns.map(col => {
                const colOrders = orders
                    .filter(o => o.status === col.id)
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                return (
                    <div key={col.id} className="min-w-[320px] flex-1 bg-gray-100 rounded-xl flex flex-col max-h-full">
                        {/* Header */}
                        <div className={`p-4 border-b border-gray-200 bg-${col.color}-100 rounded-t-xl flex justify-between items-center`}>
                            <h3 className={`font-black text-${col.color}-800 flex items-center gap-2`}>
                                <col.icon size={20} />
                                {col.label}
                            </h3>
                            <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                                {colOrders.length}
                            </span>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {colOrders.map(order => (
                                <div key={order._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow animate-scale-in">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="font-bold text-gray-900 block">#{order._id.slice(-4)}</span>
                                            <span className="text-xs text-gray-500">{order.customer?.name || order.guestDetails?.name || 'Guest'}</span>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded bg-${col.color}-50 text-${col.color}-700 flex items-center gap-1`}>
                                            <Clock size={12} /> {getElapsedTime(order.createdAt)}
                                        </span>
                                    </div>

                                    {/* Items */}
                                    <div className="space-y-2 mb-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 text-sm">
                                                <span className="font-black w-6">{item.quantity}x</span>
                                                <span className="text-gray-700 leading-snug">{item.menuItem?.name || 'Unknown'}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-3 border-t flex gap-2">
                                        {col.id === 'Pending' && (
                                            <button
                                                onClick={() => onUpdateStatus(order._id, 'Cooking')}
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-700"
                                            >
                                                Start Cooking
                                            </button>
                                        )}
                                        {col.id === 'Cooking' && (
                                            <button
                                                onClick={() => onUpdateStatus(order._id, 'Ready')}
                                                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-green-700"
                                            >
                                                Mark Ready
                                            </button>
                                        )}
                                        {col.id === 'Ready' && (
                                            <button
                                                onClick={() => onUpdateStatus(order._id, 'Served')}
                                                className="flex-1 bg-gray-800 text-white py-2 rounded-lg font-bold text-sm hover:bg-gray-900"
                                            >
                                                Served
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {colOrders.length === 0 && (
                                <div className="text-center p-8 text-gray-400 text-sm italic">
                                    No orders in {col.label}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default KitchenDisplay;
