const rateLimit = require('express-rate-limit');

// ----------------------------------------------------------------
// Shared logger — prints to console so Railway's log stream captures it.
// A future enhancement could INSERT into rate_limit_log table here.
// ----------------------------------------------------------------
function logLimit(type, req) {
  console.warn(
    `[RATE-LIMIT] ${new Date().toISOString()} type=${type} ip=${req.ip} ` +
    `method=${req.method} endpoint=${req.originalUrl}`
  );
}

// ----------------------------------------------------------------
// 1. Global API limiter
//    400 requests per 15 minutes per IP (temporarily raised for demo).
//    Admin sessions are exempt so the admin panel never gets blocked.
// ----------------------------------------------------------------
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: true,
  skip: (req) => !!(req.session && req.session.user && req.session.user.role === 'admin'),
  handler: (req, res) => {
    logLimit('global', req);
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down and try again in a few minutes.',
      retry_after: 900
    });
  }
});

// ----------------------------------------------------------------
// 2. Search-specific limiter
//    20 search queries per 5 minutes per IP.
//    Skipped entirely when ?search= is absent (normal browsing).
// ----------------------------------------------------------------
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: true,
  skip: (req) => !req.query.search,
  handler: (req, res) => {
    logLimit('search', req);
    res.status(429).json({
      success: false,
      error: 'Too many search requests. Please wait a few minutes before searching again.',
      retry_after: 300
    });
  }
});

// ----------------------------------------------------------------
// 3. Login brute-force limiter
//    5 attempts per 15 minutes per IP.
//    skipSuccessfulRequests: true means only failed attempts (4xx)
//    count toward the limit — a successful login never increments it.
// ----------------------------------------------------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req, res) => {
    logLimit('login', req);
    res.status(429).json({
      success: false,
      error: 'Too many login attempts. Try again in 15 minutes.',
      retry_after: 900
    });
  }
});

// ----------------------------------------------------------------
// 4. Bot / scraper guard
//    Blocks empty User-Agent strings and known scraper libraries
//    on /api/* routes. Search-engine crawlers (Googlebot, Bingbot)
//    do not normally hit API routes, so /sitemap.xml and /robots.txt
//    remain unaffected — this middleware is only mounted on /api/*.
// ----------------------------------------------------------------
const SCRAPER_UA = /^(curl\/|python-requests\/|scrapy\/|libwww-perl\/|Go-http-client\/)/i;

function botGuard(req, res, next) {
  const ua = req.headers['user-agent'] || '';
  if (!ua || SCRAPER_UA.test(ua)) {
    console.warn(
      `[BOT-BLOCK] ${new Date().toISOString()} ip=${req.ip} ` +
      `ua="${ua || '(empty)'}" endpoint=${req.originalUrl}`
    );
    return res.status(403).json({
      success: false,
      error: 'Direct API access not allowed. Please use the web interface.'
    });
  }
  next();
}

module.exports = { globalApiLimiter, searchLimiter, loginLimiter, botGuard };
