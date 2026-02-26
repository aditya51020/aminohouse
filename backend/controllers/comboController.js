const Combo = require('../models/comboModel');

// GET all active combos (public)
const getCombos = async (req, res) => {
    try {
        const all = req.query.all === 'true'; // admin sends ?all=true to see inactive too
        const where = all ? {} : { isActive: true };
        const combos = await Combo.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json(combos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// CREATE combo (admin)
const createCombo = async (req, res) => {
    try {
        const { name, description, comboPrice, originalPrice, imageUrl, isActive, items } = req.body;
        if (!name || !comboPrice || !items || items.length < 2) {
            return res.status(400).json({ message: 'Name, combo price, and at least 2 items are required' });
        }
        const combo = await Combo.create({
            name, description, comboPrice, originalPrice, imageUrl, isActive, items
        });
        res.status(201).json(combo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE combo (admin)
const updateCombo = async (req, res) => {
    try {
        const combo = await Combo.findByPk(req.params.id);
        if (!combo) return res.status(404).json({ message: 'Combo not found' });
        await combo.update(req.body);
        res.json(combo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE combo (admin)
const deleteCombo = async (req, res) => {
    try {
        const combo = await Combo.findByPk(req.params.id);
        if (!combo) return res.status(404).json({ message: 'Combo not found' });
        await combo.destroy();
        res.json({ message: 'Combo deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getCombos, createCombo, updateCombo, deleteCombo };
