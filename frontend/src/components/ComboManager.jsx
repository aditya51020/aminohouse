import React, { useState, useEffect } from 'react';
import adminApi from '../utils/adminAxios';
import { Plus, Trash2, Edit2, X, Check, Tag } from 'lucide-react';

const ComboManager = ({ menuItems }) => {
    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);

    const emptyForm = {
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        active: true,
        selectedItems: [] // [{ menuItemId, name, price, imageUrl }]
    };
    const [form, setForm] = useState(emptyForm);

    // Fetch combos (all, including inactive)
    const fetchCombos = async () => {
        try {
            const res = await adminApi.get('/combos?all=true');
            setCombos(res.data);
        } catch (err) {
            console.error('Fetch combos error:', err);
        }
    };

    useEffect(() => { fetchCombos(); }, []);

    const originalPrice = form.selectedItems.reduce((sum, i) => sum + Number(i.price || 0), 0);
    const savings = originalPrice - Number(form.price || 0);

    // Toggle item in combo selection
    const toggleItem = (item) => {
        const exists = form.selectedItems.find(i => i.menuItemId === (item._id || item.id));
        if (exists) {
            setForm(f => ({ ...f, selectedItems: f.selectedItems.filter(i => i.menuItemId !== (item._id || item.id)) }));
        } else {
            setForm(f => ({
                ...f,
                selectedItems: [...f.selectedItems, {
                    menuItemId: item._id || item.id,
                    name: item.name,
                    price: item.price,
                    imageUrl: item.imageUrl || ''
                }]
            }));
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.price || form.selectedItems.length < 2) {
            alert('Name, combo price, and at least 2 items are required');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                name: form.name,
                description: form.description,
                price: Number(form.price),
                imageUrl: form.imageUrl || form.selectedItems[0]?.imageUrl || '',
                active: form.active,
                items: form.selectedItems.map(i => i.menuItemId)
            };
            if (editId) {
                const res = await adminApi.put(`/combos/${editId}`, payload);
                setCombos(c => c.map(x => x.id === editId ? res.data : x));
            } else {
                const res = await adminApi.post('/combos', payload);
                setCombos(c => [res.data, ...c]);
            }
            setShowForm(false);
            setForm(emptyForm);
            setEditId(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Save failed');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (combo) => {
        setForm({
            name: combo.name,
            description: combo.description || '',
            price: combo.price,
            imageUrl: combo.imageUrl || '',
            active: combo.active,
            selectedItems: (combo.items || []).map(item => ({
                menuItemId: item._id || item.id,
                name: item.name,
                price: item.price,
                imageUrl: item.imageUrl
            }))
        });
        setEditId(combo.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this combo?')) return;
        try {
            await adminApi.delete(`/combos/${id}`);
            setCombos(c => c.filter(x => x.id !== id));
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleToggleActive = async (combo) => {
        try {
            const res = await adminApi.put(`/combos/${combo.id}`, { active: !combo.active });
            setCombos(c => c.map(x => x.id === combo.id ? res.data : x));
        } catch (err) {
            alert('Update failed');
        }
    };

    return (
        <div className="px-4 py-4 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-gray-900">🔥 Combo Deals</h2>
                    <p className="text-xs text-gray-500">{combos.length} combo{combos.length !== 1 ? 's' : ''} created</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition"
                    >
                        <Plus size={16} /> New Combo
                    </button>
                )}
            </div>

            {/* Create / Edit Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">{editId ? 'Edit Combo' : 'Create New Combo'}</h3>
                        <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Name & Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Combo Name *</label>
                            <input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Coffee + Sandwich Combo"
                                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Combo Price (₹) *</label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                placeholder="e.g. 149"
                                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description (optional)</label>
                        <input
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="e.g. Perfect morning combo"
                            className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    {/* Price Summary */}
                    {form.selectedItems.length > 0 && (
                        <div className="flex gap-4 p-3 bg-gray-50 rounded-xl text-sm">
                            <div>
                                <p className="text-gray-500 text-xs">Original</p>
                                <p className="font-bold line-through text-gray-400">₹{originalPrice}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Combo Price</p>
                                <p className="font-bold text-black">₹{form.price || 0}</p>
                            </div>
                            {savings > 0 && (
                                <div>
                                    <p className="text-gray-500 text-xs">Savings</p>
                                    <p className="font-bold text-green-600">₹{savings}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Item Picker */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                            Select Items * <span className="text-gray-400 font-normal">(min 2)</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                            {menuItems.map(item => {
                                const selected = form.selectedItems.find(i => i.menuItemId === (item._id || item.id));
                                return (
                                    <button
                                        key={item._id || item.id}
                                        onClick={() => toggleItem(item)}
                                        className={`p-3 rounded-xl border-2 text-left transition-all ${selected
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        {item.imageUrl && (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-16 object-cover rounded-lg mb-2" />
                                        )}
                                        <p className="font-semibold text-xs truncate">{item.name}</p>
                                        <p className={`text-xs mt-0.5 ${selected ? 'text-gray-300' : 'text-gray-400'}`}>₹{item.price}</p>
                                        {selected && (
                                            <div className="mt-1 flex items-center gap-1 text-xs">
                                                <Check size={10} /> Added
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                            className={`w-12 h-6 rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.active ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm font-medium text-gray-700">{form.active ? 'Active (visible on menu)' : 'Inactive (hidden)'}</span>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : editId ? 'Update Combo' : 'Create Combo'}
                        </button>
                        <button
                            onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
                            className="px-6 py-3 border rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Combos List */}
            {combos.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Tag size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No combos yet</p>
                    <p className="text-sm">Create your first combo deal above!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {combos.map(combo => (
                        <div key={combo.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex gap-4 items-start ${!combo.active ? 'opacity-60' : ''}`}>
                            {combo.imageUrl && (
                                <img src={combo.imageUrl} alt={combo.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{combo.name}</h3>
                                        {combo.description && <p className="text-xs text-gray-500 mt-0.5">{combo.description}</p>}
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleToggleActive(combo)}
                                            className={`px-2 py-1 text-xs font-bold rounded-lg ${combo.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                        >
                                            {combo.active ? 'Active' : 'Off'}
                                        </button>
                                        <button onClick={() => handleEdit(combo)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">
                                            <Edit2 size={14} className="text-gray-600" />
                                        </button>
                                        <button onClick={() => handleDelete(combo.id)} className="p-1.5 bg-red-50 rounded-lg hover:bg-red-100">
                                            <Trash2 size={14} className="text-red-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Items chips */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {(combo.items || []).map((item, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                                            {item.name}
                                        </span>
                                    ))}
                                </div>

                                {/* Pricing */}
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="text-sm line-through text-gray-400">₹{
                                        (combo.items || []).reduce((sum, i) => sum + Number(i.price || 0), 0)
                                    }</span>
                                    <span className="text-lg font-black text-black">₹{combo.price}</span>
                                    {(combo.items || []).reduce((sum, i) => sum + Number(i.price || 0), 0) > combo.price && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                            Save ₹{(combo.items || []).reduce((sum, i) => sum + Number(i.price || 0), 0) - combo.price}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ComboManager;
