-- 访问统计表迁移脚本
-- 执行：wrangler d1 execute blog-db --remote --file=migrate_visitors.sql

-- visitors: 按 IP+日期去重记录访问
-- (ip, visit_date) 联合主键：同一 IP 同一天只算 1 人
CREATE TABLE IF NOT EXISTS visitors (
  ip TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (ip, visit_date)
);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(visit_date);
