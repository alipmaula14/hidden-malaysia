

CREATE DATABASE IF NOT EXISTS hidden_malaysia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hidden_malaysia;

-- ============================================================
-- users
-- Admin and visitor accounts.
-- Passwords are stored as bcrypt hashes — NEVER plain text.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,              -- bcrypt hash, cost factor 10
  role       ENUM('admin','visitor') NOT NULL DEFAULT 'visitor',
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- posts
-- Travel blog articles. slug is the URL identifier and must be unique.
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  slug         VARCHAR(200) NOT NULL UNIQUE,
  excerpt      VARCHAR(300),
  content      LONGTEXT     NOT NULL,
  state        ENUM('perlis','kedah','perak','pahang','negeri_sembilan','johor') NOT NULL,
  category     ENUM('hidden-gem','food','nature','culture','adventure')          NOT NULL,
  cover_image  VARCHAR(500),
  image_credit VARCHAR(300),
  tags         VARCHAR(300),
  source_url   VARCHAR(500),
  author_id    INT,
  published    BOOLEAN      NOT NULL DEFAULT false,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- comments
-- Visitor comments on posts.
-- likes_count   — Shot 8: comment likes feature
-- status        — Shot 9: moderation workflow (approved / pending / spam)
-- flagged_reason — Shot 9: reason stored when auto-moderation flags a comment
-- ON DELETE CASCADE: removing a post removes all its comments.
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id             INT          AUTO_INCREMENT PRIMARY KEY,
  post_id        INT          NOT NULL,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL,
  content        TEXT         NOT NULL,
  likes_count    INT          NOT NULL DEFAULT 0,
  status         ENUM('approved','pending','spam') NOT NULL DEFAULT 'approved',
  flagged_reason VARCHAR(200) DEFAULT NULL,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- subscribers
-- Newsletter email list.
-- email is UNIQUE — duplicate subscribes are handled gracefully in code.
-- ============================================================
CREATE TABLE IF NOT EXISTS subscribers (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(150) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- accommodations  (Shot 8)
-- Nearby stays recommended on each post page.
-- ON DELETE CASCADE: removing a post removes its accommodation cards.
-- ============================================================
CREATE TABLE IF NOT EXISTS accommodations (
  id          INT            AUTO_INCREMENT PRIMARY KEY,
  post_id     INT            NOT NULL,
  name        VARCHAR(150)   NOT NULL,
  type        ENUM('hotel','homestay','resort','budget','hostel','chalet') DEFAULT 'hotel',
  distance_km DECIMAL(5,2),
  price_range ENUM('$','$$','$$$','$$$$') DEFAULT '$$',
  description TEXT,
  booking_url VARCHAR(500),
  image_url   VARCHAR(500),
  rating      DECIMAL(2,1),
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- contact_messages
-- Submissions from the Contact page.
-- subject maps to the dropdown options in contact.html.
-- status tracks admin read/reply workflow.
-- ip_address stored for spam tracking (raw IPv4/IPv6, max 45 chars).
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  subject     ENUM('general','submit_gem','report_info','collaboration','other') NOT NULL DEFAULT 'general',
  message     TEXT         NOT NULL,
  status      ENUM('unread','read','replied') NOT NULL DEFAULT 'unread',
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- search_log  (Shot 9)
-- Logs every visitor search query for analytics.
-- ip_hash is SHA-256 of the real IP — raw IP is never stored.
-- ============================================================
CREATE TABLE IF NOT EXISTS search_log (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  query         VARCHAR(200) NOT NULL,
  results_count INT          DEFAULT 0,
  ip_hash       VARCHAR(64),                    -- SHA-256, never the raw IP
  searched_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- site_settings  (Shot 9)
-- Admin-controllable key/value config.
-- Rows are seeded once; updated via the admin Settings page.
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key   VARCHAR(100) PRIMARY KEY,
  setting_value VARCHAR(500),
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Indexes
-- IF NOT EXISTS requires MySQL 8.0.16+ (Railway ships 8.0+).
-- ============================================================
CREATE INDEX idx_posts_state     ON posts(state);
CREATE INDEX idx_posts_slug      ON posts(slug);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_comments_post   ON comments(post_id);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_accom_post      ON accommodations(post_id);
CREATE INDEX idx_contact_status  ON contact_messages(status);
CREATE INDEX idx_contact_created ON contact_messages(created_at);
CREATE INDEX idx_search_query    ON search_log(query);
CREATE INDEX idx_search_date     ON search_log(searched_at);

-- ============================================================
-- Default site_settings rows
-- ON DUPLICATE KEY keeps existing values if already set.
-- ============================================================
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('auto_moderate_comments', 'false'),
  ('comment_spam_keywords',  'viagra,casino,lottery,bitcoin,crypto,forex,investment opportunity,click here,free money,nude,porn')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
