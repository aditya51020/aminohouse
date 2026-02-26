const express = require('express');
const router = express.Router();
const { getIngredients, createIngredient, updateIngredient, deleteIngredient } = require('../controllers/ingredientController');
const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');

// Protected Routes (Admin only)
router.get('/prep', auth, adminAuth, require('../controllers/ingredientController').getPrepSuggestions);
router.get('/', auth, adminAuth, getIngredients);
router.post('/', auth, adminAuth, createIngredient);
router.put('/:id', auth, adminAuth, updateIngredient);
router.delete('/:id', auth, adminAuth, deleteIngredient);

module.exports = router;
