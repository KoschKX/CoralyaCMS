@echo off
rem update_setup.bat — Refreshes setup zip bundles for offline installs
rem
rem Usage:  setup\update_setup.bat [--skip-existing] [next] [payload] [payload-website] [strapi] [wordpress] [framely] [next-wp]
rem   e.g.  setup\update_setup.bat                   -- updates all
rem         setup\update_setup.bat payload            -- updates only payload
rem         setup\update_setup.bat next strapi
rem         setup\update_setup.bat --skip-existing next payload
rem
rem Flags:
rem   --skip-existing   Silently skip targets whose zip already exists
rem
rem Produces:
rem   setup\cache\next.zip
rem   setup\cache\payload.zip
rem   setup\cache\payload-website.zip
rem   setup\cache\strapi.zip
rem   setup\cache\wordpress.zip
rem   setup\cache\framely.zip
rem   setup\cache\next-wp.zip

setlocal enabledelayedexpansion

rem SETUP_DIR is always the folder containing this script (setup\)
set "SETUP_DIR=%~dp0"
set "SETUP_DIR=%SETUP_DIR:~0,-1%"

rem ── Parse flags and targets ───────────────────────────────
set "SKIP_EXISTING=false"
set "TARGETS="
:parse_args
if "%~1"=="" goto parse_done
if "%~1"=="--skip-existing" (
  set "SKIP_EXISTING=true"
  shift
  goto parse_args
)
set "TARGETS=!TARGETS! %~1"
shift
goto parse_args
:parse_done
set "TARGETS=%TARGETS: =%"
if "%TARGETS%"=="" set "TARGETS=next payload payload-website strapi wordpress framely next-wp"

rem ── Create work directory ─────────────────────────────────
set "WORK_DIR=%TEMP%\nt_setup_%RANDOM%"
mkdir "%WORK_DIR%"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   update_setup.bat
echo   Output dir : %SETUP_DIR%
echo   Work dir   : %WORK_DIR%
echo   Targets    : %TARGETS%
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

if not exist "%SETUP_DIR%\cache" mkdir "%SETUP_DIR%\cache"

rem ── Helper: make_zip using PowerShell ────────────────────
rem make_zip <name> <source-dir>
rem Produces: %SETUP_DIR%\cache\<name>.zip (excludes .git, .DS_Store, node_modules)

