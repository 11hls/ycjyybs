-- 累计访问次数改造：重建 visitors 表（每次访问一行）
-- 保留已有访问记录，并补足历史基线使 累计访问次数 = 1560
-- 执行：wrangler d1 execute blog-db --remote --file=migrate_visitors_v2.sql

-- 1) 新表：id 自增，每次访问一行
CREATE TABLE IF NOT EXISTS visitors_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2) 复制已有访问记录（保真历史）
INSERT INTO visitors_new (ip, visit_date)
SELECT ip, visit_date FROM visitors;

-- 3) 补足历史基线，使总行数 = 1560
INSERT INTO visitors_new (ip, visit_date)
WITH cnt(x) AS (
  SELECT 1
  UNION ALL
  SELECT x + 1 FROM cnt WHERE x < (1560 - (SELECT COUNT(*) FROM visitors))
)
SELECT 'seed-' || x, date('now', '-' || (x % 365) || ' days') FROM cnt;

-- 4) 替换旧表
DROP TABLE visitors;
ALTER TABLE visitors_new RENAME TO visitors;
CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(visit_date);
