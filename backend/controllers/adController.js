const Ad = require('../models/adModel');

// @desc    Get active ads
exports.getActiveAds = async (req, res) => {
    try {
        const ads = await Ad.find({
            active: true
        }).sort({ priority: -1 }).limit(5);

        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Create new ad
exports.createAd = async (req, res) => {
    try {
        const { imageUrl, active, priority, redirectType, redirectId } = req.body;
        const ad = await Ad.create({
            imageUrl,
            active: active !== false,
            priority: priority || 1,
            redirectType: redirectType || 'item',
            redirectId
        });
        res.status(201).json(ad);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all ads
exports.getAds = async (req, res) => {
    try {
        const ads = await Ad.find({}).sort({ createdAt: -1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete ad
exports.deleteAd = async (req, res) => {
    try {
        const ad = await Ad.findByIdAndDelete(req.params.id);
        if (ad) {
            res.json({ message: 'Ad deleted' });
        } else {
            res.status(404).json({ message: 'Ad not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
