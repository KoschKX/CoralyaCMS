@echo off
rem ensure-zips.bat — called by setup.bat
rem Checks that required zips exist in setup\cache\; downloads any that are missing.
rem Expects env vars: BACKEND, SCRIPT_DIR

setlocal enabledelayedexpansion

set "NEEDED_ZIPS="
if "%BACKEND%"=="payload"          set "NEEDED_ZIPS=next payload"
if "%BACKEND%"=="strapi"           set "NEEDED_ZIPS=next strapi"
if "%BACKEND%"=="payload-website"  set "NEEDED_ZIPS=payload-website"
if "%BACKEND%"=="wordpress"        set "NEEDED_ZIPS=wordpress"
if "%BACKEND%"=="wordpress-nextjs" set "NEEDED_ZIPS=next wordpress"
if "%BACKEND%"=="next-wp"          set "NEEDED_ZIPS=next-wp wordpress"
if "%BACKEND%"=="framely"          set "NEEDED_ZIPS=framely"
if "%BACKEND%"=="nextjs"           set "NEEDED_ZIPS=next"

set "MISSING_ZIPS="
for %%z in (%NEEDED_ZIPS%) do (
  if not exist "%SCRIPT_DIR%\setup\cache\%%z.zip" (
    set "MISSING_ZIPS=!MISSING_ZIPS! %%z"
  )
)
set "MISSING_ZIPS=%MISSING_ZIPS:~1%"

if "%MISSING_ZIPS%"=="" (
  endlocal
  exit /b 0
)

echo [>] Missing zips: %MISSING_ZIPS%
echo   Downloading them now...
echo.
call "%SCRIPT_DIR%\setup\update_setup.bat" --skip-existing %MISSING_ZIPS%
echo.

set "STILL_MISSING="
for %%z in (%MISSING_ZIPS%) do (
  if not exist "%SCRIPT_DIR%\setup\cache\%%z.zip" (
    set "STILL_MISSING=%%z"
  )
)

if not "%STILL_MISSING%"=="" (
  echo   [X] setup\cache\%STILL_MISSING%.zip still not found after update. Aborting.
  endlocal
  exit /b 1
)

endlocal
exit /b 0
