import React, { useState, useEffect } from 'react';
import adminApi from '../utils/adminAxios';

import { Trash2, Plus, Image as ImageIcon, Upload } from 'lucide-react';

const AdManager = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [newAd, setNewAd] = useState({
        imageUrl: '',
        redirectType: 'item',
        redirectId: '',
        priority: 1
    });

    const fetchAds = async () => {
        try {
            const res = await adminApi.get('/ads');
            setAds(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return alert('Please select an image');
        setImageFile(file);

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewAd({ ...newAd, imageUrl: reader.result }); // Temporary preview (base64)
        };
        reader.readAsDataURL(file);
    };

    const uploadFile = async () => {
        if (!imageFile) return newAd.imageUrl;
        // If it's already a URL (not base64), return it
        if (newAd.imageUrl.startsWith('http')) return newAd.imageUrl;

        const formData = new FormData();
        formData.append('image', imageFile);
        try {
            setUploading(true);
            setUploading(true);
            // Must use adminApi to include token in headers, BUT adminApi default headers are json
            // So we need to override headers for multipart
            const res = await adminApi.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.imageUrl;
        } catch (err) {
            console.error("Upload failed", err);
            alert("Image upload failed");
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleCreate = async () => {
        try {
            setLoading(true);

            // 1. Upload if file selected
            let finalImageUrl = newAd.imageUrl;
            if (imageFile) {
                finalImageUrl = await uploadFile();
                if (!finalImageUrl) return; // Upload failed
            }

            if (!finalImageUrl) return alert('Image is required');

            // 2. Create Ad
            await adminApi.post('/ads', { ...newAd, imageUrl: finalImageUrl });

            await fetchAds();
            setNewAd({ imageUrl: '', redirectType: 'item', redirectId: '', priority: 1 });
            setImageFile(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create ad');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete ad?')) return;
        try {
            await adminApi.delete(`/ads/${id}`);
            setAds(ads.filter(a => a._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold mb-4">Ad Banners</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* FORM */}
                <div className="space-y-3">

                    {/* File Upload OR URL */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Banner Image</label>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                                id="ad-image-upload"
                            />
                            <label
                                htmlFor="ad-image-upload"
                                className="flex-1 cursor-pointer bg-gray-50 border border-dashed border-gray-300 rounded p-2 text-sm text-gray-500 flex items-center justify-center hover:bg-gray-100"
                            >
                                <Upload size={16} className="mr-2" /> {imageFile ? imageFile.name : 'Upload Image from System'}
                            </label>
                        </div>
                        <p className="text-center text-xs text-gray-400 my-1">- OR -</p>
                        <input
                            value={newAd.imageUrl}
                            onChange={e => { setNewAd({ ...newAd, imageUrl: e.target.value }); setImageFile(null); }} // Clear file if typing URL
                            placeholder="Paste Image URL"
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={newAd.redirectType}
                            onChange={e => setNewAd({ ...newAd, redirectType: e.target.value })}
                            className="p-2 border rounded w-1/3"
                        >
                            <option value="item">Link to Item</option>
                            <option value="category">Link to Category</option>
                            <option value="url">External Link</option>
                        </select>
                        <input
                            value={newAd.redirectId}
                            onChange={e => setNewAd({ ...newAd, redirectId: e.target.value })}
                            placeholder={newAd.redirectType === 'category' ? 'Category Name' : 'ID or URL'}
                            className="p-2 border rounded flex-1"
                        />
                    </div>
                    <input
                        type="number"
                        value={newAd.priority}
                        onChange={e => setNewAd({ ...newAd, priority: e.target.value })}
                        placeholder="Priority (1-10)"
                        className="w-full p-2 border rounded"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full bg-black text-white py-2 rounded font-bold"
                    >
                        {loading ? 'Adding...' : 'Add Banner'}
                    </button>
                </div>

                {/* PREVIEW */}
                <div className="bg-gray-100 rounded-lg flex items-center justify-center p-4 min-h-[150px]">
                    {newAd.imageUrl ? (
                        <img src={newAd.imageUrl} alt="Preview" className="max-h-32 rounded object-cover" onError={(e) => e.target.style.display = 'none'} />
                    ) : (
                        <div className="text-gray-400 text-center">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-xs">Preview</span>
                        </div>
                    )}
                </div>
            </div>

            {/* LIST */}
            <div className="grid grid-cols-1 gap-3">
                {ads.map(ad => (
                    <div key={ad._id} className="flex gap-4 p-3 border rounded-lg items-center">
                        <img src={ad.imageUrl} alt="Ad" className="w-24 h-16 object-cover rounded bg-gray-200" />
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <span className="font-bold text-sm">Priority: {ad.priority}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${ad.active ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>
                                    {ad.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Redirect: {ad.redirectType} &rarr; {ad.redirectId || 'None'}
                            </p>
                        </div>
                        <button onClick={() => handleDelete(ad._id)} className="text-red-500 p-2"><Trash2 size={18} /></button>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default AdManager;
