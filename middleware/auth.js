// isAdmin: only allows requests from logged-in users with role = 'admin'
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Admin access required' });
}

// isLoggedIn: allows any logged-in user (admin or visitor)
function isLoggedIn(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Login required' });
}

module.exports = { isAdmin, isLoggedIn };
