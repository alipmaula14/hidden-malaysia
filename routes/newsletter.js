const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================
// POST /api/newsletter/subscribe
// Saves an email to the subscribers table.
// Handles duplicates gracefully — returns success either way.
// ============================================================
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase().substring(0, 150);

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }

    try {
      await pool.execute('INSERT INTO subscribers (email) VALUES (?)', [cleanEmail]);
    } catch (dupErr) {
      // MySQL error code ER_DUP_ENTRY means the email is already subscribed
      if (dupErr.code === 'ER_DUP_ENTRY') {
        return res.json({ success: true, message: 'Already subscribed!' });
      }
      throw dupErr; // re-throw unexpected errors
    }

    res.json({
      success: true,
      message: "You're subscribed! Hidden Malaysia updates incoming."
    });
  } catch (err) {
    console.error('POST /api/newsletter/subscribe:', err);
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
});

module.exports = router;
