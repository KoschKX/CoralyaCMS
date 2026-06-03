@echo off
rem start-framely.bat — start MySQL (Docker) + Framely app

setlocal

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

rem Check Docker is running
docker info >nul 2>&1
if errorlevel 1 (
  echo   [X] Docker is not running. Please start Docker Desktop and try again.
  exit /b 1
)

echo [>] Starting MySQL via Docker Compose...
pushd "%ROOT%\framely"
docker compose up -d
popd

echo.
echo   Waiting for MySQL to be ready...
:db_wait_loop
docker compose -f "%ROOT%\framely\docker-compose.yaml" exec -T db mysqladmin ping -uroot -pexamplepass --silent >nul 2>&1
if not errorlevel 1 goto db_ready
timeout /t 2 /nobreak >nul
goto db_wait_loop
:db_ready
echo   [OK] MySQL is ready!

rem Free port 3000 if in use
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING 2^>nul') do (
  echo   [!] Port 3000 in use -- killing process %%p...
  taskkill /PID %%p /F >nul 2>&1
  timeout /t 1 /nobreak >nul
)

echo [>] Starting Framely on http://localhost:3000 ...
start "Framely Dev" /d "%ROOT%\framely" cmd /k "npx prisma generate && npm run dev"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Framely  -^> http://localhost:3000
echo   Close the "Framely Dev" window to stop.
echo   Run: docker compose down   in the framely folder to stop MySQL.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
