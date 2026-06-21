# Hidden Malaysia

> *Discover the gem hidden from the crowd.*

A full-stack travel blog built around an interactive map of Peninsular Malaysia, surfacing underrated destinations across six often-overlooked states — Perlis, Kedah, Perak, Pahang, Negeri Sembilan, and Johor. Built as a university web development project, designed and shipped like a real product: live deployment, a working admin CMS, rate-limited APIs, and 36 original travel narratives written in a first-person editorial voice rather than generic listicle copy.

**Live site:** _[add your Railway URL here]_
**Admin demo:** `/admin/login` — credentials in [Local Setup](#local-setup) below

---

## Why this exists

Malaysian travel content online is dominated by the same handful of destinations. Hidden Malaysia intentionally narrows its focus to six states that rarely make the front page of a travel guide, and pairs that editorial angle with a piece of UI most student projects skip entirely: a hand-built, clickable SVG map of the peninsula as the actual navigation system, not just a decoration.

---

## Highlights

- **Interactive SVG map** — real Mercator-projected state geometry (not placeholder shapes), click-to-explore navigation as the homepage's primary interaction
- **36 original articles** across 6 states, written in first-person travel-editorial voice with academic-integrity safeguards (no fabricated names, prices, or dates — every factual claim traced to a cited source)
- **Full admin CMS** — dashboard, post editor with live SEO preview and auto-slug generation, comment moderation queue, contact inbox, subscriber list, search analytics, site settings
- **Public CRUD** — visitors can comment and like comments (with rate limiting and spam heuristics), subscribe to a newsletter, and submit contact messages
- **Nearby accommodations** — linked per-post recommendations, manageable from the admin panel
- **Defense-in-depth rate limiting** — separate tiers for general API traffic, search, and login brute-force protection, with a bot-UA guard and admin-session exemption
- **Dark mode, reading progress bar, recently-viewed history** — all via CSS custom properties and `localStorage`, no extra dependencies
- **Accessibility-first** — skip links, ARIA labelling, keyboard-navigable modals, `prefers-reduced-motion` support, targeting WCAG 2.1 AA
- **Zero build step** — vanilla HTML/CSS/JS frontend, no bundler, no framework lock-in

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Node.js 18+ | |
| Framework | Express 4 | |
| Database | MySQL 8 | via `mysql2/promise` connection pool |
| Auth | `express-session` + `bcryptjs` | Session-based admin auth, hashed passwords |
| Security | `express-rate-limit`, parameterised queries, input sanitisation | See [Security](#security) below |
| Frontend | Vanilla HTML / CSS / JS | No build tooling, AOS for scroll animation |
| Hosting | Railway | Web service + managed MySQL plugin, internal network connection |

---

## Security

- **SQL injection** — every query uses parameterised statements (`?` placeholders) via `mysql2`. Pagination (`LIMIT`/`OFFSET`) is the one deliberate exception: those values are `parseInt()`-validated and bounds-checked in JavaScript before being interpolated, working around a known `mysql2` prepared-statement limitation, without reopening injection risk.
- **XSS** — all user-submitted text (comments, contact form, post content) is HTML-stripped server-side before storage.
- **Password storage** — `bcryptjs` hashing, never plaintext.
- **Rate limiting** — tiered limits per endpoint type (global API, search, login), with `skipSuccessfulRequests` on login so legitimate users are never penalised, and an admin-session bypass on the global limiter.
- **Session security** — `httpOnly` cookies, `secure` flag in production, environment-driven CORS locked to the deployed domain.
- **Secrets management** — all credentials via environment variables, `.env` excluded from version control (`.env.example` provided as a template).

---

## Local Setup

### Prerequisites

- Node.js 18 or later
- MySQL 8.0 or later
- A terminal

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd hidden-malaysia

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env
# Edit .env and set DB_HOST, DB_USER, DB_PASS, DB_NAME, SESSION_SECRET

# 4. Create the database and seed all content
node scripts/init-db.js

# 5. Start the development server
npm run dev
# Server runs at http://localhost:3000
```

Admin login after seeding: **username:** `admin` **password:** `Admin@123`

---

## Deployment

Deployed on [Railway](https://railway.app) — a Node.js web service plus a managed MySQL plugin in the same project, connected over Railway's internal network (`mysql.railway.internal`).

Summary of the setup:
1. Push to GitHub, connect the repo as a Railway service
2. Add a MySQL plugin to the project — Railway auto-injects `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT` into the web service
3. Set `NODE_ENV=production`, `SESSION_SECRET`, and `SITE_URL` manually in the service's Variables tab
4. Generate a public domain under Settings → Networking
5. Run `node scripts/init-db.js` once via Railway's Console tab to create and seed all tables
6. Push-to-deploy from `main` from then on

`config/db.js` is written to prefer the Railway-injected `MYSQL*` variables whenever present, falling back to local `DB_*` variables otherwise — so the same codebase runs unmodified in both environments.

---

## Folder Structure

```
hidden-malaysia/
├── config/
│   └── db.js              # MySQL connection pool
├── database/
│   ├── schema.sql          # Base schema reference
│   ├── seed.js             # 18 main posts + users + comments
│   └── seed-extras.js      # 18 hidden-gem posts + accommodations
├── middleware/
│   ├── auth.js             # isAdmin guard
│   └── rateLimiter.js      # globalApiLimiter, searchLimiter, loginLimiter, botGuard
├── public/
│   ├── css/style.css
│   ├── images/
│   └── js/                 # Page-level JS + admin JS
├── routes/
│   ├── accommodations.js
│   ├── admin.js
│   ├── auth.js
│   ├── comments.js
│   ├── contact.js
│   ├── newsletter.js
│   ├── posts.js
│   └── subscribers.js
├── scripts/
│   └── init-db.js          # One-time DB initialiser
├── views/
│   ├── admin/              # Admin panel HTML pages
│   ├── about.html
│   ├── blog.html
│   ├── contact.html
│   ├── index.html
│   ├── post.html
│   └── state.html
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes (prod) | Set to `production` on Railway |
| `SESSION_SECRET` | Yes | Long random string for session signing |
| `SITE_URL` | Yes (prod) | Your Railway or custom domain URL (for CORS) |
| `DB_HOST` | Local only | MySQL host (local dev) |
| `DB_PORT` | Local only | MySQL port, default 3306 |
| `DB_USER` | Local only | MySQL username |
| `DB_PASS` | Local only | MySQL password |
| `DB_NAME` | Local only | Database name, default `hidden_malaysia` |
| `MYSQLHOST` | Auto (Railway) | Injected by Railway MySQL plugin |
| `MYSQLPORT` | Auto (Railway) | Injected by Railway MySQL plugin |
| `MYSQLUSER` | Auto (Railway) | Injected by Railway MySQL plugin |
| `MYSQLPASSWORD` | Auto (Railway) | Injected by Railway MySQL plugin |
| `MYSQLDATABASE` | Auto (Railway) | Injected by Railway MySQL plugin |
| `PORT` | Auto (Railway) | Injected by Railway — do not set manually |

---

## License

MIT — free to use for academic and personal projects.

---

## About this project

Built for **BIT21503 Web Development**, Universiti Tun Hussein Onn Malaysia (UTHM). All article content is original first-person travel writing, factually grounded in cited sources (Tripadvisor, Wikipedia, Wikimedia Commons, and local travel publications) and disclosed as a composite editorial voice rather than a literal personal account — see the byline on each post for attribution.
