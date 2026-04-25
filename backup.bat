@echo off
:: backup.bat — create a timestamped zip of the project, skipping regenerable large files.

setlocal

:: %~dp0 always ends with \; strip it for clean path construction
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

set "ARCHIVE_DIR=%ROOT%\- ARCHIVE -"

:: Reliable, locale-independent timestamp via PowerShell
for /f "delims=" %%t in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm'"') do set "TIMESTAMP=%%t"

set "OUT=%ARCHIVE_DIR%\backup_%TIMESTAMP%.zip"

if not exist "%ARCHIVE_DIR%" mkdir "%ARCHIVE_DIR%"

echo [*] Backing up to: %OUT%

:: Locate 7-Zip (7z.exe must be in PATH or installed at the default location)
set "SEVENZIP=7z"
where 7z >nul 2>&1
if errorlevel 1 (
    if exist "C:\Program Files\7-Zip\7z.exe" (
        set "SEVENZIP=C:\Program Files\7-Zip\7z.exe"
    ) else (
        echo [ERROR] 7-Zip not found. Install 7-Zip and ensure 7z.exe is in PATH.
        exit /b 1
    )
)

:: NOTE: ! in 7z switches (-xr!"pattern") is intentionally literal here.
::       EnableDelayedExpansion is NOT set so ! has no special meaning.
"%SEVENZIP%" a -tzip "%OUT%" ^
    "%ROOT%\next" ^
    "%ROOT%\start.bat" ^
    "%ROOT%\start.sh" ^
    "%ROOT%\backup.bat" ^
    "%ROOT%\backup.sh" ^
    -xr!"node_modules" ^
    -xr!".next" ^
    -x!"package-lock.json" >nul

if errorlevel 1 (
    echo [ERROR] Backup failed.
    exit /b 1
)

:: Print file size in MB
for %%f in ("%OUT%") do set "SIZE=%%~zf"
set /a "SIZE_MB=%SIZE% / 1048576"
echo [OK] Done -- %OUT% (%SIZE_MB% MB)

endlocal

