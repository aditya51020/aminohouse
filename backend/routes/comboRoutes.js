const express = require('express');
const router = express.Router();
const { getCombos, createCombo, updateCombo, deleteCombo } = require('../controllers/comboController');
const auth = require('../middleware/auth');

router.get('/', getCombos);                      // public
router.post('/', auth, createCombo);             // admin
router.put('/:id', auth, updateCombo);           // admin
router.delete('/:id', auth, deleteCombo);        // admin

module.exports = router;
