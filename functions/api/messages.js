// 留言板 API：GET 列表 + POST 提交 + PUT 点赞/取消点赞（Cloudflare Pages Functions + D1）
// 绑定名 DB（wrangler.toml 中 [[d1_databases]].binding = "DB"）

// CORS 防护：仅允许同源请求
function checkSameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // 同源请求可能不携带 Origin
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch { return false; }
}

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, nick, content, likes, created_at FROM messages ORDER BY created_at DESC LIMIT 100'
    ).all();
    return Response.json(results.map(r => ({
      id: r.id,
      nick: r.nick,
      content: r.content,
      likes: r.likes,
      createdAt: r.created_at,
    })));
  } catch (e) {
    return Response.json({ error: '读取失败' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  if (!checkSameOrigin(request)) return Response.json({ error: "跨域请求被拒绝" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    if (!body) return Response.json({ error: '请求格式错误' }, { status: 400 });

    const nick = String(body.nick || '').trim().slice(0, 20);
    const content = String(body.content || '').trim().slice(0, 100);
    if (!nick || !content) {
      return Response.json({ error: '昵称和留言内容都要填哦' }, { status: 400 });
    }

    // 防刷：同 IP 60 秒内最多 2 条留言
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM messages WHERE ip = ? AND created_at > datetime('now', '-60 seconds')"
    ).bind(ip).first();
    if (recent && recent.c >= 2) {
      return Response.json({ error: '留言太快啦，稍后再试' }, { status: 429 });
    }

    const createdAt = new Date().toISOString();
    const insert = await env.DB.prepare(
      'INSERT INTO messages (nick, content, ip, created_at) VALUES (?, ?, ?, ?)'
    ).bind(nick, content, ip, createdAt).run();

    return Response.json({ id: insert.meta?.last_row_id, nick, content, likes: 0, createdAt }, { status: 201 });
  } catch (e) {
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  if (!checkSameOrigin(request)) return Response.json({ error: "跨域请求被拒绝" }, { status: 403 });
  // 点赞/取消点赞切换：同 IP 对同一条留言，第一次 PUT = 点赞（+1），第二次 = 取消（-1）
  try {
    const body = await request.json().catch(() => null);
    const msgId = Number(body?.id);
    if (!Number.isFinite(msgId) || msgId <= 0) {
      return Response.json({ error: '缺少留言 id' }, { status: 400 });
    }

    const ip = request.headers.get('CF-Connecting-IP') || '';
    const existing = await env.DB.prepare(
      'SELECT msg_id FROM msg_likes WHERE msg_id = ? AND ip = ?'
    ).bind(msgId, ip).first();

    if (existing) {
      // 已点赞 -> 取消
      await env.DB.prepare('DELETE FROM msg_likes WHERE msg_id = ? AND ip = ?').bind(msgId, ip).run();
      await env.DB.prepare('UPDATE messages SET likes = MAX(0, likes - 1) WHERE id = ?').bind(msgId).run();
    } else {
      // 未点赞 -> 点赞
      await env.DB.prepare('INSERT OR IGNORE INTO msg_likes (msg_id, ip) VALUES (?, ?)').bind(msgId, ip).run();
      await env.DB.prepare('UPDATE messages SET likes = likes + 1 WHERE id = ?').bind(msgId).run();
    }

    const row = await env.DB.prepare('SELECT likes FROM messages WHERE id = ?').bind(msgId).first();
    const liked = !existing;
    return Response.json({ ok: true, liked, likes: row?.likes ?? 0 });
  } catch (e) {
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}