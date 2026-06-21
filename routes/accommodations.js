const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { isAdmin } = require('../middleware/auth');

const TYPES  = ['hotel', 'homestay', 'resort', 'budget', 'hostel', 'chalet'];
const PRICES = ['$', '$$', '$$$', '$$$$'];

function sanitise(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// ============================================================
// GET /api/accommodations/post/:postId — accommodations for a post (public)
// ============================================================
router.get('/post/:postId', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, post_id, name, type, distance_km, price_range, description, booking_url, image_url, rating
       FROM accommodations WHERE post_id = ? ORDER BY distance_km ASC`,
      [req.params.postId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/accommodations/post/:postId:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch accommodations' });
  }
});

// ============================================================
// GET /api/accommodations — all accommodations (admin), with post title.
// Supports ?post_id= filter.
// ============================================================
router.get('/', isAdmin, async (req, res) => {
  try {
    const { post_id } = req.query;
    const where = post_id ? 'WHERE a.post_id = ?' : '';
    const params = post_id ? [post_id] : [];
    const [rows] = await pool.execute(
      `SELECT a.*, p.title AS post_title, p.slug AS post_slug
       FROM accommodations a JOIN posts p ON a.post_id = p.id
       ${where}
       ORDER BY p.title ASC, a.distance_km ASC`,
      params
    );
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('GET /api/accommodations:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch accommodations' });
  }
});

// ============================================================
// POST /api/accommodations — create (admin)
// ============================================================
router.post('/', isAdmin, async (req, res) => {
  try {
    const { post_id, name, type, distance_km, price_range, description, booking_url, image_url, rating } = req.body;
    if (!post_id || !name) {
      return res.status(400).json({ success: false, error: 'post_id and name are required' });
    }
    const cleanType  = TYPES.includes(type) ? type : 'hotel';
    const cleanPrice = PRICES.includes(price_range) ? price_range : '$$';

    const [result] = await pool.execute(
      `INSERT INTO accommodations (post_id, name, type, distance_km, price_range, description, booking_url, image_url, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        post_id,
        sanitise(name).substring(0, 150),
        cleanType,
        distance_km !== '' && distance_km != null ? distance_km : null,
        cleanPrice,
        sanitise(description || '').substring(0, 1000),
        sanitise(booking_url || '').substring(0, 500),
        sanitise(image_url || '').substring(0, 500),
        rating !== '' && rating != null ? rating : null
      ]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    console.error('POST /api/accommodations:', err);
    res.status(500).json({ success: false, error: 'Failed to create accommodation' });
  }
});

// ============================================================
// PUT /api/accommodations/:id — update (admin)
// ============================================================
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { name, type, distance_km, price_range, description, booking_url, image_url, rating } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'name is required' });
    const cleanType  = TYPES.includes(type) ? type : 'hotel';
    const cleanPrice = PRICES.includes(price_range) ? price_range : '$$';

    const [result] = await pool.execute(
      `UPDATE accommodations
       SET name = ?, type = ?, distance_km = ?, price_range = ?, description = ?, booking_url = ?, image_url = ?, rating = ?
       WHERE id = ?`,
      [
        sanitise(name).substring(0, 150), cleanType,
        distance_km !== '' && distance_km != null ? distance_km : null,
        cleanPrice,
        sanitise(description || '').substring(0, 1000),
        sanitise(booking_url || '').substring(0, 500),
        sanitise(image_url || '').substring(0, 500),
        rating !== '' && rating != null ? rating : null,
        req.params.id
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Accommodation not found' });
    }
    res.json({ success: true, message: 'Accommodation updated' });
  } catch (err) {
    console.error('PUT /api/accommodations/:id:', err);
    res.status(500).json({ success: false, error: 'Failed to update accommodation' });
  }
});

// ============================================================
// DELETE /api/accommodations/:id — delete (admin)
// ============================================================
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM accommodations WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Accommodation not found' });
    }
    res.json({ success: true, message: 'Accommodation deleted' });
  } catch (err) {
    console.error('DELETE /api/accommodations/:id:', err);
    res.status(500).json({ success: false, error: 'Failed to delete accommodation' });
  }
});

module.exports = router;
