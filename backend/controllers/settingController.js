const Setting = require('../models/settingModel');

exports.getKitchenStatus = async (req, res) => {
    try {
        let setting = await Setting.findOne({ where: { key: 'kitchen_open' } });
        if (!setting) {
            // Default to OPEN if not set
            setting = await Setting.create({ key: 'kitchen_open', value: true });
        }
        res.json({ open: setting.value });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleKitchenStatus = async (req, res) => {
    try {
        const { open } = req.body; // Expect { open: true/false }

        // Upsert logic
        const [setting, created] = await Setting.findOrCreate({
            where: { key: 'kitchen_open' },
            defaults: { value: open }
        });

        if (!created) {
            await setting.update({ value: open });
        }

        res.json({ open: setting.value });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStoreSettings = async (req, res) => {
    try {
        let setting = await Setting.findOne({ where: { key: 'store_config' } });
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

        const [setting, created] = await Setting.findOrCreate({
            where: { key: 'store_config' },
            defaults: { value }
        });

        if (!created) {
            await setting.update({ value });
        }

        res.json(setting.value);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
