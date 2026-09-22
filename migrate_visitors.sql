-- 访问统计表迁移脚本
-- 执行：wrangler d1 execute blog-db --remote --file=migrate_visitors.sql

-- visitors: 每次访问记一行（不去重），累计访问次数 = COUNT(*)
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(visit_date);
