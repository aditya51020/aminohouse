const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ad = require('../models/adModel');

dotenv.config();

const seedAds = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        await Ad.deleteMany({}); // Clear existing

        const ad = new Ad({
            imageUrl: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80', // Nice food banner
            active: true,
            priority: 10,
            redirectType: 'category',
            redirectId: 'Beverage'
        });

        await ad.save();
        console.log('Sample Ad Created');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAds();
