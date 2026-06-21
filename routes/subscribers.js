const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { isAdmin } = require('../middleware/auth');

// ============================================================
// GET /api/subscribers  (admin only)
// Returns every newsletter subscriber, newest first.
// ============================================================
router.get('/', isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, subscribed_at FROM subscribers ORDER BY subscribed_at DESC'
    );
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('GET /api/subscribers:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch subscribers' });
  }
});

// ============================================================
// DELETE /api/subscribers/:id  (admin only)
// ============================================================
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM subscribers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Subscriber not found' });
    }
    res.json({ success: true, message: 'Subscriber removed' });
  } catch (err) {
    console.error('DELETE /api/subscribers/:id:', err);
    res.status(500).json({ success: false, error: 'Failed to remove subscriber' });
  }
});

module.exports = router;
