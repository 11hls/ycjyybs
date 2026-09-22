-- 留言板数据表（id INTEGER 自增）
-- likes: 点赞数（默认 0，由 PUT /api/messages 维护）
-- ip: 提交者 IP（用于速率限制）
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  nick TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  ip TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_ip ON messages(ip, created_at DESC);

-- 点赞去重表：同 IP 对同一条留言只能点赞一次（再次 PUT 即取消）
-- msg_id 对应 messages.id；ip 取自 CF-Connecting-IP
CREATE TABLE IF NOT EXISTS msg_likes (
  msg_id INTEGER NOT NULL,
  ip TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (msg_id, ip)
);
CREATE INDEX IF NOT EXISTS idx_msg_likes_ip ON msg_likes(ip, created_at DESC);

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


-- 访问统计表：每次访问记一行，id 自增；累计访问次数 = COUNT(*)
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(visit_date);