for %%T in (%TARGETS%) do (
  set "TARGET_NAME=%%T"

  rem ── next ──────────────────────────────────────────────────
  if "!TARGET_NAME!"=="next" (
    if exist "%SETUP_DIR%\cache\next.zip" (
      if "!SKIP_EXISTING!"=="true" (
        echo   next.zip already exists -- skipping.
        echo.
        goto :next_done
      )
      set /p "_confirm=  next.zip already exists. Overwrite? [y/N] "
      if /i not "!_confirm!"=="y" ( echo   Skipping next. & echo. & goto :next_done )
    )
    echo [^>] Fetching latest Next.js...
    call npx create-next-app@latest "%WORK_DIR%\next" --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
    if not exist "%WORK_DIR%\next" (
      echo   [!] create-next-app did not produce %WORK_DIR%\next -- skipping zip
    ) else (
      if not exist "%WORK_DIR%\next\node_modules" (
        echo   node_modules missing -- running npm install...
        pushd "%WORK_DIR%\next" & call npm install & popd
      )
      call :make_zip "next" "%WORK_DIR%\next"
    )
    echo.
  )
  :next_done

  rem ── payload ───────────────────────────────────────────────
  if "!TARGET_NAME!"=="payload" (
    if exist "%SETUP_DIR%\cache\payload.zip" (
      if "!SKIP_EXISTING!"=="true" ( echo   payload.zip already exists -- skipping. & echo. & goto :payload_done )
      set /p "_confirm=  payload.zip already exists. Overwrite? [y/N] "
      if /i not "!_confirm!"=="y" ( echo   Skipping payload. & echo. & goto :payload_done )
    )
    echo [^>] Fetching latest Payload CMS...
    pushd "%WORK_DIR%"
    call npx create-payload-app@latest --name payload --template blank --db sqlite --db-connection-string "file:./payload.db" --no-git --accept-defaults
    popd
    if not exist "%WORK_DIR%\payload" (
      echo   [!] create-payload-app did not produce %WORK_DIR%\payload -- skipping zip
    ) else (
      if not exist "%WORK_DIR%\payload\node_modules" (
        echo   node_modules missing -- running npm install...
        pushd "%WORK_DIR%\payload" & call npm install & popd
      )
      echo   Generating import map...
      pushd "%WORK_DIR%\payload" & call npm run generate:importmap & popd
      call :make_zip "payload" "%WORK_DIR%\payload"
    )
    echo.
  )
  :payload_done

  rem ── payload-website ───────────────────────────────────────
  if "!TARGET_NAME!"=="payload-website" (
    if exist "%SETUP_DIR%\cache\payload-website.zip" (
      if "!SKIP_EXISTING!"=="true" ( echo   payload-website.zip already exists -- skipping. & echo. & goto :pw_done )
      set /p "_confirm=  payload-website.zip already exists. Overwrite? [y/N] "
      if /i not "!_confirm!"=="y" ( echo   Skipping payload-website. & echo. & goto :pw_done )
    )
    echo [^>] Fetching latest Payload CMS (website template)...
    pushd "%WORK_DIR%"
    call npx create-payload-app@latest --name payload-website --template website --db sqlite --db-connection-string "file:./payload.db" --no-git --accept-defaults
    popd
    if not exist "%WORK_DIR%\payload-website" (
      echo   [!] create-payload-app did not produce %WORK_DIR%\payload-website -- skipping zip
    ) else (
      if not exist "%WORK_DIR%\payload-website\node_modules" (
        pushd "%WORK_DIR%\payload-website" & call npm install & popd
      )
      echo   Generating import map...
      pushd "%WORK_DIR%\payload-website" & call npm run generate:importmap & popd
      call :make_zip "payload-website" "%WORK_DIR%\payload-website"
    )
    echo.
  )
  :pw_done

  rem ── strapi ────────────────────────────────────────────────
  if "!TARGET_NAME!"=="strapi" (
    if exist "%SETUP_DIR%\cache\strapi.zip" (
      if "!SKIP_EXISTING!"=="true" ( echo   strapi.zip already exists -- skipping. & echo. & goto :strapi_done )
      set /p "_confirm=  strapi.zip already exists. Overwrite? [y/N] "
      if /i not "!_confirm!"=="y" ( echo   Skipping strapi. & echo. & goto :strapi_done )
    )
    echo [^>] Fetching latest Strapi...
    call npx create-strapi-app@latest "%WORK_DIR%\strapi" --quickstart --no-run --no-git-init
    if not exist "%WORK_DIR%\strapi" (
      echo   [!] create-strapi-app did not produce %WORK_DIR%\strapi -- skipping zip
    ) else (
      if not exist "%WORK_DIR%\strapi\node_modules" (
        pushd "%WORK_DIR%\strapi" & call npm install & popd
      )
      call :make_zip "strapi" "%WORK_DIR%\strapi"
    )
    echo.
  )
  :strapi_done

  rem ── wordpress ─────────────────────────────────────────────
  if "!TARGET_NAME!"=="wordpress" (
    if exist "%SETUP_DIR%\cache\wordpress.zip" (
      if "!SKIP_EXISTING!"=="true" ( echo   wordpress.zip already exists -- skipping. & echo. & goto :wp_done )
      set /p "_confirm=  wordpress.zip already exists. Overwrite? [y/N] "
      if /i not "!_confirm!"=="y" ( echo   Skipping wordpress. & echo. & goto :wp_done )
    )
    echo [^>] Creating WordPress headless Docker config...
    set "WP_DIR=%WORK_DIR%\wordpress"
    mkdir "!WP_DIR!"

    rem docker-compose.yml
    set "DC=!WP_DIR!\docker-compose.yml"
    > "!DC!" echo services:
    >> "!DC!" echo   db:
    >> "!DC!" echo     image: mysql:8.0
    >> "!DC!" echo     platform: linux/amd64
    >> "!DC!" echo     restart: unless-stopped
    >> "!DC!" echo     environment:
    >> "!DC!" echo       MYSQL_ROOT_PASSWORD: wordpress
    >> "!DC!" echo       MYSQL_DATABASE: wordpress
    >> "!DC!" echo       MYSQL_USER: wordpress
    >> "!DC!" echo       MYSQL_PASSWORD: wordpress
    >> "!DC!" echo     volumes:
    >> "!DC!" echo       - ./database:/var/lib/mysql
    >> "!DC!" echo.
    >> "!DC!" echo   wordpress:
    >> "!DC!" echo     image: wordpress:latest
    >> "!DC!" echo     restart: unless-stopped
    >> "!DC!" echo     depends_on:
    >> "!DC!" echo       - db
    >> "!DC!" echo     ports:
    >> "!DC!" echo       - "8080:80"
    >> "!DC!" echo     environment:
    >> "!DC!" echo       WORDPRESS_DB_HOST: db:3306
    >> "!DC!" echo       WORDPRESS_DB_USER: wordpress
    >> "!DC!" echo       WORDPRESS_DB_PASSWORD: wordpress
    >> "!DC!" echo       WORDPRESS_DB_NAME: wordpress
    >> "!DC!" echo       WORDPRESS_DEBUG: "1"
    >> "!DC!" echo     volumes:
    >> "!DC!" echo       - ./html:/var/www/html

    rem .env
    set "ENV=!WP_DIR!\.env"
    > "!ENV!" echo WORDPRESS_PORT=8080
    >> "!ENV!" echo WP_REST_URL=http://localhost:8080/wp-json/wp/v2

    call :make_zip "wordpress" "!WP_DIR!"
    echo.
  )
  :wp_done

  rem ── framely ───────────────────────────────────────────────
  if "!TARGET_NAME!"=="framely" (
    if exist "%SETUP_DIR%\cache\framely.zip" (
      if "!SKIP_EXISTING!"=="true" ( echo   framely.zip already exists -- skipping. & echo. & goto :framely_done )
      set /p "_confirm=  framely.zip already exists. Overwrite? [y/N] "
      if /i not "!_confirm!"=="y" ( echo   Skipping framely. & echo. & goto :framely_done )
    )
    echo [^>] Cloning Framely from GitHub...
    git clone --depth=1 https://github.com/belastrittmatter/Framely.git "%WORK_DIR%\framely"
    if not exist "%WORK_DIR%\framely" (
      echo   [!] git clone did not produce %WORK_DIR%\framely -- skipping zip
    ) else (
      call :make_zip_nomodules "framely" "%WORK_DIR%\framely"
    )
    echo.
  )
  :framely_done

  rem ── next-wp ───────────────────────────────────────────────
  if "!TARGET_NAME!"=="next-wp" (
    if exist "%SETUP_DIR%\cache\next-wp.zip" (
      if "!SKIP_EXISTING!"=="true" ( echo   next-wp.zip already exists -- skipping. & echo. & goto :nextwp_done )
      set /p "_confirm=  next-wp.zip already exists. Overwrite? [y/N] "
      if /i not "!_confirm!"=="y" ( echo   Skipping next-wp. & echo. & goto :nextwp_done )
    )
    echo [^>] Cloning next-wp from GitHub...
    git clone --depth=1 https://github.com/9d8dev/next-wp.git "%WORK_DIR%\next-wp"
    if not exist "%WORK_DIR%\next-wp" (
      echo   [!] git clone did not produce %WORK_DIR%\next-wp -- skipping zip
    ) else (
      call :make_zip_nomodules "next-wp" "%WORK_DIR%\next-wp"
    )
    echo.
  )
  :nextwp_done
)

