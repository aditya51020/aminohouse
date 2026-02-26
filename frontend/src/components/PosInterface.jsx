import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, Smartphone, Printer, RefreshCw, User, X, Download } from 'lucide-react';
import api from '../utils/axios';
import adminApi from '../utils/adminAxios';
import CustomerSelector from './CustomerSelector';

const PosInterface = ({ menuItems }) => {
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [processing, setProcessing] = useState(false);
    const [customer, setCustomer] = useState(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showCustomerCapture, setShowCustomerCapture] = useState(false);
    const [captureForm, setCaptureForm] = useState({ name: '', phone: '', email: '' });
    const [config, setConfig] = useState({
        currency: '₹', taxName: 'Tax', taxRate: 0, storeName: 'FuelBar', address: '', phone: ''
    });

    useEffect(() => {
        api.get('/settings/config')
            .then(res => { if (res.data) setConfig(res.data); })
            .catch(console.error);
    }, []);

    const categories = ['All', ...new Set(menuItems.map(item => item.category))];

    const filteredMenu = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [menuItems, searchQuery, selectedCategory]);

    const addToCart = (item) => {
        if (!item.inStock) return alert('Item out of stock!');
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId) => setCart(prev => prev.filter(i => i._id !== itemId));

    const updateQuantity = (itemId, delta) => {
        setCart(prev => prev.map(i => {
            if (i._id === itemId) return { ...i, quantity: Math.max(1, i.quantity + delta) };
            return i;
        }));
    };

    const calculateSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculateTax = () => (calculateSubtotal() * config.taxRate) / 100;
    const calculateTotal = () => calculateSubtotal() + calculateTax();

    const placeOrderWithCustomer = async (attachedCustomer) => {
        setProcessing(true);
        try {
            const orderData = {
                items: cart.map(i => ({ menuItem: i._id, quantity: i.quantity, price: i.price })),
                totalAmount: calculateTotal(),
                subtotal: calculateSubtotal(),
                tax: calculateTax(),
                sessionId: `POS-${Date.now()}`,
                customer: attachedCustomer ? (attachedCustomer.id || attachedCustomer._id) : null,
                paymentMethod,
                status: 'Paid'
            };
            const res = await api.post('/orders', orderData);
            if (res.status === 201) {
                alert('Order Placed Successfully!');
                handlePrintBill(res.data.order || { ...orderData, _id: 'NEW-ORDER' }, attachedCustomer);
                setCart([]);
                setCustomer(null);
                setCaptureForm({ name: '', phone: '', email: '' });
            }
        } catch (err) {
            alert('Failed to place order: ' + (err.response?.data?.message || err.message));
        } finally {
            setProcessing(false);
        }
    };

    const handlePlaceOrder = () => {
        if (cart.length === 0) return;
        if (!customer) {
            setShowCustomerCapture(true);
        } else {
            placeOrderWithCustomer(customer);
        }
    };

    const handleCustomerCaptureSubmit = async (e) => {
        e.preventDefault();
        setShowCustomerCapture(false);
        if (!captureForm.phone) {
            placeOrderWithCustomer(null);
            return;
        }
        try {
            const searchRes = await adminApi.get(`/customers?query=${captureForm.phone}`);
            let found = searchRes.data.find(c => c.phone === captureForm.phone);
            if (!found && captureForm.name) {
                const createRes = await adminApi.post('/customers', {
                    name: captureForm.name,
                    phone: captureForm.phone,
                    email: captureForm.email || undefined
                });
                found = createRes.data;
            }
            setCustomer(found || null);
            placeOrderWithCustomer(found || null);
        } catch (err) {
            console.error('Customer save error:', err);
            placeOrderWithCustomer(null);
        }
    };

    const handleDownloadCSV = async () => {
        try {
            const res = await adminApi.get('/customers/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('CSV download failed: ' + err.message);
        }
    };

    const handlePrintBill = (order, attachedCustomer) => {
        const cust = attachedCustomer || customer;
        const printWindow = window.open('', '', 'height=600,width=400');
        const total = calculateTotal().toFixed(2);
        const subtotal = calculateSubtotal().toFixed(2);
        const tax = calculateTax().toFixed(2);
        if (!printWindow) { alert('Please allow popups to print the receipt'); return; }

        printWindow.document.write('<html><head><title>Receipt</title>');
        printWindow.document.write('<style>body{font-family:monospace;padding:20px;}.line{display:flex;justify-content:space-between;border-bottom:1px dashed #ccc;padding:5px 0;}.total{font-weight:bold;border-top:2px solid #000;margin-top:10px;padding-top:10px;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h2 style="text-align:center;margin-bottom:5px;">${config.storeName}</h2>`);
        if (config.address) printWindow.document.write(`<p style="text-align:center;font-size:12px;margin:0;">${config.address}</p>`);
        if (config.phone) printWindow.document.write(`<p style="text-align:center;font-size:12px;margin:0;">Ph: ${config.phone}</p>`);
        printWindow.document.write('<hr/>');
        printWindow.document.write(`<p style="text-align:center">Order #${order._id ? order._id.slice(-6) : '---'}<br>${new Date().toLocaleString()}</p>`);
        if (cust) printWindow.document.write(`<p style="text-align:center;font-size:12px;font-weight:bold;margin:5px 0;">Customer: ${cust.name} | ${cust.phone}</p>`);
        cart.forEach(item => {
            printWindow.document.write(`<div class="line"><span>${item.quantity}x ${item.name}</span><span>${config.currency}${(item.price * item.quantity).toFixed(2)}</span></div>`);
        });
        printWindow.document.write(`<div class="line" style="border:none;margin-top:10px;"><span>Subtotal</span><span>${config.currency}${subtotal}</span></div>`);
        printWindow.document.write(`<div class="line" style="border:none;"><span>${config.taxName} (${config.taxRate}%)</span><span>${config.currency}${tax}</span></div>`);
        printWindow.document.write(`<div class="line total"><span>TOTAL</span><span>${config.currency}${total}</span></div>`);
        printWindow.document.write(`<p style="text-align:center;margin-top:20px;">Paid via: ${paymentMethod.toUpperCase()}</p>`);
        printWindow.document.write('<p style="text-align:center">Thank you!</p>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4 px-4 pb-4">

            {/* Customer Capture Modal */}
            {showCustomerCapture && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Customer Details</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Phone required to save. Skip to proceed without saving.</p>
                            </div>
                            <button onClick={() => { setShowCustomerCapture(false); placeOrderWithCustomer(null); }}
                                className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCustomerCaptureSubmit} className="space-y-3">
                            <input
                                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Customer Name"
                                value={captureForm.name}
                                onChange={e => setCaptureForm({ ...captureForm, name: e.target.value })}
                            />
                            <input
                                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Phone Number *"
                                value={captureForm.phone}
                                onChange={e => setCaptureForm({ ...captureForm, phone: e.target.value })}
                            />
                            <input
                                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Email (optional)"
                                type="email"
                                value={captureForm.email}
                                onChange={e => setCaptureForm({ ...captureForm, email: e.target.value })}
                            />
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowCustomerCapture(false); placeOrderWithCustomer(null); }}
                                    className="flex-1 border rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Skip
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-black text-white rounded-xl py-2.5 text-sm font-bold hover:bg-gray-800"
                                >
                                    Save & Place Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LEFT: MENU GRID */}
            <div className="w-2/3 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex-shrink-0 px-4 py-2 text-sm font-bold rounded-full transition-colors ${selectedCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 xl:grid-cols-4 gap-4 bg-gray-50/50">
                    {filteredMenu.map(item => (
                        <div
                            key={item._id}
                            onClick={() => addToCart(item)}
                            className={`bg-white p-3 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between h-32 relative overflow-hidden group ${!item.inStock ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <div className="w-16 h-16 rounded-full bg-blue-100 -mr-8 -mt-8"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 leading-tight line-clamp-2">{item.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-lg text-blue-600">{config.currency}{item.price}</span>
                                {item.inStock ? (
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Plus size={16} />
                                    </div>
                                ) : (
                                    <span className="text-xs text-red-500 font-bold">OOS</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: TICKET */}
            <div className="w-1/3 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        Ticket
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{cart.length}</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        {/* CSV Download */}
                        <button
                            onClick={handleDownloadCSV}
                            title="Download Customer CSV"
                            className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-1.5 rounded-lg font-bold hover:bg-green-100 flex items-center gap-1"
                        >
                            <Download size={13} /> CSV
                        </button>

                        {customer ? (
                            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-800">{customer.name}</p>
                                    <p className="text-[10px] text-yellow-700 font-bold">{customer.phone}</p>
                                </div>
                                <button onClick={() => setCustomer(null)} className="text-red-500 hover:bg-white rounded-full p-1"><X size={12} /></button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCustomerModal(true)}
                                className="text-xs bg-white border px-3 py-1.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 flex items-center gap-1 shadow-sm"
                            >
                                <User size={14} /> Add User
                            </button>
                        )}
                    </div>
                </div>

                {showCustomerModal && (
                    <CustomerSelector
                        onSelect={(c) => { setCustomer(c); setShowCustomerModal(false); }}
                        onClose={() => setShowCustomerModal(false)}
                    />
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <RefreshCw size={48} className="mb-2" />
                            <p>Ticket is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item._id} className="flex justify-between items-center group">
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-blue-600 font-mono">{config.currency}{item.price} x {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-900">{config.currency}{item.price * item.quantity}</span>
                                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                        <button onClick={() => updateQuantity(item._id, -1)} className="p-1 hover:bg-white rounded shadow-sm"><Minus size={14} /></button>
                                        <button onClick={() => removeFromCart(item._id)} className="p-1 text-red-500 hover:bg-white rounded shadow-sm"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t space-y-4">
                    <div className="space-y-1 text-sm text-gray-600 border-b pb-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{config.currency}{calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span>{config.taxName} ({config.taxRate}%)</span>
                            <span>{config.currency}{calculateTax().toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setPaymentMethod('cash')} className={`flex flex-col items-center justify-center py-2 rounded-lg border text-xs font-semibold transition ${paymentMethod === 'cash' ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-gray-50'}`}>
                            <Banknote size={18} className="mb-1" /> CASH
                        </button>
                        <button onClick={() => setPaymentMethod('upi')} className={`flex flex-col items-center justify-center py-2 rounded-lg border text-xs font-semibold transition ${paymentMethod === 'upi' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}>
                            <Smartphone size={18} className="mb-1" /> UPI
                        </button>
                        <button onClick={() => setPaymentMethod('card')} className={`flex flex-col items-center justify-center py-2 rounded-lg border text-xs font-semibold transition ${paymentMethod === 'card' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white hover:bg-gray-50'}`}>
                            <CreditCard size={18} className="mb-1" /> CARD
                        </button>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="text-left">
                            <p className="text-xs text-gray-500">Total Payable</p>
                            <p className="text-2xl font-black text-gray-900">{config.currency}{calculateTotal().toFixed(2)}</p>
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={cart.length === 0 || processing}
                            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:scale-100"
                        >
                            {processing ? 'Processing...' : (<><Printer size={18} /> PRINT BILL</>)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PosInterface;
