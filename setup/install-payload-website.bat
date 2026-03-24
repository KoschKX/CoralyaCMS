@echo off
rem install-payload-website.bat — called by setup.bat for the "payload-website" backend
rem Expects env vars: TARGET, SCRIPT_DIR

setlocal

rem ── 1. Install Payload Website ────────────────────────────
echo.
echo [^>] Creating Payload Website app...
powershell -NoProfile -Command "Expand-Archive -Path '%SCRIPT_DIR%\setup\cache\payload-website.zip' -DestinationPath '%TARGET%\payload-website' -Force"
if not exist "%TARGET%\payload-website\node_modules" (
  echo   node_modules not in zip -- running npm install...
  pushd "%TARGET%\payload-website"
  call npm install
  popd
)

rem ── 2. Generate import map ────────────────────────────────
echo [^>] Generating Payload import map...
pushd "%TARGET%\payload-website"
call npm run generate:importmap 2>nul
popd

rem ── 3. start.bat ──────────────────────────────────────────
echo [^>] Copying start.bat...
copy /y "%SCRIPT_DIR%\setup\start-payload-website.bat" "%TARGET%\start.bat" >nul

set "CMS_ADMIN_URL=http://localhost:3000/admin"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   [OK] Setup complete!
echo.
echo   To start:  %TARGET%\start.bat
echo.
echo   Website        -^> http://localhost:3000
echo   Payload Admin  -^> %CMS_ADMIN_URL%
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
exit /b 0
