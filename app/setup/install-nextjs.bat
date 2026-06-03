@echo off
rem install-nextjs.bat — called by setup.bat for the "nextjs" (standalone) backend
rem Expects env vars: TARGET, SCRIPT_DIR

setlocal enabledelayedexpansion

rem ── 1. Next.js ────────────────────────────────────────────
echo [^>] Creating Next.js app...
powershell -NoProfile -Command "Expand-Archive -Path '%SCRIPT_DIR%\setup\cache\next.zip' -DestinationPath '%TARGET%\next' -Force"
if not exist "%TARGET%\next\node_modules" (
  echo   node_modules not in zip -- running npm install...
  pushd "%TARGET%\next"
  call npm install
  popd
)

rem ── 2. Homepage ───────────────────────────────────────────
echo [^>] Updating Next.js homepage...
set "PAGE=%TARGET%\next\app\page.tsx"
> "%PAGE%" echo export default function Home() {
>> "%PAGE%" echo   return (
>> "%PAGE%" echo     ^<main className="min-h-screen max-w-3xl mx-auto px-6 py-16"^>
>> "%PAGE%" echo       ^<h1 className="text-3xl font-bold mb-2"^>My Site^</h1^>
>> "%PAGE%" echo       ^<p className="text-zinc-500"^>Powered by Next.js^</p^>
>> "%PAGE%" echo     ^</main^>
>> "%PAGE%" echo   );
>> "%PAGE%" echo }

rem ── 3. start.bat ──────────────────────────────────────────
echo [^>] Creating start.bat...
copy /y "%SCRIPT_DIR%\start.bat" "%TARGET%\start.bat" >nul 2>&1

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   [OK] Next.js install complete
echo.
echo   To start:  %TARGET%\start.bat
echo   Dev URL:   http://localhost:3000
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
endlocal
exit /b 0
