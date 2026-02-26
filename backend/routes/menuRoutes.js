const express = require('express');
const { getMenu, addMenuItem, updateMenuItem, deleteMenuItem, toggleStockController, getProfitAnalysis } = require('../controllers/menuController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', getMenu);
router.get('/analysis', auth, getProfitAnalysis); // New Endpoint
router.post('/', auth, addMenuItem);
router.put('/:id', auth, updateMenuItem);
router.delete('/:id', auth, deleteMenuItem);
router.put('/:id/stock', auth, toggleStockController);

module.exports = router;