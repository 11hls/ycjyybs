-- 线上 blog-db 迁移脚本：给已存在的 messages 表补字段 + 建新表
-- ⚠️ 每条 ALTER 只能执行一次（SQLite 不支持 IF NOT EXISTS），重复执行会报错
-- 执行方式：wrangler d1 execute blog-db --remote --file=migrate.sql

ALTER TABLE messages ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE messages ADD COLUMN ip TEXT;
CREATE INDEX IF NOT EXISTS idx_messages_ip ON messages(ip, created_at DESC);
CREATE TABLE IF NOT EXISTS msg_likes (
  msg_id INTEGER NOT NULL,
  ip TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (msg_id, ip)
);
CREATE INDEX IF NOT EXISTS idx_msg_likes_ip ON msg_likes(ip, created_at DESC);
