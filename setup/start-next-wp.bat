@echo off
rem start-next-wp.bat — start WordPress (Docker) + next-wp frontend

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

rem Free port 3000 if in use
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING 2^>nul') do (
  echo   [!] Port 3000 in use -- killing process %%p...
  taskkill /PID %%p /F >nul 2>&1
  timeout /t 1 /nobreak >nul
)

echo [>] Starting next-wp on http://localhost:3000 ...
start "next-wp Dev" /d "%ROOT%\next-wp" cmd /k "npm run dev"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Next.js  -^> http://localhost:3000
echo   WP Admin -^> http://localhost:8080/wp-admin  (admin / admin)
echo   Close the "next-wp Dev" window to stop Next.js.
echo   Run: docker compose down   in the wordpress folder to stop WordPress.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
