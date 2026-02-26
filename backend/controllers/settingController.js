const Setting = require('../models/settingModel');

exports.getKitchenStatus = async (req, res) => {
    try {
        let setting = await Setting.findOne({ key: 'kitchen_open' });
        if (!setting) {
            setting = await Setting.create({ key: 'kitchen_open', value: true });
        }
        res.json({ open: setting.value });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleKitchenStatus = async (req, res) => {
    try {
        const { open } = req.body;
        const setting = await Setting.findOneAndUpdate(
            { key: 'kitchen_open' },
            { value: open },
            { upsert: true, new: true }
        );
        res.json({ open: setting.value });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStoreSettings = async (req, res) => {
    try {
        let setting = await Setting.findOne({ key: 'store_config' });
        if (!setting) {
            const defaults = {
                storeName: 'FuelBar',
                address: '',
                phone: '',
                currency: '₹',
                taxName: 'GST',
                taxRate: 5
            };
            setting = await Setting.create({ key: 'store_config', value: defaults });
        }
        res.json(setting.value);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateStoreSettings = async (req, res) => {
    try {
        const { storeName, address, phone, currency, taxName, taxRate } = req.body;
        const value = { storeName, address, phone, currency, taxName, taxRate: Number(taxRate) };

        const setting = await Setting.findOneAndUpdate(
            { key: 'store_config' },
            { value },
            { upsert: true, new: true }
        );

        res.json(setting.value);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
