@echo off
rem start-payload.bat — start Payload CMS + Next.js

setlocal

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

echo [>] Starting Payload on http://localhost:3001 ...
start "Payload CMS" /d "%ROOT%\payload" cmd /k "npm run dev -- --port 3001"

echo [>] Starting Next.js on http://localhost:3000 ...
start "Next.js Dev" /d "%ROOT%\next" cmd /k "npm run dev"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Next.js  -^> http://localhost:3000
echo   Payload  -^> http://localhost:3001/admin
echo   Close the service windows to stop each service.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
