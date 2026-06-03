@echo off
rem start-strapi.bat — start Strapi CMS + Next.js

setlocal

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

echo [>] Starting Strapi on http://localhost:1337 ...
start "Strapi CMS" /d "%ROOT%\strapi" cmd /k "npm run develop"

echo [>] Starting Next.js on http://localhost:3000 ...
start "Next.js Dev" /d "%ROOT%\next" cmd /k "npm run dev"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Next.js  -^> http://localhost:3000
echo   Strapi   -^> http://localhost:1337/admin
echo   Close the service windows to stop each service.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
