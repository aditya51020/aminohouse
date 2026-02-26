// routes/orderRoutes.js
const express = require('express');
const {
  createOrder,
  getOrders,
  updateOrderStatus,
  getSales,
  processPayment,
  getOrder,
  getMyOrders,
  getHistory,
  getCurrentOrder,
  getOrderStatus,
  cancelOrder
} = require('../controllers/orderController');

const auth = require('../middleware/auth');
const customerAuth = require('../middleware/customerAuth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// ========== STAFF ROUTES (Admin, Kitchen, Cashier) ==========
// Protected: only staff with valid JWT token can see all orders or update status
router.get('/', auth, authorize('admin', 'cashier', 'kitchen'), getOrders);
router.get('/sales', auth, authorize('admin'), getSales);
router.put('/:id', auth, authorize('admin', 'cashier', 'kitchen'), updateOrderStatus);

// ========== CUSTOMER ROUTES ==========
router.post('/', require('../middleware/optionalAuth'), createOrder);
router.get('/history', require('../middleware/optionalAuth'), getHistory);
router.get('/current', require('../middleware/optionalAuth'), getCurrentOrder);
router.get('/:id/status', getOrderStatus);                      // ← Quick Status Poll (public ok for polling)

// ========== CANCEL ORDER (Customer or Admin) ==========
router.patch('/:id/cancel', require('../middleware/optionalAuth'), cancelOrder);

// ========== SHARED / PUBLIC ROUTES ==========
router.get('/:id', getOrder);
router.post('/payment', processPayment);

module.exports = router;