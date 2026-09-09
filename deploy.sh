#!/usr/bin/env bash
# One-command deploy: 白名单文件 -> Cloudflare Pages (ycjyybs), branch main.
# Entry points: double-click deploy.cmd, run "bash deploy.sh", or just tell the agent "上线".
set -euo pipefail
cd "$(dirname "$0")"

TOKEN_FILE="cf-token.txt"
if [ ! -f "$TOKEN_FILE" ]; then
  echo "[deploy] MISSING $TOKEN_FILE (line1=API token, line2=accountID, line3=project)"
  exit 1
fi

# 凭证移出上传目录，部署后恢复（即使失败也恢复）
BAK="$(mktemp /tmp/cf_token_bak.XXXXXX)"
restore() { mv -f "$BAK" "$TOKEN_FILE" 2>/dev/null || true; rm -rf "$TMP" 2>/dev/null || true; }
trap restore EXIT
mv -f "$TOKEN_FILE" "$BAK"

export CLOUDFLARE_API_TOKEN="$(sed -n '1p' "$BAK")"
export CLOUDFLARE_ACCOUNT_ID="$(sed -n '2p' "$BAK")"
PROJECT="$(sed -n '3p' "$BAK")"
WRANGLER="./node_modules/.bin/wrangler"

# 白名单：只传必要文件，排除 package.json / node_modules / 构建配置 / 文档等
TMP="$(mktemp -d /tmp/cf_deploy.XXXXXX)"
echo "[deploy] 拷贝白名单文件到 $TMP ..."
for f in index.html flappy.html xiong.mp4 bg-meteor.mp4 bg-aot-ocean.jpg tailwind.css favicon.svg resume-1.webp resume.pdf wrangler.toml schema.sql _headers _redirects; do
  [ -f "$f" ] && cp "$f" "$TMP/"
done
[ -d functions ] && cp -r functions "$TMP/"
[ -d 游戏音效 ] && cp -r 游戏音效 "$TMP/"

echo "[deploy] 上传到 Pages 项目 '$PROJECT' (branch main) ..."
"$WRANGLER" pages deploy "$TMP" --project-name "$PROJECT" --branch main
echo "[deploy] DONE"
