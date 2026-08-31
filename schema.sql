-- 留言板数据表（与线上 blog-db 现有结构一致：id INTEGER 自增）
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  nick TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
