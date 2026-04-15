require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Railway/Render set X-Forwarded-For)
app.set('trust proxy', 1);

// CORS — set CORS_ORIGIN=* in .env to allow all origins (needed for remote API access from phone/other repos)
// Defaults to same-origin only for safety. See README for remote access setup.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : false;
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// API routes (apiLimiter also applied explicitly to file routes for clarity)
app.use('/api/auth', authRoutes);
app.use('/api/files', apiLimiter, fileRoutes);

// Health check (useful for hosting platforms)
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// SPA fallback — serves index.html for any unknown route
app.get('*', apiLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Cloud storage server running on http://localhost:${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});
