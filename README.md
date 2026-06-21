# Hidden Malaysia

A travel blog showcasing underrated destinations across six Malaysian states — Perlis, Kedah, Perak, Pahang, Negeri Sembilan, and Johor.

**Live URL:** _[will be added after deployment]_

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | MySQL 8 (mysql2/promise pool) |
| Auth | express-session + bcryptjs |
| Rate limiting | express-rate-limit |
| Frontend | Vanilla HTML/CSS/JS (no build step) |
| Hosting | Railway |

---

## Features

- Six Malaysian states with dedicated state pages
- 36 blog posts (18 main + 18 hidden gems) with rich content
- Full-text search with analytics logging
- Comment system with moderation and spam filtering
- Newsletter subscriber management
- Contact form (rate-limited)
- Nearby accommodation recommendations per post
- Admin panel (dashboard, post editor, comment moderation, settings, search log)
- Rate limiting and bot guard on all API endpoints

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

## Deployment (Railway)

See [RAILWAY-DEPLOY.md](RAILWAY-DEPLOY.md) for the full step-by-step guide.

Quick summary:
1. Push this repo to GitHub
2. Create a Railway project and link the repo
3. Add a MySQL plugin to the project
4. Set `NODE_ENV=production`, `SESSION_SECRET`, and `SITE_URL` in Railway variables
5. Deploy — Railway runs `npm start` automatically
6. Open a Railway shell and run `node scripts/init-db.js` once

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
├── RAILWAY-DEPLOY.md
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
