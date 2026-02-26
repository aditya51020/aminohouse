// routes/customerAuthRoutes.js
const express = require('express');
const { customerLogin, completeCustomerProfile } = require('../controllers/customerAuthController');
const customerAuth = require('../middleware/customerAuth'); // See below
const router = express.Router();

router.post('/login', customerLogin);
router.post('/profile', customerAuth, completeCustomerProfile);
router.get('/me', customerAuth, (req, res) => {
  res.json(req.user);
});
module.exports = router;