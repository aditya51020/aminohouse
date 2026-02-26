const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios'); // You might need to install axios if not present, or use fetch
const Subscription = require('../models/subscriptionModel');
const Customer = require('../models/customerModel');

dotenv.config();

const API_URL = 'http://localhost:5000/api';

// MOCK DATA
const MOCK_USER = {
    name: 'Stress Test User',
    phone: '9999999999'
};

async function runStressTest() {
    console.log('--- STARTING STRESS TEST ---');
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        // 1. Create User
        let user = await Customer.findOne({ phone: MOCK_USER.phone });
        if (!user) {
            user = await Customer.create(MOCK_USER);
            console.log('User Created:', user._id);
        } else {
            console.log('User Found:', user._id);
        }

        // 2. Buy Subscription
        console.log('Buying Subscription...');
        try {
            await axios.post(`${API_URL}/subscriptions/buy`, {
                customerId: user._id,
                planType: 30
            });
            console.log('Subscription Bought');
        } catch (e) {
            console.log('Subscription Buy Failed (Likely already active):', e.response?.data?.message || e.message);
        }

        // 3. Concurrent Claim Test (Race Condition Check)
        console.log('Testing Concurrent Claims (Should allow only 1, fail rest)...');
        const claimPromises = Array(10).fill(0).map((_, i) =>
            axios.post(`${API_URL}/subscriptions/claim`, { customerId: user._id })
                .then(res => `Request ${i}: Success`)
                .catch(err => `Request ${i}: Failed (${err.response?.data?.message})`)
        );

        const results = await Promise.all(claimPromises);
        console.log('Claim Results:', results);

        const successCount = results.filter(r => r.includes('Success')).length;
        if (successCount > 1) {
            console.error('❌ CRITICAL FAIL: Multiple claims allowed!');
        } else if (successCount === 1) {
            console.log('✅ PASS: Only 1 claim allowed.');
        } else {
            console.log('⚠️ NOTE: All claims failed (Maybe already claimed today).');
        }

        // 4. Coupon Validation Test
        console.log('Testing Coupon Validation...');
        try {
            const couponRes = await axios.post(`${API_URL}/coupons/verify`, {
                code: 'INVALID_CODE',
                cartTotal: 100
            });
        } catch (e) {
            console.log('Invalid Coupon Check:', e.response?.status === 404 ? '✅ PASS (404)' : '❌ FAIL');
        }

        console.log('--- TEST COMPLETE ---');
        process.exit(0);

    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

runStressTest();
