@echo off
rem setup.bat — Scaffolds a fresh Next.js + CMS project
rem
rem Usage:  setup.bat [target-directory]
rem   e.g.  setup.bat my-project
rem         (defaults to current directory if no argument given)

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

rem ── Parse arguments ───────────────────────────────────────
set "TARGET=."
if not "%~1"=="" set "TARGET=%~1"
if not exist "%TARGET%" mkdir "%TARGET%"
pushd "%TARGET%" >nul 2>&1
set "TARGET=%CD%"
popd >nul

rem ── Choose backend ────────────────────────────────────────
echo.
echo Which backend would you like to use?
echo   1) Payload (blank) + separate Next.js frontend
echo   2) Strapi + separate Next.js frontend
echo   3) Payload Website (official template with frontend built-in)
echo   4) WordPress standalone (Docker)
echo   5) WordPress headless (Docker) + separate Next.js frontend
echo   6) next-wp -- full-featured headless WordPress starter (9d8dev)
echo   7) Framely -- drag-and-drop website builder (Docker + MySQL)
echo   8) Next.js only (no CMS)
echo.
set /p "BACKEND_CHOICE=Enter 1-8: "

if "%BACKEND_CHOICE%"=="1" set "BACKEND=payload"
if "%BACKEND_CHOICE%"=="2" set "BACKEND=strapi"
if "%BACKEND_CHOICE%"=="3" set "BACKEND=payload-website"
if "%BACKEND_CHOICE%"=="4" set "BACKEND=wordpress"
if "%BACKEND_CHOICE%"=="5" set "BACKEND=wordpress-nextjs"
if "%BACKEND_CHOICE%"=="6" set "BACKEND=next-wp"
if "%BACKEND_CHOICE%"=="7" set "BACKEND=framely"
if "%BACKEND_CHOICE%"=="8" set "BACKEND=nextjs"

if "%BACKEND%"=="" (
  echo Invalid choice. Exiting.
  exit /b 1
)

rem ── Check for existing installations ─────────────────────
set "HAS_EXISTING=false"

if "%BACKEND%"=="nextjs" (
  if exist "%TARGET%\next" set "HAS_EXISTING=true"
) else if "%BACKEND%"=="payload-website" (
  if exist "%TARGET%\payload-website" set "HAS_EXISTING=true"
) else if "%BACKEND%"=="framely" (
  if exist "%TARGET%\framely" set "HAS_EXISTING=true"
) else if "%BACKEND%"=="wordpress" (
  if exist "%TARGET%\wordpress" set "HAS_EXISTING=true"
) else if "%BACKEND%"=="wordpress-nextjs" (
  if exist "%TARGET%\wordpress" set "HAS_EXISTING=true"
  if exist "%TARGET%\next" set "HAS_EXISTING=true"
) else if "%BACKEND%"=="next-wp" (
  if exist "%TARGET%\wordpress" set "HAS_EXISTING=true"
  if exist "%TARGET%\next-wp" set "HAS_EXISTING=true"
) else (
  if exist "%TARGET%\next" set "HAS_EXISTING=true"
  if exist "%TARGET%\!BACKEND!" set "HAS_EXISTING=true"
)
if exist "%TARGET%\start.bat" set "HAS_EXISTING=true"

if "%HAS_EXISTING%"=="true" (
  echo.
  echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  echo   [!] Already set up -- the following already exist in:
  echo       %TARGET%
  echo.
  echo   To start fresh, delete them and re-run setup.bat.
  echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  echo.
  exit /b 1
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Setting up %BACKEND% in: %TARGET%
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

rem ── Ensure required zips are present ─────────────────────
call "%SCRIPT_DIR%\setup\ensure-zips.bat"
if errorlevel 1 exit /b 1

rem ── Run backend installer ─────────────────────────────────
call "%SCRIPT_DIR%\setup\install-%BACKEND%.bat"
if errorlevel 1 exit /b 1

endlocal
