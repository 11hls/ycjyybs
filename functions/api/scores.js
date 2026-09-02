// 小游戏排行榜 API：GET 拉取 Top + POST 提交分数（Cloudflare Pages Functions + D1）
// 绑定名 DB（wrangler.toml 中 [[d1_databases]].binding = "DB"）

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const game = (url.searchParams.get('game') || '').slice(0, 20);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 50);
    if (!game) return Response.json({ error: '缺少 game 参数' }, { status: 400 });

    const { results } = await env.DB.prepare(
      'SELECT nick, MAX(score) AS score, MIN(created_at) AS created_at FROM scores WHERE game = ? GROUP BY nick ORDER BY score DESC, created_at ASC LIMIT ?'
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
    if (!game || !nick || !Number.isFinite(score) || score < 0) {
      return Response.json({ error: '参数不合法' }, { status: 400 });
    }
    // 上限 9.99 亿：数值崩坏玩法下 pipeMult 指数翻倍，分数很容易上亿
    if (score > 999999999) {
      return Response.json({ error: '分数超出排行榜上限（9.99 亿）' }, { status: 400 });
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

    // PK 排名：与 GET 榜单同规则（同名取最高分）——按该昵称历史最高分计算名次，
    // 否则"历史 500 分、本局 300 分"会显示成第 3 名，但榜单上他其实是第 1
    const higher = await env.DB.prepare(
      'SELECT COUNT(*) AS c FROM (SELECT nick, MAX(score) AS mx FROM scores WHERE game = ? GROUP BY nick HAVING mx > (SELECT MAX(score) FROM scores WHERE game = ? AND nick = ?))'
    ).bind(game, game, nick).first();

    return Response.json({ ok: true, rank: (higher ? higher.c : 0) + 1 }, { status: 201 });
  } catch (e) {
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}
