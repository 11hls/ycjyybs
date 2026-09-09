@echo off
rem One-click deploy current folder to Cloudflare Pages (ycjyybs)
cd /d %~dp0
"C:\Program Files\Git\bin\bash.exe" ./deploy.sh
pause
