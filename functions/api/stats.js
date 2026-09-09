// 访问统计 API：GET 返回今日+总访问人数，POST 记录本次访问
// 绑定名 DB

// CORS 防护：仅允许同源请求
function checkSameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch { return false; }
}

// GET: 返回统计数据
export async function onRequestGet({ env }) {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const todayRow = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM visitors WHERE visit_date = ?"
    ).bind(today).first();

    const totalRow = await env.DB.prepare(
      "SELECT COUNT(DISTINCT ip) AS c FROM visitors"
    ).first();

    return Response.json({
      today: todayRow.c,
      total: totalRow.c
    });
  } catch (e) {
    return Response.json({ today: 0, total: 0 }, { status: 500 });
  }
}

// POST: 记录本次访问（按 IP+日期去重）
export async function onRequestPost({ request, env }) {
  if (!checkSameOrigin(request)) return Response.json({ error: "跨域请求被拒绝" }, { status: 403 });
  try {
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
    const today = new Date().toISOString().slice(0, 10);

    await env.DB.prepare(
      "INSERT OR IGNORE INTO visitors (ip, visit_date) VALUES (?, ?)"
    ).bind(ip, today).run();

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false }, { status: 500 });
  }
}
