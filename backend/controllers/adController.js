const Ad = require('../models/adModel');
const { Op } = require('sequelize');

// @desc    Get active ads
// @route   GET /api/ads/active
// @access  Public
exports.getActiveAds = async (req, res) => {
    try {
        const ads = await Ad.findAll({
            where: {
                active: true,
                [Op.or]: [
                    { endDate: { [Op.eq]: null } },
                    { endDate: { [Op.gt]: new Date() } }
                ]
            },
            order: [['priority', 'DESC']],
            limit: 5
        });

        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Create new ad
// @route   POST /api/ads
// @access  Private (Admin)
exports.createAd = async (req, res) => {
    try {
        const { imageUrl, active, priority, redirectType, redirectId } = req.body;
        const ad = await Ad.create({
            imageUrl,
            active: active !== false, // default true
            priority: priority || 1,
            redirectType: redirectType || 'item',
            redirectId
        });
        res.status(201).json(ad);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all ads (including inactive)
// @route   GET /api/ads
// @access  Private (Admin)
exports.getAds = async (req, res) => {
    try {
        const ads = await Ad.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete ad
// @route   DELETE /api/ads/:id
// @access  Private (Admin)
exports.deleteAd = async (req, res) => {
    try {
        const ad = await Ad.findByPk(req.params.id);
        if (ad) {
            await ad.destroy();
            res.json({ message: 'Ad deleted' });
        } else {
            res.status(404).json({ message: 'Ad not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
