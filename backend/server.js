// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/database');
require('./models/associations'); // Init associations
const uploadRoutes = require('./routes/upload');
const customerRoutes = require('./routes/customerRoutes');

dotenv.config();
connectDB(); // PostgreSQL Connected

const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

// CORS MUST BE FIRST
const corsOptions = {
    origin: function (origin, callback) {
        const allowed = [
            // Local development
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000',
            // Vercel production/preview (all subdomains)
            /\.vercel\.app$/,
        ];
        // Allow no-origin (curl, mobile, Postman)
        if (!origin) return callback(null, true);
        const isAllowed = allowed.some(pattern =>
            pattern instanceof RegExp ? pattern.test(origin) : pattern === origin
        );
        if (isAllowed) return callback(null, true);
        // Also allow custom domain if set in env
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

// Rate Limiting: STRICT for auth routes (50 req/15min per IP)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many login attempts, please try again later.'
});

// Rate Limiting: LENIENT for general API (500 req/15min per IP)
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
app.use('/uploads', express.static('Uploads')); // Case-sensitive
app.use('/api/customers', customerRoutes);
app.use('/api/customer-auth', require('./routes/customerAuthRoutes'));
app.use('/api/ingredients', require('./routes/ingredientRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/ads', require('./routes/adRoutes'));
app.use('/api/combos', require('./routes/comboRoutes'));

// 404 catch-all for unmatched routes
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Always listen — works on Render (PORT env) and local dev
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;