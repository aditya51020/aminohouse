import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';

const AdBanner = () => {
    const [ads, setAds] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/ads/active')
            .then(res => setAds(res.data))
            .catch(() => { }); // Silent fail
    }, []);

    // Auto-rotate every 5 seconds
    useEffect(() => {
        if (ads.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % ads.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [ads.length]);

    if (ads.length === 0) return null;

    const ad = ads[currentIndex];

    // Navigation Logic
    const handleClick = () => {
        if (!ad.redirectId) return;

        if (ad.redirectType === 'url') {
            // External
            window.open(ad.redirectId, '_blank');
        } else if (ad.redirectType === 'category') {
            // Internal selection of category. 
            // Since Menu state is in a parent/sibling, we might need a way to pass this.
            // For now, simple console log or if url allows filtering. 
            // In Menu.jsx, we likely don't have URL query support for category.
            // Let's assume we can navigate or emit event.
            // Simplest: Just scroll to it if on same page, or nothing. 
            // BUT: Requirements said "redirect".
            // Let's try to emit custom event or simple alert for now if state internal.
            // IMPROVEMENT: Actually, if we are in React Router, we can pass state.
            // But Menu.jsx reads state. Let's try standard navigation if routes exist.
            // "item" -> maybe open detail modal?
            console.log('Ad Click:', ad.redirectType, ad.redirectId);

            // Dispatch a custom event so Menu.jsx can listen? 
            // Or simpler: Save to SessionStorage "select_category" and reload? No.
            // Better: Global Event Bus or just window event
            const event = new CustomEvent('ad-click', { detail: { type: ad.redirectType, id: ad.redirectId } });
            window.dispatchEvent(event);
        } else if (ad.redirectType === 'item') {
            const event = new CustomEvent('ad-click', { detail: { type: ad.redirectType, id: ad.redirectId } });
            window.dispatchEvent(event);
        }
    };

    return (
        <div
            onClick={handleClick}
            className="mx-4 mt-4 mb-2 rounded-xl overflow-hidden shadow-sm relative aspect-[21/9] sm:aspect-[4/1] bg-gray-100 cursor-pointer"
        >
            <img
                key={ad._id} // Key change triggers animation
                src={ad.imageUrl}
                alt="Offer"
                className="w-full h-full object-cover animate-fadeIn"
                loading="lazy"
            />
            {/* Dots Indicator */}
            {ads.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {ads.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                        />
                    ))}
                </div>
            )}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1 rounded">Ad</div>
        </div>
    );
};

export default AdBanner;
