const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { isAdmin } = require('../middleware/auth');

// Everything in this router is admin-only.
router.use(isAdmin);

function sanitise(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// ============================================================
// GET /api/admin/search-stats  (Feature 5)
// Aggregates the last 7 days of search activity for the dashboard widget.
// ============================================================
router.get('/search-stats', async (req, res) => {
  try {
    const WEEK = 'searched_at >= (NOW() - INTERVAL 7 DAY)';

    const [topQueries] = await pool.query(
      `SELECT query, COUNT(*) AS count
       FROM search_log
       WHERE ${WEEK}
       GROUP BY query ORDER BY count DESC LIMIT 10`
    );

    // Zero-result searches = content gaps worth filling.
    const [zeroResults] = await pool.query(
      `SELECT query, COUNT(*) AS count
       FROM search_log
       WHERE ${WEEK} AND results_count = 0
       GROUP BY query ORDER BY count DESC LIMIT 10`
    );

    const [[totals]] = await pool.query(
      `SELECT COUNT(*) AS total_searches, COUNT(DISTINCT ip_hash) AS unique_searchers
       FROM search_log WHERE ${WEEK}`
    );

    res.json({
      success: true,
      top_queries: topQueries,
      zero_result_queries: zeroResults,
      total_searches: totals.total_searches || 0,
      unique_searchers: totals.unique_searchers || 0
    });
  } catch (err) {
    console.error('GET /api/admin/search-stats:', err);
    res.status(500).json({ success: false, error: 'Failed to load search stats' });
  }
});

// ============================================================
// GET /api/admin/search-log  (Feature 5)
// Full paginated log. ?zero=true shows only zero-result searches.
// ?from=YYYY-MM-DD&to=YYYY-MM-DD date range.
// ============================================================
router.get('/search-log', async (req, res) => {
  try {
    const { zero, from, to } = req.query;
    const pageNum  = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset   = (pageNum - 1) * pageSize;

    const conditions = [];
    const params = [];
    if (String(zero) === 'true') conditions.push('results_count = 0');
    if (from) { conditions.push('searched_at >= ?'); params.push(from + ' 00:00:00'); }
    if (to)   { conditions.push('searched_at <= ?'); params.push(to + ' 23:59:59'); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM search_log ${where}`, params
    );
    const [rows] = await pool.query(
      `SELECT id, query, results_count, searched_at
       FROM search_log ${where}
       ORDER BY searched_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    res.json({ success: true, data: rows, total, page: pageNum, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error('GET /api/admin/search-log:', err);
    res.status(500).json({ success: false, error: 'Failed to load search log' });
  }
});

// ============================================================
// GET /api/admin/settings  (Feature 8)
// Returns all site_settings as a flat key→value object.
// ============================================================
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM site_settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('GET /api/admin/settings:', err);
    res.status(500).json({ success: false, error: 'Failed to load settings' });
  }
});

// ============================================================
// PUT /api/admin/settings  (Feature 8)
// body: { auto_moderate_comments: 'true'|'false', comment_spam_keywords: '...' }
// Only known keys are accepted (upserted).
// ============================================================
const ALLOWED_SETTINGS = ['auto_moderate_comments', 'comment_spam_keywords'];

router.put('/settings', async (req, res) => {
  try {
    const updates = req.body || {};
    const keys = Object.keys(updates).filter(k => ALLOWED_SETTINGS.includes(k));
    if (!keys.length) {
      return res.status(400).json({ success: false, error: 'No valid settings supplied' });
    }
    for (const key of keys) {
      let value = String(updates[key]);
      if (key === 'auto_moderate_comments') value = value === 'true' ? 'true' : 'false';
      else value = sanitise(value).substring(0, 500);
      await pool.execute(
        `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value]
      );
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    console.error('PUT /api/admin/settings:', err);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

module.exports = router;
