const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const pool    = require('../config/db');
const { loginLimiter } = require('../middleware/rateLimiter');

// Generic error message — never reveal which field is wrong
const GENERIC_ERROR = 'Invalid username or password';

// ============================================================
// POST /api/auth/login
// Validates credentials and creates a session on success.
// ============================================================
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    // Look up the user by username (case-sensitive)
    const [rows] = await pool.execute(
      'SELECT id, username, email, password, role FROM users WHERE username = ?',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: GENERIC_ERROR });
    }

    const user = rows[0];

    // Compare the submitted plain-text password against the stored bcrypt hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: GENERIC_ERROR });
    }

    // Store minimal user info in the session — never store the password hash
    req.session.user = {
      id:       user.id,
      username: user.username,
      email:    user.email,
      role:     user.role
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: { username: user.username, role: user.role }
    });
  } catch (err) {
    console.error('POST /api/auth/login:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ============================================================
// POST /api/auth/logout
// Destroys the session and clears the session cookie.
// ============================================================
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// ============================================================
// GET /api/auth/me
// Returns the logged-in user's info, or 401 if not logged in.
// The frontend uses this to check login state on page load.
// ============================================================
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, error: 'Not logged in' });
  }
  res.json({ success: true, data: req.session.user });
});

module.exports = router;
