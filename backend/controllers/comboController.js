const Combo = require('../models/comboModel');

// GET all active combos (public)
const getCombos = async (req, res) => {
    try {
        const all = req.query.all === 'true';
        const filter = all ? {} : { active: true }; // fixed field name to 'active'
        const combos = await Combo.find(filter).sort({ createdAt: -1 }).populate('items');
        res.json(combos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// CREATE combo (admin)
const createCombo = async (req, res) => {
    try {
        const { name, description, price, imageUrl, active, items } = req.body;
        if (!name || !price || !items || items.length < 2) {
            return res.status(400).json({ message: 'Name, price, and at least 2 items are required' });
        }
        const combo = await Combo.create({
            name, description, price, imageUrl, active, items
        });
        await combo.populate('items');
        res.status(201).json(combo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE combo (admin)
const updateCombo = async (req, res) => {
    try {
        const combo = await Combo.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('items');
        if (!combo) return res.status(404).json({ message: 'Combo not found' });
        res.json(combo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE combo (admin)
const deleteCombo = async (req, res) => {
    try {
        const combo = await Combo.findByIdAndDelete(req.params.id);
        if (!combo) return res.status(404).json({ message: 'Combo not found' });
        res.json({ message: 'Combo deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getCombos, createCombo, updateCombo, deleteCombo };
