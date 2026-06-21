const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { isAdmin } = require('../middleware/auth');

// ============================================================
// In-memory rate limiter — max 3 submissions per IP per hour.
// Stores an array of timestamps per IP. Resets on server restart.
// ============================================================
const submissions = {};                 // { ip: [timestamp, timestamp, ...] }
const WINDOW_MS = 60 * 60 * 1000;        // 1 hour
const MAX_PER_WINDOW = 3;

// Allowed subject values (must match the ENUM in the DB)
const SUBJECTS = ['general', 'submit_gem', 'report_info', 'collaboration', 'other'];
const STATUSES = ['unread', 'read', 'replied'];

// --- Helpers ---
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function sanitise(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();   // strip HTML tags + trim
}

// ============================================================
// POST /api/contact — submit a contact message (public)
// ============================================================
router.post('/', async (req, res) => {
  try {
    // --- Rate limiting ---
    const ip  = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (submissions[ip] || []).filter(t => now - t < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) {
      return res.status(429).json({
        success: false,
        error: 'Too many messages. Please try again later (max 3 per hour).'
      });
    }

    const { name, email, subject, message } = req.body;

    // --- Validation ---
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required' });
    }

    const cleanName    = sanitise(name).substring(0, 100);
    const cleanEmail   = String(email).trim().substring(0, 150);
    const cleanMessage = sanitise(message).substring(0, 2000);
    // Accept the enum value directly, or fall back to 'general'
    const cleanSubject = SUBJECTS.includes(subject) ? subject : 'general';

    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'Please enter your name' });
    }
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }
    if (cleanMessage.length < 10) {
      return res.status(400).json({ success: false, error: 'Message must be at least 10 characters' });
    }

    // --- Insert ---
    await pool.execute(
      'INSERT INTO contact_messages (name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?)',
      [cleanName, cleanEmail, cleanSubject, cleanMessage, ip]
    );

    // Record this submission for rate limiting
    recent.push(now);
    submissions[ip] = recent;

    res.status(201).json({
      success: true,
      message: "Message sent! We'll reply within 3-5 days."
    });
  } catch (err) {
    console.error('POST /api/contact:', err);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// ============================================================
// GET /api/contact — list messages (admin only)
// Supports ?status=unread and pagination ?page=1&limit=20
// ============================================================
router.get('/', isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const pageNum  = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset   = (pageNum - 1) * pageSize;

    const conditions = [];
    const params = [];
    if (status && STATUSES.includes(status)) {
      conditions.push('status = ?');
      params.push(status);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM contact_messages ${where}`, params
    );
    const total = countRows[0].total;

    const [rows] = await pool.execute(
      `SELECT id, name, email, subject, message, status, ip_address, created_at
       FROM contact_messages ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: rows,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    console.error('GET /api/contact:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// ============================================================
// PUT /api/contact/:id/status — update status (admin only)
// ============================================================
router.put('/:id/status', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const [result] = await pool.execute(
      'UPDATE contact_messages SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, message: 'Status updated', status });
  } catch (err) {
    console.error('PUT /api/contact/:id/status:', err);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// ============================================================
// DELETE /api/contact/:id — delete a message (admin only)
// ============================================================
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('DELETE /api/contact/:id:', err);
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
});

module.exports = router;
