const express = require('express');
const router = express.Router();
const { verifyCoupon, createCoupon, getCoupons, deleteCoupon } = require('../controllers/couponController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.post('/verify', verifyCoupon);
// Admin Routes
router.post('/', auth, adminAuth, createCoupon);
router.get('/', auth, adminAuth, getCoupons);
router.delete('/:id', auth, adminAuth, deleteCoupon);

module.exports = router;
