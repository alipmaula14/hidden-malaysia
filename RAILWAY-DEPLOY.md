# Railway Deployment Guide — Hidden Malaysia

A step-by-step guide to deploying Hidden Malaysia on Railway's free tier.

---

## Prerequisites

- A [Railway](https://railway.app) account (sign up with GitHub)
- Your Hidden Malaysia code pushed to a GitHub repository

---

## Step 1 — Push Code to GitHub

If you haven't already:

```bash
# In your project root
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hidden-malaysia.git
git push -u origin main
```

Make sure your `.gitignore` excludes `.env` and `node_modules/`.

---

## Step 2 — Create a Railway Project

1. Go to [railway.app](https://railway.app) and log in.
2. Click **New Project**.
3. Select **Deploy from GitHub repo**.
4. Authorize Railway to access your GitHub account (if prompted).
5. Select your `hidden-malaysia` repository.
6. Railway will detect `package.json` and begin deploying automatically.

> Railway reads the `"start": "node server.js"` script from `package.json`. It also respects `"engines": { "node": ">=18.0.0" }` to pin the correct Node version.

---

## Step 3 — Add the MySQL Plugin

1. In your Railway project, click **+ New** (top right of the project canvas).
2. Choose **Database → MySQL**.
3. Railway creates a MySQL 8 instance and automatically injects these variables into your service:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQL_URL`

You do **not** need to set these manually — they are available automatically to your app.

---

## Step 4 — Set Environment Variables

In your Railway service (not the MySQL plugin), go to **Variables** and add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | A long random string — generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SITE_URL` | Your Railway deployment URL (e.g. `https://hidden-malaysia.up.railway.app`) — you can get this from the **Settings → Domains** tab after first deploy |

> **Tip:** Set `SITE_URL` after you know your Railway URL. The app works before it's set; the CORS lock-down just won't be active until then.

---

## Step 5 — First Deployment

Railway triggers a deploy automatically when you push to GitHub. To watch the progress:

1. Click your service on the project canvas.
2. Go to the **Deployments** tab.
3. Click the latest deployment to see the build + start logs.

A successful start log looks like:
```
MySQL connected successfully
Hidden Malaysia running at http://localhost:3000
```

Railway maps its own HTTPS URL to port 3000 automatically.

---

## Step 6 — Run the Database Initialiser

The database starts empty. You need to create all tables and seed content **once**.

### Option A — Railway Web Console (easiest)

1. In your service, go to the **Shell** tab (Railway CLI in browser).
2. Run:
   ```bash
   node scripts/init-db.js
   ```
3. Watch the output — it will create tables, seed 36 posts, and print the admin credentials.

### Option B — Railway CLI (local terminal)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run the init script in your Railway environment
railway run node scripts/init-db.js
```

### Expected output

```
============================================================
 Hidden Malaysia — Database Initialiser
============================================================
Host     : containers-us-west-xxx.railway.app:XXXX
Database : railway
------------------------------------------------------------

Step 1/3 — Creating database and tables...
✓  All tables created (or already existed).

Step 2/3 — Seeding users, main posts, comments, subscribers...
▶  Running database/seed.js ...
Connected to database. Starting seed...
  3 users created.
  18 posts inserted.
  6 comments inserted.
✓  database/seed.js completed.

Step 3/3 — Seeding hidden-gem posts and accommodations...
▶  Running database/seed-extras.js ...
  18 hidden-gem posts inserted.
  72 accommodations inserted.
✓  database/seed-extras.js completed.

============================================================
 Initialisation complete!
============================================================
  Admin login  →  username: admin  |  password: Admin@123
  Change the admin password from the Settings page after login.
============================================================
```

> **Important:** Run the initialiser only once. Running it again will truncate and re-seed the database, erasing any real user comments or contact messages.

---

## Step 7 — Verify the Deployment

1. Open your Railway URL (e.g. `https://hidden-malaysia.up.railway.app`).
2. Check the homepage loads with posts.
3. Visit `/about`, `/blog`, and a state page.
4. Log in at `/admin/login` with `admin` / `Admin@123`.
5. Browse the admin dashboard — verify post counts, search log, and settings.
6. **Change the admin password** from the Settings page immediately.

---

## Step 8 — Custom Domain (Optional)

1. In your Railway service, go to **Settings → Networking → Custom Domain**.
2. Enter your domain (e.g. `hiddenmalaysia.com`).
3. Railway gives you a CNAME target — add this to your DNS provider.
4. Update `SITE_URL` in your Railway variables to `https://hiddenmalaysia.com`.
5. Railway provisions a free Let's Encrypt TLS certificate automatically.

---

## Monitoring Credit Usage

Railway's free tier includes a monthly credit allowance. To avoid surprises:

1. Go to **Account → Usage** in Railway.
2. Watch the **Compute** and **Network** rows.
3. The MySQL plugin has its own compute cost — keep an eye on both your service and the DB plugin.

### Tips to reduce credit usage

- Railway sleeps inactive services — your app may take 2–3 seconds to wake on first request.
- Images served from `/public/images/` get a `Cache-Control: public, max-age=86400` header, reducing repeat requests.
- The bot guard rejects scrapers before they hit the database.
- The global API limiter (100 req/15 min) prevents runaway request loops.

---

## Common Errors and Fixes

### "MySQL connection failed" on startup

**Cause:** The MySQL plugin isn't attached, or the service hasn't fully started yet.

**Fix:**
1. Confirm the MySQL plugin appears on the project canvas with a green status.
2. Check that the MYSQL* variables appear under your service's **Variables** tab (they should be auto-injected).
3. Redeploy the service — Railway sometimes needs one restart after the plugin is added.

---

### "Route not found" on all pages

**Cause:** The static files from `views/` aren't being served.

**Fix:** Make sure `server.js` has `app.use(express.static(path.join(__dirname, 'views')))` and that the `views/` folder is committed to git (not in `.gitignore`).

---

### Login returns 429 immediately

**Cause:** The `loginLimiter` (5 attempts / 15 min) was triggered — possibly from a previous test.

**Fix:** Wait 15 minutes, or restart the Railway service (rate-limit counters are in-memory and reset on restart).

---

### Posts page loads but shows 0 posts

**Cause:** `init-db.js` hasn't been run yet, or it failed partway through.

**Fix:** Run `node scripts/init-db.js` from the Railway shell. Check the output for any error message.

---

### Session not persisting (logged out on every request)

**Cause:** `SESSION_SECRET` is missing or different between restarts.

**Fix:** Set a fixed `SESSION_SECRET` value in Railway Variables. The fallback `'fallback_dev_secret'` in code only works locally.

---

### CORS error in browser console

**Cause:** `SITE_URL` is set but doesn't exactly match the origin making the request (e.g. trailing slash, `www` vs non-`www`).

**Fix:** Make sure `SITE_URL` matches the exact origin — `https://hidden-malaysia.up.railway.app` with no trailing slash.

---

## Re-deploying After Code Changes

Railway auto-deploys when you push to the `main` branch:

```bash
git add .
git commit -m "Your change description"
git push
```

Railway rebuilds and restarts within about 30 seconds. You do **not** need to re-run `init-db.js` for code-only changes — only run it again on a fresh database.

---

## Environment Variables Reference

| Variable | Where to set | Notes |
|----------|-------------|-------|
| `NODE_ENV` | Railway Variables | Must be `production` |
| `SESSION_SECRET` | Railway Variables | 64-char hex string, keep secret |
| `SITE_URL` | Railway Variables | Your full HTTPS URL, no trailing slash |
| `PORT` | Auto-injected | Do not set — Railway controls this |
| `MYSQL*` | Auto-injected | Set by MySQL plugin, do not override |
