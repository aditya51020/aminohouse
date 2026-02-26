const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer, updateCustomer, exportCustomersCSV } = require('../controllers/customerController');
const auth = require('../middleware/auth');

router.get('/export', auth, exportCustomersCSV); // CSV export — must be before /:id
router.get('/', auth, getCustomers);
router.post('/', auth, createCustomer);
router.put('/:id', auth, updateCustomer);

module.exports = router;