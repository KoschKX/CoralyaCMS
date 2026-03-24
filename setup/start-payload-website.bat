@echo off
rem start-payload-website.bat — start Payload Website (combined Next.js + Payload)

setlocal

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

echo [>] Starting Payload Website on http://localhost:3000 ...
start "Payload Website" /d "%ROOT%\payload-website" cmd /k "npm run dev"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Website        -^> http://localhost:3000
echo   Payload Admin  -^> http://localhost:3000/admin
echo   Close the "Payload Website" window to stop.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
