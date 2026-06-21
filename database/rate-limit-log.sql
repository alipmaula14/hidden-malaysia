-- Optional: persistent rate-limit event log.
-- Run this if you want to query abuse patterns over time rather than
-- reading Railway's log stream. The table stays small because old rows
-- are deleted automatically after 30 days by the DELETE event.

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type  ENUM('global','search','login','bot') NOT NULL,
  ip_hash     CHAR(64) NOT NULL,        -- SHA-256 of real IP (privacy-safe)
  endpoint    VARCHAR(300) NOT NULL,
  logged_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type_time (event_type, logged_at),
  INDEX idx_ip        (ip_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Auto-purge rows older than 30 days (requires MySQL Event Scheduler ON)
CREATE EVENT IF NOT EXISTS purge_rate_limit_log
  ON SCHEDULE EVERY 1 DAY
  DO DELETE FROM rate_limit_log WHERE logged_at < NOW() - INTERVAL 30 DAY;
