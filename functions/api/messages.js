// 留言板 API：GET 列表 + POST 提交 + PUT 点赞（Cloudflare Pages Functions + D1）
// 绑定名 DB（wrangler.toml 中 [[d1_databases]].binding = "DB"）

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
  try {
    const body = await request.json().catch(() => null);
    if (!body) return Response.json({ error: '请求格式错误' }, { status: 400 });

    const nick = String(body.nick || '').trim().slice(0, 20);
    const content = String(body.content || '').trim().slice(0, 200);
    if (!nick || !content) {
      return Response.json({ error: '昵称和留言内容都要填哦' }, { status: 400 });
    }

    const createdAt = new Date().toISOString();
    const insert = await env.DB.prepare(
      'INSERT INTO messages (nick, content, created_at) VALUES (?, ?, ?)'
    ).bind(nick, content, createdAt).run();

    return Response.json({ id: insert.meta?.last_row_id, nick, content, likes: 0, createdAt }, { status: 201 });
  } catch (e) {
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  // 点赞：同 IP 对同一条留言只能点一次（INSERT OR IGNORE 去重）
  try {
    const body = await request.json().catch(() => null);
    const msgId = Number(body?.id);
    if (!Number.isFinite(msgId) || msgId <= 0) {
      return Response.json({ error: '缺少留言 id' }, { status: 400 });
    }

    const ip = request.headers.get('CF-Connecting-IP') || '';
    const likeRes = await env.DB.prepare(
      'INSERT OR IGNORE INTO msg_likes (msg_id, ip) VALUES (?, ?)'
    ).bind(msgId, ip).run();

    if (likeRes.meta?.changes === 1) {
      await env.DB.prepare('UPDATE messages SET likes = likes + 1 WHERE id = ?').bind(msgId).run();
    }

    const row = await env.DB.prepare('SELECT likes FROM messages WHERE id = ?').bind(msgId).first();
    return Response.json({ ok: true, liked: likeRes.meta?.changes === 1, likes: row?.likes ?? 0 });
  } catch (e) {
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}
