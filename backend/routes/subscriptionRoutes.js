const express = require('express');
const router = express.Router();
const { buySubscription, getSubscriptionStatus, claimDailyMeal } = require('../controllers/subscriptionController');

router.post('/buy', buySubscription);
router.get('/status/:customerId', getSubscriptionStatus);
router.post('/claim', claimDailyMeal);

module.exports = router;
