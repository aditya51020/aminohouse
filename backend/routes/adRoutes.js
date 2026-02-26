const express = require('express');
const router = express.Router();
const { getActiveAds, createAd, getAds, deleteAd } = require('../controllers/adController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/active', getActiveAds);
// Admin Routes
router.post('/', auth, adminAuth, createAd);
router.get('/', auth, adminAuth, getAds);
router.delete('/:id', auth, adminAuth, deleteAd);

module.exports = router;
