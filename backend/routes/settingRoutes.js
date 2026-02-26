const express = require('express');
const router = express.Router();
const { getKitchenStatus, toggleKitchenStatus, getStoreSettings, updateStoreSettings } = require('../controllers/settingController');
const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');

router.get('/status', getKitchenStatus);
router.post('/status', auth, adminAuth, toggleKitchenStatus);

router.get('/config', getStoreSettings);
router.put('/config', auth, adminAuth, updateStoreSettings);

module.exports = router;
