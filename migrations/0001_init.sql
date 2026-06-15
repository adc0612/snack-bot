CREATE TABLE IF NOT EXISTS orders (
  user_id    TEXT NOT NULL,
  user_name  TEXT NOT NULL,
  week       TEXT NOT NULL,
  items      TEXT NOT NULL DEFAULT '[]',
  status     TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, week)
);

CREATE TABLE IF NOT EXISTS weekly_state (
  week         TEXT PRIMARY KEY,
  announced_at TEXT,
  warned_at    TEXT,
  sent_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_week_status ON orders (week, status);
