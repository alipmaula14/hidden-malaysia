/**
 * scripts/init-db.js
 *
 * One-time database initialiser for Hidden Malaysia.
 * Run this ONCE after your first Railway deployment (or any fresh environment):
 *
 *   node scripts/init-db.js
 *
 * What it does:
 *   1. Creates the `hidden_malaysia` database if it doesn't exist
 *   2. Creates all 9 tables (idempotent — safe to re-run)
 *   3. Runs database/seed.js  → 3 users + 18 main posts + 6 comments + 3 subscribers
 *   4. Runs database/seed-extras.js → 18 hidden-gem posts + accommodations for all 36 posts
 *
 * Environment variables (Railway MySQL plugin injects these automatically):
 *   MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE
 *   Fallback local dev names: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mysql      = require('mysql2/promise');
const { spawnSync } = require('child_process');
const path       = require('path');

// ------------------------------------------------------------------
// Explicit Railway vs local branch — same logic as config/db.js.
// Also map MYSQL* → DB_* so the child seed scripts pick up the right
// values when spawned (they read DB_HOST etc. from process.env).
// ------------------------------------------------------------------
const isRailway = !!process.env.MYSQLHOST;

if (isRailway) {
  process.env.DB_HOST = process.env.MYSQLHOST;
  process.env.DB_PORT = process.env.MYSQLPORT || '3306';
  process.env.DB_USER = process.env.MYSQLUSER;
  process.env.DB_PASS = process.env.MYSQLPASSWORD;
  process.env.DB_NAME = process.env.MYSQLDATABASE;
}

const DB_CONFIG = {
  host:     isRailway ? process.env.MYSQLHOST      : (process.env.DB_HOST || 'localhost'),
  port:     Number(isRailway ? process.env.MYSQLPORT : (process.env.DB_PORT || 3306)),
  user:     isRailway ? process.env.MYSQLUSER      : (process.env.DB_USER || 'root'),
  password: isRailway ? process.env.MYSQLPASSWORD  : (process.env.DB_PASS || ''),
  multipleStatements: true,
};

const DB_NAME = isRailway
  ? process.env.MYSQLDATABASE
  : (process.env.DB_NAME || 'hidden_malaysia');

// ------------------------------------------------------------------
// All CREATE TABLE statements — combines schema.sql, shot8-schema.sql,
// shot9-migrations.sql, contact_messages.sql.  All are IF NOT EXISTS
// so this block is safe to re-run on an existing database.
// ------------------------------------------------------------------
const SCHEMA_SQL = `
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE \`${DB_NAME}\`;

CREATE TABLE IF NOT EXISTS users (
  id         INT           AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)   NOT NULL UNIQUE,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  role       ENUM('admin', 'visitor') NOT NULL DEFAULT 'visitor',
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS posts (
  id           INT           AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200)  NOT NULL,
  slug         VARCHAR(200)  NOT NULL UNIQUE,
  excerpt      VARCHAR(300),
  content      LONGTEXT      NOT NULL,
  state        ENUM('perlis','kedah','perak','pahang','negeri_sembilan','johor') NOT NULL,
  category     ENUM('hidden-gem','food','nature','culture','adventure')          NOT NULL,
  cover_image  VARCHAR(500),
  image_credit VARCHAR(300),
  tags         VARCHAR(300),
  source_url   VARCHAR(500),
  author_id    INT,
  published    BOOLEAN       NOT NULL DEFAULT false,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comments (
  id             INT           AUTO_INCREMENT PRIMARY KEY,
  post_id        INT           NOT NULL,
  name           VARCHAR(100)  NOT NULL,
  email          VARCHAR(150)  NOT NULL,
  content        TEXT          NOT NULL,
  likes_count    INT           NOT NULL DEFAULT 0,
  status         ENUM('approved','pending','spam') NOT NULL DEFAULT 'approved',
  flagged_reason VARCHAR(200)  DEFAULT NULL,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscribers (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  subscribed_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS accommodations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  post_id     INT NOT NULL,
  name        VARCHAR(150) NOT NULL,
  type        ENUM('hotel','homestay','resort','budget','hostel','chalet') DEFAULT 'hotel',
  distance_km DECIMAL(5,2),
  price_range ENUM('$','$$','$$$','$$$$') DEFAULT '$$',
  description TEXT,
  booking_url VARCHAR(500),
  image_url   VARCHAR(500),
  rating      DECIMAL(2,1),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  subject     ENUM('general','submit_gem','report_info','collaboration','other') NOT NULL DEFAULT 'general',
  message     TEXT          NOT NULL,
  status      ENUM('unread','read','replied') NOT NULL DEFAULT 'unread',
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS search_log (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  query         VARCHAR(200) NOT NULL,
  results_count INT          DEFAULT 0,
  ip_hash       VARCHAR(64),
  searched_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key   VARCHAR(100) PRIMARY KEY,
  setting_value VARCHAR(500),
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('auto_moderate_comments', 'false'),
  ('comment_spam_keywords',  'viagra,casino,lottery,bitcoin,crypto,forex,investment opportunity,click here,free money,nude,porn')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
`;

// ------------------------------------------------------------------
// Indexes — created separately so each one can be skipped gracefully
// if it already exists (MySQL errno 1061 / ER_DUP_KEYNAME).
// MySQL does not support CREATE INDEX IF NOT EXISTS — that is PostgreSQL.
// ------------------------------------------------------------------
const INDEXES = [
  'CREATE INDEX idx_posts_state     ON posts(state)',
  'CREATE INDEX idx_posts_slug      ON posts(slug)',
  'CREATE INDEX idx_posts_published ON posts(published)',
  'CREATE INDEX idx_comments_post   ON comments(post_id)',
  'CREATE INDEX idx_comments_status ON comments(status)',
  'CREATE INDEX idx_contact_status  ON contact_messages(status)',
  'CREATE INDEX idx_contact_created ON contact_messages(created_at)',
  'CREATE INDEX idx_accom_post      ON accommodations(post_id)',
  'CREATE INDEX idx_search_query    ON search_log(query)',
  'CREATE INDEX idx_search_date     ON search_log(searched_at)',
];

// ------------------------------------------------------------------
// Helper: spawn a Node script, inherit stdio so progress is visible
// ------------------------------------------------------------------
function runScript(scriptPath) {
  const rel = path.relative(process.cwd(), scriptPath);
  console.log(`\n▶  Running ${rel} ...`);
  const result = spawnSync('node', [scriptPath], {
    stdio: 'inherit',
    env: process.env,
    cwd: path.join(__dirname, '..')
  });
  if (result.status !== 0) {
    console.error(`\n✗  ${rel} exited with code ${result.status}`);
    process.exit(result.status || 1);
  }
  console.log(`✓  ${rel} completed.`);
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function main() {
  let conn;
  try {
    console.log('============================================================');
    console.log(' Hidden Malaysia — Database Initialiser');
    console.log('============================================================');
    console.log(`Mode     : ${isRailway ? 'Railway MySQL' : 'Local MySQL'}`);
    console.log(`Host     : ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`Database : ${DB_NAME}`);
    console.log('------------------------------------------------------------\n');

    console.log('Step 1/3 — Creating database and tables...');
    conn = await mysql.createConnection(DB_CONFIG);
    await conn.query(SCHEMA_SQL);

    // Create indexes one at a time; silently skip any that already exist
    let idxCreated = 0;
    let idxSkipped = 0;
    for (const sql of INDEXES) {
      try {
        await conn.query(sql);
        idxCreated++;
      } catch (err) {
        if (err.errno === 1061) { idxSkipped++; continue; } // ER_DUP_KEYNAME
        throw err;
      }
    }

    await conn.end();
    conn = null;
    console.log(`✓  Tables ready. Indexes: ${idxCreated} created, ${idxSkipped} already existed.\n`);

    console.log('Step 2/3 — Seeding users, main posts, comments, subscribers...');
    runScript(path.join(__dirname, '../database/seed.js'));

    console.log('\nStep 3/3 — Seeding hidden-gem posts and accommodations...');
    runScript(path.join(__dirname, '../database/seed-extras.js'));

    console.log('\n============================================================');
    console.log(' Initialisation complete!');
    console.log('============================================================');
    console.log('  Admin login  →  username: admin  |  password: Admin@123');
    console.log('  Change the admin password from the Settings page after login.');
    console.log('============================================================\n');

  } catch (err) {
    if (conn) await conn.end().catch(() => {});
    console.error('\n✗  Initialisation failed:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check that your MYSQL* (or DB_*) environment variables are set correctly.');
    console.error('  2. Make sure the database server is running and reachable.');
    console.error('  3. On Railway: confirm the MySQL plugin is attached to this service.');
    process.exit(1);
  }
}

main();
