// server.js — GenScholar Express Backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const formatRoutes = require('./backend/routes/format');
const documentRoutes = require('./backend/routes/documents');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security & Middleware ──
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : '*' }));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static Files ──
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// ── API Routes ──
app.use('/api', formatRoutes);
app.use('/api/documents', documentRoutes);

// ── Page Routes ──
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'public', 'index.html')));
app.get('/formatter', (req, res) => res.redirect('/#app-section'));

// ── Health Check ──
app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() }));

// ── 404 Handler ──
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error('[GenScholar Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════╗`);
  console.log(`  ║   GenScholar Server v1.0.0   ║`);
  console.log(`  ║   Running on port ${PORT}        ║`);
  console.log(`  ╚══════════════════════════════╝\n`);
  console.log(`  → Local:   http://localhost:${PORT}`);
  console.log(`  → Health:  http://localhost:${PORT}/health\n`);
});
