@echo off
rem start-wordpress.bat — start WordPress (Docker) + Next.js

setlocal

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

rem Check Docker is running
docker info >nul 2>&1
if errorlevel 1 (
  echo   [X] Docker is not running. Please start Docker Desktop and try again.
  exit /b 1
)

echo [>] Starting WordPress via Docker Compose...
pushd "%ROOT%\wordpress"
docker compose up -d
popd

echo.
echo   Waiting for WordPress to be ready...
:wp_wait_loop
for /f %%c in ('curl -s -o nul -w "%%{http_code}" http://localhost:8080/ 2^>nul') do (
  if "%%c"=="200" goto wp_ready
)
timeout /t 2 /nobreak >nul
goto wp_wait_loop
:wp_ready
echo   [OK] WordPress is ready!

echo [>] Starting Next.js on http://localhost:3000 ...
start "Next.js Dev" /d "%ROOT%\next" cmd /k "npm run dev"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Next.js     -^> http://localhost:3000
echo   WordPress   -^> http://localhost:8080/wp-admin
echo   WP REST API -^> http://localhost:8080/wp-json/wp/v2/
echo   Close the "Next.js Dev" window to stop Next.js.
echo   Run: docker compose down   in the wordpress folder to stop WordPress.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
