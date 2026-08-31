// 留言板 API：GET 列表 + POST 提交（Cloudflare Pages Functions + D1）
// 绑定名 DB（wrangler.toml 中 [[d1_databases]].binding = "DB"）

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, nick, content, created_at FROM messages ORDER BY created_at DESC LIMIT 100'
    ).all();
    return Response.json(results.map(r => ({
      id: r.id,
      nick: r.nick,
      content: r.content,
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
    await env.DB.prepare(
      'INSERT INTO messages (nick, content, created_at) VALUES (?, ?, ?)'
    ).bind(nick, content, createdAt).run();

    return Response.json({ nick, content, createdAt }, { status: 201 });
  } catch (e) {
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}
