const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const pool    = require('../config/db');
const { isAdmin } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');

// --- Helpers ---

function sanitise(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
}

// Converts a post title into a URL-safe slug
// e.g. "Gua Kelam: Perlis's Cave" -> "gua-kelam-perliss-cave"
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/'/g, '')              // remove apostrophes
    .replace(/[^a-z0-9\s-]/g, ' ') // replace special chars with space
    .replace(/\s+/g, '-')           // spaces to hyphens
    .replace(/-+/g, '-')            // collapse double hyphens
    .replace(/^-|-$/g, '');         // trim leading/trailing hyphens
}

// ============================================================
// GET /api/posts
// Returns paginated published posts.
// Query params: ?state=perak&category=nature&search=cave&limit=6&page=1
// ============================================================
router.get('/', searchLimiter, async (req, res) => {
  try {
    const { state, category, search, exclude_state, random, limit = 6, page = 1 } = req.query;
    const isRandom = String(random) === 'true';
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * pageSize;

    // Build WHERE clause dynamically — only add conditions for supplied filters
    const conditions = ['p.published = 1'];
    const params     = [];

    if (state) {
      conditions.push('p.state = ?');
      params.push(state);
    }
    // Feature 2 — "More stories from across Malaysia" excludes the current state
    if (exclude_state) {
      conditions.push('p.state != ?');
      params.push(exclude_state);
    }
    if (category) {
      conditions.push('p.category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.tags LIKE ?)');
      const term = `%${sanitise(search).substring(0, 100)}%`;
      params.push(term, term, term);
    }

    const where = conditions.join(' AND ');

    // Count total matching posts for the pagination metadata
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM posts p WHERE ${where}`,
      params
    );
    const total = countRows[0].total;

    // Random mode (Feature 2): shuffle and skip paging; ordered mode otherwise.
    const orderClause = isRandom ? 'ORDER BY RAND()' : 'ORDER BY p.created_at DESC';
    // pageSize and offset are integers (bounded above) — safe to interpolate directly.
    // mysql2 prepared statements reject LIMIT/OFFSET as bound parameters (ER_WRONG_ARGUMENTS).
    const pageClause = isRandom ? `LIMIT ${pageSize}` : `LIMIT ${pageSize} OFFSET ${offset}`;

    const [posts] = await pool.execute(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.state, p.category,
              p.cover_image, p.tags, p.created_at,
              u.username AS author
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE ${where}
       ${orderClause}
       ${pageClause}`,
      params
    );

    // Feature 5 — Search analytics: log real visitor searches (fire-and-forget).
    // IP is SHA-256 hashed before storage so no raw IP is ever persisted.
    if (search && sanitise(search).length > 0) {
      const ipHash = crypto.createHash('sha256').update(req.ip || '').digest('hex');
      pool.query(
        'INSERT INTO search_log (query, results_count, ip_hash) VALUES (?, ?, ?)',
        [sanitise(search).substring(0, 200), total, ipHash]
      ).catch(err => console.error('Search log error:', err.message));
    }

    res.json({
      success: true,
      data: posts,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    console.error('GET /api/posts:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch posts' });
  }
});

// ============================================================
// GET /api/posts/featured
// Returns the 4 most recent published posts for the homepage.
// IMPORTANT: this route must be defined BEFORE /:slug so that
// the word "featured" is not matched as a slug.
// ============================================================
router.get('/featured', async (req, res) => {
  try {
    const [posts] = await pool.execute(
      `SELECT id, title, slug, excerpt, state, category, cover_image, tags, created_at
       FROM posts
       WHERE published = 1
       ORDER BY created_at DESC
       LIMIT 4`
    );
    res.json({ success: true, data: posts });
  } catch (err) {
    console.error('GET /api/posts/featured:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch featured posts' });
  }
});

