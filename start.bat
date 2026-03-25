@echo off
rem start.bat — start the Next.js dev server


setlocal enabledelayedexpansion
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

rem Check if node_modules exists in next, if not, run npm install
if not exist "%ROOT%\next\node_modules" (
  echo [>] node_modules not found in next/. Running npm install ...
  pushd "%ROOT%\next"
  call npm install
  popd
)

rem Free port 3000 if something else is holding it
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING 2^>nul') do (
  echo   [!] Port 3000 in use -- killing process %%p...
  taskkill /PID %%p /F >nul 2>&1
  timeout /t 1 /nobreak >nul
)

echo [>] Starting Next.js on http://localhost:3000 ...
start "Next.js Dev" /d "%ROOT%\next" cmd /k "npm run dev"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Next.js  -^> http://localhost:3000
echo   Close the "Next.js Dev" window to stop.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
