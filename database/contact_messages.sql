
USE hidden_malaysia;

CREATE TABLE IF NOT EXISTS contact_messages (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  subject     ENUM('general','submit_gem','report_info','collaboration','other') NOT NULL DEFAULT 'general',
  message     TEXT          NOT NULL,                       -- capped at 2000 chars in the API
  status      ENUM('unread','read','replied') NOT NULL DEFAULT 'unread',
  ip_address  VARCHAR(45),                                  -- IPv4/IPv6, for rate limiting & spam tracking
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_contact_status  ON contact_messages(status);
CREATE INDEX idx_contact_created ON contact_messages(created_at);
