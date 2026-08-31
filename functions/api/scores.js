// 小游戏排行榜 API：GET 拉取 Top + POST 提交分数（Cloudflare Pages Functions + D1）
// 绑定名 DB（wrangler.toml 中 [[d1_databases]].binding = "DB"）

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const game = (url.searchParams.get('game') || '').slice(0, 20);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 50);
    if (!game) return Response.json({ error: '缺少 game 参数' }, { status: 400 });

    const { results } = await env.DB.prepare(
      'SELECT nick, score, created_at FROM scores WHERE game = ? ORDER BY score DESC, created_at ASC LIMIT ?'
    ).bind(game, limit).all();

    return Response.json(results.map(r => ({
      nick: r.nick,
      score: r.score,
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

    const game = String(body.game || '').trim().slice(0, 20);
    const nick = String(body.nick || '').trim().slice(0, 10);
    const score = Math.floor(Number(body.score));
    if (!game || !nick || !Number.isFinite(score) || score < 0 || score > 9999) {
      return Response.json({ error: '参数不合法' }, { status: 400 });
    }

    // 简单防刷：同一 IP 30 秒内最多 2 条
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM scores WHERE ip = ? AND created_at > datetime('now', '-30 seconds')"
    ).bind(ip).first();
    if (recent && recent.c >= 2) {
      return Response.json({ error: '提交太频繁啦' }, { status: 429 });
    }

    await env.DB.prepare(
      'INSERT INTO scores (game, nick, score, ip) VALUES (?, ?, ?, ?)'
    ).bind(game, nick, score, ip).run();

    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}