rem ── Cleanup work dir ─────────────────────────────────────
echo   Cleaning up...
rd /s /q "%WORK_DIR%" 2>nul

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   [OK] Done. Zip files are in: %SETUP_DIR%\cache
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
exit /b 0

rem ─────────────────────────────────────────────────────────
rem :make_zip <name> <source-dir>
rem Zips source-dir to setup\cache\<name>.zip
rem Includes node_modules; excludes .git and .DS_Store
:make_zip
setlocal
set "Z_NAME=%~1"
set "Z_SRC=%~2"
set "Z_DEST=%SETUP_DIR%\cache\%Z_NAME%.zip"
set "Z_TMP=%SETUP_DIR%\cache\%Z_NAME%.zip.tmp"
echo   Zipping -^> %Z_DEST% ...
powershell -NoProfile -Command ^
  "$src='%Z_SRC%'; $dest='%Z_TMP%'; " ^
  "$files = Get-ChildItem -Recurse -File -LiteralPath $src | " ^
  "  Where-Object { $_.FullName -notmatch '\\\\.git\\\\' -and $_.Name -ne '.DS_Store' };" ^
  "$rel = $files | ForEach-Object { @{ Path=$_.FullName; RelPath=$_.FullName.Substring($src.Length+1) } };" ^
  "if ($rel.Count -gt 0) { Compress-Archive -Path $files.FullName -DestinationPath $dest -Force }"
if exist "%Z_TMP%" (
  if exist "%Z_DEST%" del "%Z_DEST%"
  ren "%Z_TMP%" "%Z_NAME%.zip"
  for %%s in ("%Z_DEST%") do echo   [OK] %Z_NAME%.zip (%%~zs bytes)
)
endlocal
exit /b 0

rem ─────────────────────────────────────────────────────────
rem :make_zip_nomodules <name> <source-dir>
rem Like make_zip but also excludes node_modules and .next
:make_zip_nomodules
setlocal
set "Z_NAME=%~1"
set "Z_SRC=%~2"
set "Z_DEST=%SETUP_DIR%\cache\%Z_NAME%.zip"
set "Z_TMP=%SETUP_DIR%\cache\%Z_NAME%.zip.tmp"
echo   Zipping -^> %Z_DEST% ...
powershell -NoProfile -Command ^
  "$src='%Z_SRC%'; $dest='%Z_TMP%'; " ^
  "$files = Get-ChildItem -Recurse -File -LiteralPath $src | " ^
  "  Where-Object { $_.FullName -notmatch '\\\\.git\\\\' -and $_.FullName -notmatch '\\\\node_modules\\\\' -and $_.FullName -notmatch '\\\\.next\\\\' -and $_.Name -ne '.DS_Store' };" ^
  "if ($files.Count -gt 0) { Compress-Archive -Path $files.FullName -DestinationPath $dest -Force }"
if exist "%Z_TMP%" (
  if exist "%Z_DEST%" del "%Z_DEST%"
  ren "%Z_TMP%" "%Z_NAME%.zip"
  for %%s in ("%Z_DEST%") do echo   [OK] %Z_NAME%.zip (%%~zs bytes)
)
endlocal
exit /b 0
