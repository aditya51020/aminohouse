const express = require('express');
const { generateQR } = require('../controllers/qrController');
const router = express.Router();

router.get('/', generateQR);

module.exports = router;