// ============================================================
// GET /api/posts/all  (admin only)
// Returns ALL posts — published AND drafts — with comment counts.
// Supports ?state=, ?status=published|draft, ?search=, pagination.
// Defined BEFORE /:slug so "all" isn't treated as a slug.
// ============================================================
router.get('/all', isAdmin, async (req, res) => {
  try {
    const { state, status, search } = req.query;
    const pageNum  = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset   = (pageNum - 1) * pageSize;

    const conditions = [];
    const params = [];
    if (state)  { conditions.push('p.state = ?'); params.push(state); }
    if (status === 'published') conditions.push('p.published = 1');
    if (status === 'draft')     conditions.push('p.published = 0');
    if (search) {
      conditions.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.tags LIKE ?)');
      const term = `%${sanitise(search).substring(0, 100)}%`;
      params.push(term, term, term);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM posts p ${where}`, params
    );
    const total = countRows[0].total;

    const [posts] = await pool.execute(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.state, p.category, p.cover_image,
              p.published, p.created_at, p.updated_at,
              u.username AS author,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    res.json({ success: true, data: posts, total, page: pageNum, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error('GET /api/posts/all:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch posts' });
  }
});

// ============================================================
// GET /api/posts/id/:id  (admin only)
// Returns a single post by numeric id (drafts included) for the editor.
// Defined BEFORE /:slug so "id" isn't treated as a slug.
// ============================================================
router.get('/id/:id', isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, u.username AS author FROM posts p
       LEFT JOIN users u ON p.author_id = u.id WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /api/posts/id/:id:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch post' });
  }
});

// ============================================================
// GET /api/posts/:slug
// Returns a single post plus up to 3 related posts from the same state.
// ============================================================
router.get('/:slug', async (req, res) => {
  try {
    const slug = sanitise(req.params.slug).substring(0, 200);

    const [rows] = await pool.execute(
      `SELECT p.*, u.username AS author
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.slug = ? AND p.published = 1`,
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const post = rows[0];

    // Related posts: same state, exclude current post, newest first
    const [related] = await pool.execute(
      `SELECT id, title, slug, excerpt, state, category, cover_image, created_at
       FROM posts
       WHERE state = ? AND slug != ? AND published = 1
       ORDER BY created_at DESC
       LIMIT 3`,
      [post.state, slug]
    );

    res.json({ success: true, data: post, related });
  } catch (err) {
    console.error('GET /api/posts/:slug:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch post' });
  }
});

// ============================================================
// POST /api/posts — Create a new post (admin only)
// ============================================================
router.post('/', isAdmin, async (req, res) => {
  try {
    const { title, excerpt, content, state, category,
            cover_image, image_credit, tags, source_url, published = false } = req.body;

    if (!title || !content || !state || !category) {
      return res.status(400).json({
        success: false,
        error: 'title, content, state, and category are required'
      });
    }

    const cleanTitle = sanitise(title).substring(0, 200);
    const slug       = slugify(cleanTitle);

    const [result] = await pool.execute(
      `INSERT INTO posts
         (title, slug, excerpt, content, state, category, cover_image, image_credit, tags, source_url, author_id, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanTitle,
        slug,
        sanitise(excerpt || '').substring(0, 300),
        content,                                          // allow rich content
        state,
        category,
        sanitise(cover_image || '').substring(0, 500),
        sanitise(image_credit || '').substring(0, 300),
        sanitise(tags || '').substring(0, 300),
        sanitise(source_url || '').substring(0, 500),
        req.session.user.id,
        published ? 1 : 0
      ]
    );

    res.status(201).json({ success: true, data: { id: result.insertId, slug } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'A post with this title already exists' });
    }
    console.error('POST /api/posts:', err);
    res.status(500).json({ success: false, error: 'Failed to create post' });
  }
});

// ============================================================
// PUT /api/posts/:id — Update a post (admin only)
// ============================================================
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, state, category,
            cover_image, image_credit, tags, source_url, published } = req.body;

    if (!title || !content || !state || !category) {
      return res.status(400).json({
        success: false,
        error: 'title, content, state, and category are required'
      });
    }

    const cleanTitle = sanitise(title).substring(0, 200);
    const slug       = slugify(cleanTitle);

    const [result] = await pool.execute(
      `UPDATE posts
       SET title = ?, slug = ?, excerpt = ?, content = ?, state = ?, category = ?,
           cover_image = ?, image_credit = ?, tags = ?, source_url = ?, published = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        cleanTitle,
        slug,
        sanitise(excerpt || '').substring(0, 300),
        content,
        state,
        category,
        sanitise(cover_image || '').substring(0, 500),
        sanitise(image_credit || '').substring(0, 300),
        sanitise(tags || '').substring(0, 300),
        sanitise(source_url || '').substring(0, 500),
        published ? 1 : 0,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    res.json({ success: true, message: 'Post updated', data: { slug } });
  } catch (err) {
    console.error('PUT /api/posts/:id:', err);
    res.status(500).json({ success: false, error: 'Failed to update post' });
  }
});

// ============================================================
// DELETE /api/posts/:id — Delete a post (admin only)
// ============================================================
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM posts WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    console.error('DELETE /api/posts/:id:', err);
    res.status(500).json({ success: false, error: 'Failed to delete post' });
  }
});

// ============================================================
// PUT /api/posts/:id/toggle — Flip published / unpublished (admin only)
// ============================================================
router.put('/:id/toggle', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute('SELECT published FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const newStatus = rows[0].published ? 0 : 1;
    await pool.execute('UPDATE posts SET published = ? WHERE id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: newStatus ? 'Post published' : 'Post unpublished',
      published: newStatus === 1
    });
  } catch (err) {
    console.error('PUT /api/posts/:id/toggle:', err);
    res.status(500).json({ success: false, error: 'Failed to toggle post status' });
  }
});

module.exports = router;
