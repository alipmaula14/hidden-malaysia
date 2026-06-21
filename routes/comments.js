const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { isAdmin } = require('../middleware/auth');

// In-memory rate limiter — tracks last comment time per IP address.
// Resets when the server restarts (good enough for a university project).
const lastCommentAt = {};
const RATE_LIMIT_MS = 60 * 1000; // 1 comment per 60 seconds per IP

// --- Helpers ---

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitise(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// Formats a DB timestamp as "12 Jun 2026"
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric'
  });
}

// --- Feature 8: spam moderation helpers ---

// Read a single site_settings value (returns fallback if missing/unreachable).
async function getSetting(key, fallback = '') {
  try {
    const [rows] = await pool.execute(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?', [key]
    );
    return rows.length ? rows[0].setting_value : fallback;
  } catch (_) {
    return fallback; // table may not exist yet (pre-migration) — fail open
  }
}

// Heuristic spam scan. Returns a reason string if flagged, else null.
function detectSpam(content, name, email, spamKeywords) {
  const reasons = [];

  // Multiple URLs are the strongest spam signal
  const urlCount = (content.match(/https?:\/\//gi) || []).length;
  if (urlCount > 2) reasons.push(`Contains ${urlCount} URLs`);

  // Excessive capital letters (shouty spam)
  const letters = content.replace(/[^a-zA-Z]/g, '');
  if (letters.length > 20) {
    const upperRatio = (letters.match(/[A-Z]/g) || []).length / letters.length;
    if (upperRatio > 0.5) reasons.push('Excessive capital letters');
  }

  // Spam keyword list (configurable in admin settings)
  const keywords = (spamKeywords || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  const lowerContent = content.toLowerCase();
  const matched = keywords.filter(k => lowerContent.includes(k));
  if (matched.length > 0) reasons.push(`Spam keywords: ${matched.join(', ')}`);

  // Known disposable email domains
  const disposable = ['mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com'];
  const emailDomain = (email.split('@')[1] || '').toLowerCase();
  if (disposable.includes(emailDomain)) reasons.push('Disposable email domain');

  if (content.length < 5) reasons.push('Suspiciously short');

  return reasons.length > 0 ? reasons.join('; ') : null;
}

// ============================================================
// GET /api/comments/all  (admin only)
// Returns every comment across all posts, with the post title joined.
// Supports ?state=, ?search=, ?sort=newest|oldest, pagination.
// Defined BEFORE /:postId so "all" isn't treated as a post id.
// ============================================================
router.get('/all', isAdmin, async (req, res) => {
  try {
    const { state, search, sort } = req.query;
    const pageNum  = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset   = (pageNum - 1) * pageSize;

    const { status } = req.query;
    const conditions = [];
    const params = [];
    if (state)  { conditions.push('p.state = ?'); params.push(state); }
    if (search) { conditions.push('c.content LIKE ?'); params.push(`%${sanitise(search).substring(0, 100)}%`); }
    // Feature 8 — filter by moderation status (All / approved / pending / spam)
    if (status && ['approved', 'pending', 'spam'].includes(status)) {
      conditions.push('c.status = ?'); params.push(status);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const order = sort === 'oldest' ? 'ASC' : 'DESC';

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM comments c JOIN posts p ON c.post_id = p.id ${where}`, params
    );
    const total = countRows[0].total;

    const [rows] = await pool.execute(
      `SELECT c.id, c.name, c.email, c.content, c.created_at, c.status, c.flagged_reason,
              p.id AS post_id, p.title AS post_title, p.slug AS post_slug, p.state AS post_state
       FROM comments c JOIN posts p ON c.post_id = p.id
       ${where}
       ORDER BY c.created_at ${order}
       LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    const formatted = rows.map(r => ({ ...r, created_at: formatDate(r.created_at) }));
    res.json({ success: true, data: formatted, total, page: pageNum, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error('GET /api/comments/all:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
});

// ============================================================
// GET /api/comments/:postId
// Returns all comments for a given post, oldest first.
// ============================================================
router.get('/:postId', async (req, res) => {
  try {
    // Public view only ever shows approved comments (Feature 8).
    const [comments] = await pool.execute(
      `SELECT id, name, content, created_at, likes_count
       FROM comments
       WHERE post_id = ? AND status = 'approved'
       ORDER BY created_at ASC`,
      [req.params.postId]
    );

    // Format dates before sending so the frontend doesn't need to
    const formatted = comments.map(c => ({
      ...c,
      created_at: formatDate(c.created_at)
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('GET /api/comments/:postId:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
});

// ============================================================
// POST /api/comments — Submit a new comment
// ============================================================
router.post('/', async (req, res) => {
  try {
    // Rate limiting: allow one comment per IP per 60 seconds
    const ip   = req.ip || req.socket.remoteAddress;
    const last = lastCommentAt[ip];
    if (last && Date.now() - last < RATE_LIMIT_MS) {
      const waitSecs = Math.ceil((RATE_LIMIT_MS - (Date.now() - last)) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${waitSecs} seconds before commenting again`
      });
    }

    const { name, email, content, post_id } = req.body;

    // Validate required fields
    if (!name || !email || !content || !post_id) {
      return res.status(400).json({
        success: false,
        error: 'name, email, content, and post_id are all required'
      });
    }

    // Validate email format
    const cleanEmail = email.trim().substring(0, 150);
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }

    const cleanName    = sanitise(name).substring(0, 100);
    const cleanContent = sanitise(content).substring(0, 1000);

    if (cleanContent.length < 2) {
      return res.status(400).json({ success: false, error: 'Comment is too short' });
    }

    // Feature 8 — Auto-moderation. OFF by default (demo-safe): comments post
    // instantly as 'approved'. When the admin turns it ON, suspicious comments
    // are held as 'pending' for review instead of appearing publicly.
    let status = 'approved';
    let flaggedReason = null;
    const autoModerate = (await getSetting('auto_moderate_comments', 'false')) === 'true';
    if (autoModerate) {
      const keywords = await getSetting('comment_spam_keywords', '');
      flaggedReason = detectSpam(cleanContent, cleanName, cleanEmail, keywords);
      if (flaggedReason) status = 'pending';
    }

    await pool.execute(
      'INSERT INTO comments (post_id, name, email, content, status, flagged_reason) VALUES (?, ?, ?, ?, ?, ?)',
      [post_id, cleanName, cleanEmail, cleanContent, status, flaggedReason]
    );

    // Record when this IP last commented
    lastCommentAt[ip] = Date.now();

    // Tell the visitor honestly whether their comment is live or awaiting review.
    const message = status === 'approved'
      ? 'Comment added successfully'
      : 'Thanks! Your comment has been submitted and is awaiting moderation.';
    res.status(201).json({ success: true, message, status });
  } catch (err) {
    console.error('POST /api/comments:', err);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

// ============================================================
// Like rate limiter — max 5 like/unlike actions per IP per minute.
// ============================================================
const likeActions = {};                 // { ip: [timestamp, ...] }
const LIKE_WINDOW_MS = 60 * 1000;
const LIKE_MAX = 5;

function likeRateLimited(ip) {
  const now = Date.now();
  const recent = (likeActions[ip] || []).filter(t => now - t < LIKE_WINDOW_MS);
  if (recent.length >= LIKE_MAX) return true;
  recent.push(now);
  likeActions[ip] = recent;
  return false;
}

// ============================================================
// POST /api/comments/:id/like — increment likes_count
// ============================================================
router.post('/:id/like', async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    if (likeRateLimited(ip)) {
      return res.status(429).json({ success: false, error: 'Too many likes. Slow down a moment.' });
    }
    const [result] = await pool.execute('UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    const [rows] = await pool.execute('SELECT likes_count FROM comments WHERE id = ?', [req.params.id]);
    res.json({ success: true, likes_count: rows[0].likes_count });
  } catch (err) {
    console.error('POST /api/comments/:id/like:', err);
    res.status(500).json({ success: false, error: 'Failed to like comment' });
  }
});

// ============================================================
// POST /api/comments/:id/unlike — decrement likes_count (min 0)
// ============================================================
router.post('/:id/unlike', async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    if (likeRateLimited(ip)) {
      return res.status(429).json({ success: false, error: 'Too many likes. Slow down a moment.' });
    }
    const [result] = await pool.execute(
      'UPDATE comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?', [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    const [rows] = await pool.execute('SELECT likes_count FROM comments WHERE id = ?', [req.params.id]);
    res.json({ success: true, likes_count: rows[0].likes_count });
  } catch (err) {
    console.error('POST /api/comments/:id/unlike:', err);
    res.status(500).json({ success: false, error: 'Failed to unlike comment' });
  }
});

// ============================================================
// PUT /api/comments/:id/status — Approve or mark spam (admin only)
// body: { status: 'approved' | 'pending' | 'spam' }
// ============================================================
router.put('/:id/status', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'pending', 'spam'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    // Clear the flag reason once a human approves the comment.
    const reason = status === 'approved' ? null : undefined;
    const [result] = await pool.execute(
      reason === null
        ? 'UPDATE comments SET status = ?, flagged_reason = NULL WHERE id = ?'
        : 'UPDATE comments SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    res.json({ success: true, message: `Comment marked ${status}`, status });
  } catch (err) {
    console.error('PUT /api/comments/:id/status:', err);
    res.status(500).json({ success: false, error: 'Failed to update comment status' });
  }
});

// ============================================================
// DELETE /api/comments/:id — Remove a comment (admin only)
// ============================================================
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM comments WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    console.error('DELETE /api/comments/:id:', err);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
});

module.exports = router;
