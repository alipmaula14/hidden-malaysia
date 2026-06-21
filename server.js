require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { globalApiLimiter, botGuard } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Trust proxy ---
// Railway (and most PaaS) sits behind a load balancer that sets X-Forwarded-For.
// Without this, req.ip is always the proxy's IP and every user shares one rate-limit bucket.
app.set('trust proxy', 1);

// --- Core middleware ---

// Parse JSON and URL-encoded form bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow cross-origin requests with credentials (needed for fetch from frontend).
// In production, restrict origin to SITE_URL so cookies can't be sent cross-domain.
const isProd = process.env.NODE_ENV === 'production';
app.use(cors({
  origin: isProd ? (process.env.SITE_URL || false) : true,
  credentials: true
}));

// Session configuration — keeps users logged in between requests
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,                                        // JS cannot read this cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production',         // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : false,
    maxAge: 24 * 60 * 60 * 1000                           // session lasts 24 hours
  }
}));

// --- Static file serving ---

// Images get a 1-day Cache-Control header so browsers cache them and don't
// re-request the same file on every page load — reduces bandwidth on Railway.
app.use('/images', express.static(path.join(__dirname, 'public', 'images'), {
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// All other public assets (CSS, JS) — served without long-term cache so
// changes take effect immediately during development.
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML pages from /views so they are accessible by filename
app.use(express.static(path.join(__dirname, 'views')));

// --- API protection ---

// Bot guard runs before all /api/* routes. Blocks empty and known-scraper
// User-Agent strings. /sitemap.xml and /robots.txt are not under /api/ so they
// are unaffected — search-engine crawlers can still reach them.
app.use('/api', botGuard);

// Global rate limiter: 100 req / 15 min per IP. Admin sessions are exempt.
// Applied after session middleware so req.session is already populated.
app.use('/api', globalApiLimiter);

// --- API routes ---

const postsRouter    = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const authRouter     = require('./routes/auth');
const newsletterRouter = require('./routes/newsletter');
const contactRouter    = require('./routes/contact');
const subscribersRouter = require('./routes/subscribers');
const accommodationsRouter = require('./routes/accommodations');
const adminRouter          = require('./routes/admin');

app.use('/api/posts',          postsRouter);
app.use('/api/comments',       commentsRouter);
app.use('/api/auth',           authRouter);
app.use('/api/newsletter',     newsletterRouter);
app.use('/api/contact',        contactRouter);
app.use('/api/subscribers',    subscribersRouter);
app.use('/api/accommodations', accommodationsRouter);
app.use('/api/admin',          adminRouter);

// --- HTML page routes ---
// Each route below sends the corresponding HTML file from the views folder.
// Query strings (e.g. ?slug=gua-kelam) are read client-side by JavaScript.

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/state', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'state.html'));
});

app.get('/post', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'post.html'));
});

// Path-style dynamic routes (Shot 4): /state/perak and /post/<slug>.
// The HTML reads the identifier from the URL path client-side.
app.get('/state/:stateName', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'state.html'));
});

app.get('/post/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'post.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'blog.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

// --- Admin page routes ---

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'login.html'));
});

// /admin and /admin/dashboard both serve the dashboard
app.get(['/admin', '/admin/dashboard'], (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'dashboard.html'));
});

app.get('/admin/posts', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'posts.html'));
});

app.get('/admin/post-editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'post-editor.html'));
});

app.get('/admin/comments', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'comments.html'));
});

app.get('/admin/messages', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'messages.html'));
});

app.get('/admin/subscribers', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'subscribers.html'));
});

app.get('/admin/accommodations', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'accommodations.html'));
});

app.get('/admin/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'settings.html'));
});

app.get('/admin/search-log', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin', 'search-log.html'));
});

// --- Error handling ---

// 404: no route matched
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// 500: something threw an error in a route handler
app.use((err, req, res, next) => {
  // mysql2 throws this when the connection pool queue is full (queueLimit exceeded)
  if (err.code === 'POOL_QUEUE_LIMIT_REACHED') {
    console.warn('[DB-POOL] Queue limit reached — returning 503');
    return res.status(503).json({ success: false, error: 'Server is busy. Please try again shortly.' });
  }
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Hidden Malaysia running at http://localhost:${PORT}`);
});
