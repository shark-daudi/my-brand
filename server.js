// server.js — Main entry point
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

// ── Routes ──
const authRoutes    = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const usersRoutes   = require('./routes/users');

// ── DB init (runs on require) ──
require('./db');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve frontend (index.html) ──
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ──
app.use('/api/auth',    authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users',   usersRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ── Catch-all: serve frontend ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📋 API docs: http://localhost:${PORT}/api/health\n`);
});
