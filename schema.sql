-- 留言板数据表（与线上 blog-db 现有结构一致：id INTEGER 自增）
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  nick TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- 小游戏排行榜（game 区分游戏，score 倒序取 Top）
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL,
  nick TEXT NOT NULL,
  score INTEGER NOT NULL,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_scores_game ON scores(game, score DESC);
