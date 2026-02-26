// backend/server.js
const dotenv = require('dotenv');
dotenv.config(); // MUST be first — loads .env before anything uses process.env

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const uploadRoutes = require('./routes/upload');
const customerRoutes = require('./routes/customerRoutes');

const app = express();

// Required for express-rate-limit on Render/Vercel
app.set('trust proxy', 1);

// CORS MUST BE FIRST
const corsOptions = {
    origin: function (origin, callback) {
        const allowed = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000',
            /\.vercel\.app$/,
            /\.onrender\.com$/,
        ];
        if (!origin) return callback(null, true);
        const isAllowed = allowed.some(pattern =>
            pattern instanceof RegExp ? pattern.test(origin) : pattern === origin
        );
        if (isAllowed) return callback(null, true);
        if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// SECURITY & PERFORMANCE MIDDLEWARE
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate Limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many login attempts, please try again later.'
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many requests, please try again later.'
});

app.use('/api/auth', authLimiter);
app.use('/api/customer-auth', authLimiter);
app.use(generalLimiter);

app.use(express.json());

// ROUTES
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/qr', require('./routes/qrRoutes'));
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static('Uploads'));
app.use('/api/customers', customerRoutes);
app.use('/api/customer-auth', require('./routes/customerAuthRoutes'));
app.use('/api/ingredients', require('./routes/ingredientRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/ads', require('./routes/adRoutes'));
app.use('/api/combos', require('./routes/comboRoutes'));

// 404 catch-all
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Start server AFTER DB connects
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
    const { seedDefaultAdmin } = require('./utils/seed');
    await seedDefaultAdmin();
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}).catch(err => {
    console.error('❌ Failed to connect to DB, server not started:', err.message);
    process.exit(1);
});

module.exports = app;