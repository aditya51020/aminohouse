// Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import adminApi from '../utils/adminAxios';
import axios from '../utils/axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import StockManager from '../components/StockManager';
import KitchenDisplay from '../components/KitchenDisplay';

const SalesReport = React.lazy(() => import('../components/SalesReport'));
const ProfitReport = React.lazy(() => import('../components/ProfitReport'));

import StaffManager from '../components/StaffManager';
import SettingsPanel from '../components/SettingsPanel';
import CustomerManager from '../components/CustomerManager';
import CouponManager from '../components/CouponManager';
import AdManager from '../components/AdManager';
import ComboManager from '../components/ComboManager';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { User, ChevronDown, Lock, LogOut, TrendingUp, DollarSign, ShoppingBag, CreditCard, Clock, Monitor, Users, Settings, Heart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [salesData, setSalesData] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [showKDS, setShowKDS] = useState(false);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('admin');
  const [activeTab, setActiveTab] = useState('overview');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuItem, setMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    cost: '', // Manual Cost
    category: '',
    imageUrl: '',
    inStock: true,
    quantity: 100,
    lowStockThreshold: 10,
    recipe: [],
    preparationSteps: '',
    station: 'Other',
    availability: { isTimeBound: false, start: '00:00', end: '23:59' }
  });
  const [editItemId, setEditItemId] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [prepSuggestions, setPrepSuggestions] = useState({});
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'g', currentStock: 0, costPerUnit: 0, lowStockThreshold: 10, manufacturer: '' });
  const [kitchenOpen, setKitchenOpen] = useState(true);
  const canEditMenu = userRole === 'admin';

  const { addToast } = useToast();

  // Lazy Components (defined outside or memoized if dynamic imports)
  // For now, let's just stick to standard imports but lazy render data.

  // === Helpers ===
  const fetchMenu = async () => {
    const menuResponse = await adminApi.get('/menu');
    setMenuItems(menuResponse.data.map(item => ({ ...item, inStock: item.inStock ?? true })));
  };


  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');

    if (!adminToken) {
      window.location.href = '/admin/login';
      return;
    }


    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const salesResponse = await adminApi.get(`/orders/sales?period=${period}`);
        setSalesData(salesResponse.data);

        const ordersResponse = await adminApi.get('/orders');
        setOrders(ordersResponse.data.orders || []);

        const menuResponse = await adminApi.get('/menu');
        setMenuItems(menuResponse.data.map(item => ({
          ...item,
          inStock: item.inStock ?? true,
        })));

        const ingRes = await adminApi.get('/ingredients');
        setIngredients(ingRes.data);

        try {
          const settingRes = await adminApi.get('/settings/status');
          setKitchenOpen(settingRes.data.open);
        } catch (e) { console.error("Setting fetch failed", e); }

        try {
          const prepRes = await adminApi.get('/ingredients/prep');
          setPrepSuggestions(prepRes.data);
        } catch (e) {
          console.error("Prep fetch failed", e);
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('userRole');
          window.location.href = '/admin/login';
        } else {
          setError('Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  useEffect(() => {
    const handleClick = () => setShowDropdown(false);
    if (showDropdown) {
      document.addEventListener('click', handleClick);
    }
    return () => document.removeEventListener('click', handleClick);
  }, [showDropdown]);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      // Silent refresh for stock levels
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const handleError = (err) => {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('userRole');
          window.location.href = '/admin/login';
        }
      };

      adminApi.get('/menu').then(res => {
        setMenuItems(prev => res.data);
      }).catch(handleError);

      adminApi.get('/ingredients').then(res => {
        setIngredients(res.data);
      }).catch(handleError);

      adminApi.get('/ingredients/prep').then(res => {
        setPrepSuggestions(res.data);
      }).catch(handleError);
    }, 15000); // 15 seconds

    return () => clearInterval(pollInterval);
  }, []);

  // === Image Upload ===
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please select an image');
    if (file.size > 5 * 1024 * 1024) return alert('Image size must be < 5MB');
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append('image', imageFile);
    try {
      setUploadingImage(true);
      const res = await adminApi.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.imageUrl;
    } catch (err) {
      alert('Image upload failed');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // === Menu CRUD ===
  const handleAddMenuItem = async () => {
    if (!menuItem.name || !menuItem.price || !menuItem.category) return;

    try {
      setLoading(true);
      let imageUrl = menuItem.imageUrl;
      if (imageFile) {
        const uploaded = await uploadImage();
        if (!uploaded) return;
        imageUrl = uploaded;
      }

      const data = {
        ...menuItem,
        price: Number(menuItem.price),
        imageUrl,
        inStock: menuItem.inStock,
        quantity: Number(menuItem.quantity),
        lowStockThreshold: Number(menuItem.lowStockThreshold)
      };

      if (editItemId) {
        await adminApi.put(`/menu/${editItemId}`, data);
        addToast('Item updated!', 'success');
      } else {
        await adminApi.post('/menu', data);
        addToast('Item added!', 'success');
      }
      await fetchMenu(); // re-fetch to get fresh data with correct ids
      resetForm();
    } catch (err) {
      addToast('Save failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMenuItem({
      name: '', description: '', price: '', category: '', imageUrl: '',
      inStock: true, quantity: 100, lowStockThreshold: 10, recipe: [],
      recipeName: '', preparationSteps: '', station: 'Other'
    });
    setImageFile(null);
    setImagePreview(null);
    setEditItemId(null);
    setShowAddIngredient(false);
    setShowAddMenu(false);
  };

  const handleEditMenuItem = (item) => {
    setMenuItem({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl || '',
      inStock: item.inStock ?? true,
      quantity: item.quantity || 0,
      lowStockThreshold: item.lowStockThreshold || 10,
      recipe: item.recipe || [],
      recipeName: item.recipeName || '',
      preparationSteps: item.preparationSteps || '',
      station: item.station || 'Other'
    });
    setImagePreview(item.imageUrl || null);
    setEditItemId(item.id);
    setShowAddMenu(true);
    setActiveTab('menu');
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      setLoading(true);
      await adminApi.delete(`/menu/${id}`);
      await fetchMenu(); // re-fetch so state is accurate
    } catch (err) {
      addToast('Delete failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = async (id) => {
    const item = menuItems.find(i => i.id === id);
    const updated = { ...item, inStock: !item.inStock };
    try {
      const res = await axios.put(`/menu/${id}/stock`, updated);
      setMenuItems(menuItems.map(i => i.id === id ? res.data : i));
    } catch (err) {
      addToast('Stock update failed', 'error');
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      setLoading(true);
      const res = await axios.put(`/orders/${id}`, { status });
      setOrders(orders.map(o => o.id === id ? res.data : o));
    } catch (err) {
      addToast('Status update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePass = async () => {
    if (!oldPass || !newPass) return setMsg('Fill both fields');
    try {
      await adminApi.put('/auth/update-password', { oldPassword: oldPass, newPassword: newPass });
      setMsg('Password updated!');
      setOldPass(''); setNewPass('');
      setTimeout(() => setShowPassModal(false), 1500);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  const handleKitchenToggle = async () => {
    try {
      const res = await adminApi.post('/settings/status', { open: !kitchenOpen });
      setKitchenOpen(res.data.open);
    } catch (err) {
      addToast('Failed to toggle kitchen', 'error');
    }
  };

  const handleExport = (type) => {
    const data = type === 'sales' ? salesData : orders;
    const csvContent = "data:text/csv;charset=utf-8,"
      + data.map(e => Object.values(e).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_export.csv`);
    document.body.appendChild(link);
    link.click();
  };

  // === Chart ===
  const chartData = {
    labels: salesData.length > 0 ? salesData.map(d => d._id) : ['No Data'],
    datasets: [{
      label: 'Sales',
      data: salesData.length > 0 ? salesData.map(d => d.total) : [0],
      backgroundColor: 'rgba(22, 163, 74, 0.8)',
      borderRadius: 8,
    }],
  };

  const totalRevenue = salesData.reduce((s, d) => s + d.total, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => ['Pending', 'Accepted', 'Cooking', 'Ready'].includes(o.status)).length;
  const lowStockCount = menuItems.filter(i => i.quantity <= i.lowStockThreshold).length +
    ingredients.filter(i => i.currentStock <= i.lowStockThreshold).length;

  // ADVANCED ANALYTICS
  const insights = useMemo(() => {
    if (!orders.length) return { topItems: [], paymentStats: {}, aov: 0 };

    // 1. Top Items
    const itemMap = {};
    orders.forEach(o => {
      o.items.forEach(i => {
        const name = i.menuItem?.name || i.name || 'Unknown';
        itemMap[name] = (itemMap[name] || 0) + i.quantity;
      });
    });
    const topItems = Object.entries(itemMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5

    // 2. Payment Stats
    const paymentStats = { cash: 0, upi: 0, card: 0, other: 0 };
    orders.forEach(o => {
      const method = o.paymentMethod?.toLowerCase() || 'other';
      if (paymentStats[method] !== undefined) paymentStats[method]++;
      else paymentStats.other++;
    });

    // 3. AOV
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return { topItems, paymentStats, aov };
  }, [orders, totalRevenue, totalOrders]);

  const paymentChartData = {
    labels: ['Cash', 'UPI', 'Card', 'Other'],
    datasets: [
      {
        data: [
          insights.paymentStats.cash || 0,
          insights.paymentStats.upi || 0,
          insights.paymentStats.card || 0,
          insights.paymentStats.other || 0
        ],
        backgroundColor: ['#10B981', '#3B82F6', '#F97316', '#6B7280'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ... Header ... */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">DASHBOARD</h1>
              <p className="text-xs text-gray-500">AMINOHOUSE</p>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={handleKitchenToggle}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${kitchenOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
              >
                {kitchenOpen ? 'Cooking ON' : 'Kitchen PAUSED'}
              </button>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-lg transition"
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
              <button
                onClick={() => window.open('/pos', '_blank')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition"
              >
                Open POS
              </button>
              <div className="relative">
                {/* Dropdown Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2 text-sm font-medium"
                >
                  <User className="w-4 h-4" />

                  <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setShowPassModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-yellow-50 flex items-center gap-2 border-b"
                    >
                      <Lock className="w-4 h-4 text-yellow-600" />
                      Update Password
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem('adminToken');
                        window.location.href = '/admin/login';
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ... Tabs ... */}
          <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar">
            {['overview', 'orders', 'menu', 'inventory', 'prep', 'lowStock', 'sales', 'profit', 'staff', 'customers', 'combos', 'promotion', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'orders' && `Orders ${pendingOrders > 0 ? `(${pendingOrders})` : ''}`}
                {tab === 'menu' && 'Menu'}
                {tab === 'inventory' && 'Inventory'}
                {tab === 'prep' && 'Daily Prep'}
                {tab === 'lowStock' && `Low Stock ${lowStockCount > 0 ? `(${lowStockCount})` : ''}`}
                {tab === 'sales' && 'Sales Report'}

                {tab === 'profit' && 'Profit Analysis'}
                {tab === 'staff' && 'Staff & Roles'}
                {tab === 'customers' && 'CRM & Loyalty'}
                {tab === 'combos' && '🔥 Combos'}
                {tab === 'promotion' && 'Promotions & Ads'}
                {tab === 'settings' && 'Global Settings'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
      {loading && <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-600">Loading...</div>}


      {/* OVERVIEW */}
      {
        activeTab === 'overview' && (
          <div className="px-4 py-4 space-y-6">
            <div className="flex gap-2 justify-end">
              <button onClick={() => handleExport('sales')} className="px-3 py-1 bg-gray-200 text-xs font-bold rounded hover:bg-gray-300">Export Sales</button>
              <button onClick={() => handleExport('orders')} className="px-3 py-1 bg-gray-200 text-xs font-bold rounded hover:bg-gray-300">Export Orders</button>
            </div>

            {/* KEY METRICS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border shadow-sm">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Revenue</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">₹{totalRevenue}</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><DollarSign size={20} /></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Orders</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{totalOrders}</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg text-green-600"><ShoppingBag size={20} /></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Avg Order Value</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">₹{insights.aov}</p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><TrendingUp size={20} /></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pending</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{pendingOrders}</p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Clock size={20} /></div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sales Trend */}
              <div className="lg:col-span-2 bg-white rounded-xl p-6 border shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={16} /> Sales Trend
                </h2>
                <div className="h-64">
                  {loading ? (
                    <Skeleton className="w-full h-full rounded-lg" />
                  ) : (
                    <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  )}
                </div>
              </div>

              {/* Payment Distribution */}
              <div className="bg-white rounded-xl p-6 border shadow-sm flex flex-col">
                <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard size={16} /> Payment Methods
                </h2>
                <div className="flex-1 flex items-center justify-center relative">
                  <div className="h-48 w-48">
                    <Doughnut
                      data={paymentChartData}
                      options={{
                        cutout: '70%',
                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } }
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-gray-900">{totalOrders}</span>
                      <span className="text-xs text-gray-400">Txns</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: TOP ITEMS & RECENT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Items */}
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 mb-4">🏆 Top Selling Items</h2>
                <div className="space-y-4">
                  {insights.topItems.map(([name, count], idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-50 text-orange-700'}`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{name}</span>
                          <span className="font-bold text-gray-900">{count} sold</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${(count / insights.topItems[0][1]) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {insights.topItems.length === 0 && <p className="text-sm text-gray-400">No sales data yet.</p>}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 mb-4">Recent Activity</h2>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${order.status === 'Pending' ? 'bg-orange-500' :
                        order.status === 'Completed' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`}></div>
                      <div>
                        <p className="text-sm text-gray-800">
                          <span className="font-bold">New Order #{order.id?.slice(-4)}</span>
                          {' '}for ₹{order.totalAmount}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(order.customer?.name || order.guestDetails?.name || 'Guest')} via {order.paymentMethod} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-sm text-gray-400">No recent activity.</p>}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* ORDERS */}
      {
        activeTab === 'orders' && (
          <div className="px-4 py-4">
            <div className="bg-white rounded-xl border">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-base font-bold">Orders ({orders.length})</h2>
                <button
                  onClick={() => setShowKDS(!showKDS)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition ${showKDS ? 'bg-black text-white' : 'bg-gray-100'}`}
                >
                  <Monitor size={16} />
                  {showKDS ? 'Hide KDS' : 'Kitchen View'}
                </button>
              </div>

              {showKDS ? (
                <div className="p-4 bg-gray-50">
                  <KitchenDisplay orders={orders} onUpdateStatus={updateOrderStatus} />
                </div>
              ) : (
                <>
                  {orders.length === 0 ? (
                    <p className="p-8 text-center text-gray-500">No orders yet</p>
                  ) : (
                    <div className="divide-y">
                      {orders.map(order => (
                        <div key={order.id} className="p-4">
                          <div className="flex justify-between mb-2 items-start">
                            <div>
                              <p className="font-bold text-gray-900">#{order.id?.slice(-6)}</p>

                              {/* Customer Info */}
                              <div className="mt-1 mb-2">
                                <p className="text-sm font-semibold text-gray-800">
                                  {order.customer?.name || order.guestDetails?.name || 'Guest'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {order.customer?.phone || order.guestDetails?.phone || 'No Phone'}
                                </p>
                                {order.orderType === 'delivery' && order.address && (
                                  <p className="text-xs text-gray-500 italic mt-0.5">
                                    📍 {order.address}
                                  </p>
                                )}
                              </div>

                              {/* Order Items */}
                              <div className="bg-gray-50 p-2 rounded-lg text-sm text-gray-700 space-y-1 mb-2 min-w-[200px]">
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <span className="font-bold text-gray-900">{item.quantity}x</span>
                                    <span>{item.menuItem?.name || 'Unknown Item'}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-sm font-bold">Total: ₹{order.totalAmount}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              order.status === 'Paid' ? 'bg-blue-100 text-blue-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                              {order.status}
                            </span>
                          </div>
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, e.target.value)}
                            className="w-full mt-2 px-3 py-2 text-sm border rounded-lg"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Cooking">Cooking</option>
                            {order.orderType === 'delivery' ? (
                              <>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                              </>
                            ) : (
                              <>
                                <option value="Ready">Ready</option>
                                <option value="Served">Served</option>
                              </>
                            )}
                            <option value="Paid">Paid</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      }

      {/* MENU */}
      {
        activeTab === 'menu' && (
          <div className="px-4 py-4 space-y-4">
            {!showAddMenu ? (
              canEditMenu && (
                <button
                  onClick={() => { resetForm(); setShowAddMenu(true); }}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl"
                >
                  + Add New Menu Item
                </button>
              )
            ) : (
              <div className="bg-white rounded-xl p-4 border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold">{editItemId ? 'Edit' : 'Add'} Item</h2>
                  <button onClick={resetForm} className="text-2xl text-gray-400">×</button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Image</label>
                  {imagePreview ? (
                    <div className="relative h-48 mb-3">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full"
                      >×</button>
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed">
                      <span className="text-4xl">Photo</span>
                      <p className="text-sm text-gray-500">No image</p>
                    </div>
                  )}
                  <label className="w-full block mt-2 py-2.5 bg-gray-100 text-center rounded-lg cursor-pointer">
                    {imagePreview ? 'Change' : 'Upload'} Image
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="Name *"
                  value={menuItem.name}
                  onChange={e => setMenuItem({ ...menuItem, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg mb-3"
                />
                <input
                  type="text"
                  placeholder="Category *"
                  value={menuItem.category}
                  onChange={e => setMenuItem({ ...menuItem, category: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg mb-3"
                />
                <div className="flex gap-3 mb-3">
                  <input
                    type="number"
                    placeholder="Price (₹)*"
                    value={menuItem.price}
                    onChange={e => setMenuItem({ ...menuItem, price: e.target.value })}
                    className="flex-1 px-4 py-3 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Food Cost (₹) (Optional)"
                    title="Manual COGS override (e.g. for packed items)"
                    value={menuItem.cost}
                    onChange={e => setMenuItem({ ...menuItem, cost: e.target.value })}
                    className="flex-1 px-4 py-3 border rounded-lg"
                  />
                </div>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={menuItem.quantity}
                      onChange={e => setMenuItem({ ...menuItem, quantity: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Low Stock Alert</label>
                    <input
                      type="number"
                      placeholder="Alert at"
                      value={menuItem.lowStockThreshold}
                      onChange={e => setMenuItem({ ...menuItem, lowStockThreshold: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                </div>
                <textarea
                  placeholder="Description"
                  value={menuItem.description}
                  onChange={e => setMenuItem({ ...menuItem, description: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg mb-3 h-20"
                />

                <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                  <h3 className="text-sm font-bold mb-2">Recipe Configuration</h3>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Recipe Name (e.g. Classic Sando)"
                      className="border p-2 rounded text-sm w-full"
                      value={menuItem.recipeName}
                      onChange={e => setMenuItem({ ...menuItem, recipeName: e.target.value })}
                    />
                    <select
                      className="border p-2 rounded text-sm w-full"
                      value={menuItem.station}
                      onChange={e => setMenuItem({ ...menuItem, station: e.target.value })}
                    >
                      <option value="Other">Other Station</option>
                      <option value="Sandwich">Sandwich Station</option>
                      <option value="Shake">Shake Station</option>
                      <option value="Egg">Egg Station</option>
                      <option value="Fryer">Fryer Station</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Preparation Instructions..."
                    className="border p-2 rounded text-sm w-full h-20 mb-3"
                    value={menuItem.preparationSteps}
                    onChange={e => setMenuItem({ ...menuItem, preparationSteps: e.target.value })}
                  />

                  <div className="space-y-2 mb-3">
                    {menuItem.recipe.map((r, idx) => {
                      const ing = ingredients.find(i => i._id === r.ingredient);
                      return (
                        <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                          <span>{ing?.name || 'Unknown'} ({r.quantityRequired}{ing?.unit})</span>
                          <button
                            onClick={() => {
                              const newRecipe = menuItem.recipe.filter((_, i) => i !== idx);
                              setMenuItem({ ...menuItem, recipe: newRecipe });
                            }}
                            className="text-red-500 font-bold px-2"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                    {menuItem.recipe.length === 0 && <p className="text-xs text-gray-500">No ingredients linked.</p>}
                  </div>

                  <div className="flex gap-2">
                    <select
                      id="ingSelect"
                      className="flex-1 text-sm border rounded px-2"
                    >
                      <option value="">Select Ingredient</option>
                      {ingredients.map(i => <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>)}
                    </select>
                    <input
                      id="ingQty"
                      type="number"
                      placeholder="Qty"
                      className="w-20 text-sm border rounded px-2"
                    />
                    <button
                      onClick={() => {
                        const ingId = document.getElementById('ingSelect').value;
                        const qty = document.getElementById('ingQty').value;
                        if (!ingId || !qty) return;
                        setMenuItem({
                          ...menuItem,
                          recipe: [...menuItem.recipe, { ingredient: ingId, quantityRequired: Number(qty) }]
                        });
                        document.getElementById('ingSelect').value = '';
                        document.getElementById('ingQty').value = '';
                      }}
                      className="bg-gray-800 text-white px-3 py-1 rounded text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-lg border">
                  <input
                    type="checkbox"
                    checked={menuItem.availability?.isTimeBound}
                    onChange={e => setMenuItem({
                      ...menuItem,
                      availability: { ...menuItem.availability, isTimeBound: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold flex-1">Time Restricted?</span>
                  {menuItem.availability?.isTimeBound && (
                    <div className="flex gap-2 text-xs">
                      <input
                        type="time"
                        value={menuItem.availability.start}
                        onChange={e => setMenuItem({
                          ...menuItem,
                          availability: { ...menuItem.availability, start: e.target.value }
                        })}
                        className="border rounded p-1"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={menuItem.availability.end}
                        onChange={e => setMenuItem({
                          ...menuItem,
                          availability: { ...menuItem.availability, end: e.target.value }
                        })}
                        className="border rounded p-1"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={menuItem.inStock}
                    onChange={e => setMenuItem({ ...menuItem, inStock: e.target.checked })}
                    className="w-5 h-5 text-green-600"
                  />
                  <label className="text-sm font-medium">In Stock (Override)</label>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={menuItem.isSubscriptionItem}
                    onChange={e => setMenuItem({ ...menuItem, isSubscriptionItem: e.target.checked })}
                    className="w-5 h-5 text-purple-600"
                  />
                  <label className="text-sm font-medium text-purple-700">Daily Subscription Meal?</label>
                </div>

                <button
                  onClick={handleAddMenuItem}
                  disabled={loading || !menuItem.name || !menuItem.price || !menuItem.category}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-gray-400"
                >
                  {uploadingImage ? 'Uploading...' : loading ? 'Saving...' : editItemId ? 'Update' : 'Add'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {menuItems.map(item => (
                <div key={item._id} className="bg-white rounded-xl border overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">Dish</span>
                    )}
                    {item.inStock === false && (
                      <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                        <span className="text-xs font-bold text-red-600">OUT OF STOCK</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.category}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm font-bold">₹{item.price}</p>
                      <p className={`text-xs font-bold ${item.quantity <= item.lowStockThreshold ? 'text-red-600' : 'text-green-600'}`}>
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEditMenuItem(item)}
                        className="flex-1 py-1.5 bg-blue-600 text-white text-xs rounded-lg"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleStock(item._id)}
                        className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${item.inStock
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                      >
                        {item.inStock ? 'Out' : 'In'}
                      </button>
                      <button
                        onClick={() => handleDeleteMenuItem(item._id)}
                        className="flex-1 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* INVENTORY */}
      {
        activeTab === 'inventory' && (
          <div className="px-4 py-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Raw Ingredients</h2>
              <button
                onClick={() => setShowAddIngredient(!showAddIngredient)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
              >
                + Add Ingredient
              </button>
            </div>

            {showAddIngredient && (
              <div className="bg-white p-4 rounded-xl border mb-4">
                <h3 className="font-bold mb-3">Add New Ingredient</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    placeholder="Ingredient Name (e.g. Flour)"
                    className="border p-2 rounded"
                    value={newIngredient.name}
                    onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  />
                  <select
                    className="border p-2 rounded"
                    value={newIngredient.unit}
                    onChange={e => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                  >
                    <option value="g">grams (g)</option>
                    <option value="ml">milliliters (ml)</option>
                    <option value="pcs">pieces (pcs)</option>
                    <option value="slice">slices</option>
                    <option value="kg">kg</option>
                    <option value="l">liters</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Current Stock"
                    className="border p-2 rounded"
                    value={newIngredient.currentStock}
                    onChange={e => setNewIngredient({ ...newIngredient, currentStock: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Alert Threshold"
                    className="border p-2 rounded"
                    value={newIngredient.lowStockThreshold}
                    onChange={e => setNewIngredient({ ...newIngredient, lowStockThreshold: e.target.value })}
                  />
                  <input
                    placeholder="Manufacturer (e.g. Nestle, Local Farm)"
                    className="border p-2 rounded col-span-2"
                    value={newIngredient.manufacturer}
                    onChange={e => setNewIngredient({ ...newIngredient, manufacturer: e.target.value })}
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!newIngredient.name) return;
                    try {
                      const res = await adminApi.post('/ingredients', newIngredient);
                      setIngredients([...ingredients, res.data]);
                      setNewIngredient({ name: '', unit: 'g', currentStock: 0, costPerUnit: 0, lowStockThreshold: 10, manufacturer: '' });
                      setShowAddIngredient(false);
                    } catch (e) { alert('Failed to add'); }
                  }}
                  className="w-full bg-green-600 text-white py-2 rounded font-bold"
                >
                  Save Ingredient
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Manufacturer</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ingredients.map(ing => (
                    <tr key={ing._id}>
                      <td className="p-3 font-medium">{ing.name}</td>
                      <td className="p-3 text-gray-500 text-xs">{ing.manufacturer || <span className="italic text-gray-300">—</span>}</td>
                      <td className="p-3 font-bold">{ing.currentStock}</td>
                      <td className="p-3 text-gray-500">{ing.unit}</td>
                      <td className="p-3">
                        {ing.currentStock <= ing.lowStockThreshold ? (
                          <span className="text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded-full">LOW STOCK</span>
                        ) : (
                          <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded-full">OK</span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          className="text-blue-600 font-bold text-xs hover:underline"
                          onClick={() => setSelectedIngredient(ing)}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ingredients.length === 0 && <p className="p-4 text-center text-gray-500">No ingredients yet.</p>}
            </div>
          </div>
        )
      }

      {/* SALES REPORT */}
      {
        activeTab === 'sales' && (
          <div className="px-4 py-4">
            <h2 className="text-xl font-bold mb-4">Sales & Earnings</h2>
            <React.Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
              <SalesReport />
            </React.Suspense>
          </div>
        )
      }

      {/* PROFIT ANALYSIS */}
      {
        activeTab === 'profit' && (
          <div className="px-4 py-4">
            <React.Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
              <ProfitReport />
            </React.Suspense>
          </div>
        )
      }

      {/* STAFF MANAGER */}
      {
        activeTab === 'staff' && userRole === 'admin' && (
          <div className="px-4 py-4">
            <StaffManager />
          </div>
        )
      }

      {/* SETTINGS */}
      {
        activeTab === 'settings' && userRole === 'admin' && (
          <div className="px-4 py-4">
            <SettingsPanel />
          </div>
        )
      }

      {/* CUSTOMERS */}
      {
        activeTab === 'customers' && (
          <div className="px-4 py-4">
            <CustomerManager />
          </div>
        )
      }

      {/* DAILY PREP SUGGESTIONS */}
      {
        activeTab === 'prep' && (
          <div className="px-4 py-4 space-y-4">
            {Object.keys(prepSuggestions).length === 0 ? (
              <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
                <p className="text-lg font-bold">No Prep Needed Yet</p>
                <p className="text-sm">Suggestions will appear once orders are placed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(prepSuggestions).map(station => (
                  <div key={station} className="bg-white rounded-xl border overflow-hidden">
                    <div className="bg-gray-800 text-white p-3 font-bold flex justify-between">
                      <span>{station} Station</span>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">Avg Daily Needs</span>
                    </div>
                    <div className="divide-y">
                      {prepSuggestions[station].map((item, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center hover:bg-gray-50">
                          <span className="font-medium text-gray-800">{item.name}</span>
                          <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                            {item.qty}{item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-gray-50 text-xs text-center text-gray-500">
                      * Includes +20% buffer based on 7-day sales avg
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }


      {/* STOCK MANAGER MODAL */}
      {
        selectedIngredient && (
          <StockManager
            ingredient={selectedIngredient}
            onClose={() => setSelectedIngredient(null)}
            onUpdate={(updated) => {
              setIngredients(ingredients.map(i => i._id === updated._id ? updated : i));
            }}
          />
        )
      }

      {/* LOW STOCK */}
      {
        activeTab === 'lowStock' && (
          <div className="px-4 py-4 space-y-4">

            {/* Low Stock Ingredients */}
            <h2 className="text-base font-bold text-red-600">Low Stock Ingredients</h2>
            <div className="grid grid-cols-2 gap-3">
              {ingredients.filter(i => i.currentStock <= i.lowStockThreshold).map(ing => (
                <div key={ing._id} className="bg-white rounded-xl border p-4">
                  <h3 className="font-bold">{ing.name}</h3>
                  <p className="text-sm text-gray-500">
                    Current: <span className="text-red-600 font-bold">{ing.currentStock}{ing.unit}</span>
                  </p>
                  <p className="text-xs text-gray-400">Threshold: {ing.lowStockThreshold}{ing.unit}</p>
                  <button
                    onClick={async () => {
                      const newStock = prompt(`Restock ${ing.name} (Current: ${ing.currentStock}):`, ing.currentStock);
                      if (newStock !== null) {
                        const res = await adminApi.put(`/ingredients/${ing._id}`, { ...ing, currentStock: newStock });
                        setIngredients(ingredients.map(i => i._id === ing._id ? res.data : i));
                      }
                    }}
                    className="mt-3 w-full py-2 bg-blue-600 text-white text-xs rounded-lg font-bold"
                  >
                    Restock
                  </button>
                </div>
              ))}
              {ingredients.filter(i => i.currentStock <= i.lowStockThreshold).length === 0 && (
                <p className="col-span-2 text-center text-gray-400 py-4">Ingredients are well stocked.</p>
              )}
            </div>

            <div className="border-t my-4"></div>

            {/* Low Stock Menu Items */}
            <h2 className="text-base font-bold text-red-600">Low Stock Menu Items</h2>
            <div className="grid grid-cols-2 gap-3">
              {menuItems.filter(i => i.quantity <= i.lowStockThreshold).map(item => (
                <div key={item._id} className="bg-white rounded-xl border overflow-hidden">
                  <div className="p-4">
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm text-gray-500">Current Qty: <span className="text-red-600 font-bold">{item.quantity}</span></p>
                    <p className="text-xs text-gray-400">Threshold: {item.lowStockThreshold}</p>
                    <button
                      onClick={() => handleEditMenuItem(item)}
                      className="mt-3 w-full py-2 bg-blue-600 text-white text-xs rounded-lg font-bold"
                    >
                      Restock / Edit
                    </button>
                  </div>
                </div>
              ))}
              {menuItems.filter(i => i.quantity <= i.lowStockThreshold).length === 0 && (
                <p className="col-span-2 text-center text-gray-400 py-10">Menu items are well stocked!</p>
              )}
            </div>
          </div>
        )
      }

      {/* COMBOS */}
      {
        activeTab === 'combos' && (
          <ComboManager menuItems={menuItems} />
        )
      }

      {/* PROMOTIONS */}
      {
        activeTab === 'promotion' && (
          <div className="px-4 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CouponManager />
            <AdManager />
          </div>
        )
      }
    </div >
  );
};

export default Dashboard;