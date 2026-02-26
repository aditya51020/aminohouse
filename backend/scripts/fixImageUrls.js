/**
 * Migration script: replace localhost:5000 image URLs with Render production URL
 * Run once: node scripts/fixImageUrls.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const RENDER_URL = 'https://aminohouse.onrender.com';

async function fixUrls() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = ['menus', 'ads', 'combos'];

    for (const colName of collections) {
        const col = db.collection(colName);
        const docs = await col.find({ imageUrl: /localhost:5000/ }).toArray();
        console.log(`\n📦 ${colName}: found ${docs.length} docs with localhost URLs`);

        for (const doc of docs) {
            const newUrl = doc.imageUrl.replace(/https?:\/\/localhost:\d+/, RENDER_URL);
            await col.updateOne({ _id: doc._id }, { $set: { imageUrl: newUrl } });
            console.log(`  ✔ Fixed: ${doc.imageUrl}\n       → ${newUrl}`);
        }
    }

    console.log('\n🎉 All done!');
    await mongoose.disconnect();
}

fixUrls().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
