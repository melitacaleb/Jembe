// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const productRoutes = require('./routes/products');
const courseRoutes = require('./routes/courses');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

// Basic rate limiting to protect the API
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 600 }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'farmers-connect-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/products', productRoutes);
app.use('/api/courses', courseRoutes);

// 404 handler
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
