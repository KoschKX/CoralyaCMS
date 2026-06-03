@echo off
rem install-wordpress.bat — called by setup.bat for the "wordpress" backend
rem Expects env vars: TARGET, SCRIPT_DIR

setlocal enabledelayedexpansion

rem ── Check Docker is available ─────────────────────────────
docker --version >nul 2>&1
if errorlevel 1 (
  echo   [X] Docker is required for WordPress but was not found.
  echo     Install Docker Desktop: https://www.docker.com/products/docker-desktop/
  exit /b 1
)

rem ── 1. Install WordPress Docker config ───────────────────
echo.
echo [^>] Setting up WordPress (Docker)...
powershell -NoProfile -Command "Expand-Archive -Path '%SCRIPT_DIR%\setup\cache\wordpress.zip' -DestinationPath '%TARGET%\wordpress' -Force"

rem ── 2. Pull Docker images and initialize WordPress ───────
echo [^>] Stopping any existing WordPress containers...
pushd "%TARGET%\wordpress"
docker compose down 2>nul
echo [^>] Pulling Docker images (this may take a minute)...
docker compose pull
echo [^>] Starting WordPress for initial setup...
docker compose up -d
popd

echo   Waiting for WordPress to be ready (first boot can take a few minutes)...
set "WP_READY=false"
set /a COUNTER=0
:wp_wait
set /a COUNTER+=1
if %COUNTER% GTR 150 goto wp_timeout
for /f %%c in ('curl -s -o nul -w "%%{http_code}" http://localhost:8080/ 2^>nul') do (
  if "%%c"=="200" (
    set "WP_READY=true"
    goto wp_done
  )
)
set /a MOD=COUNTER %% 15
if %MOD%==0 (
  set /a SECS=COUNTER*2
  echo   ...still waiting (!SECS!s elapsed)...
)
timeout /t 2 /nobreak >nul
goto wp_wait
:wp_timeout
:wp_done

if "%WP_READY%"=="true" (
  echo   [OK] WordPress is running.

  echo [^>] Running WordPress auto-install...
  docker compose -f "%TARGET%\wordpress\docker-compose.yml" exec -T wordpress bash -c "until [ -f /var/www/html/wp-includes/version.php ]; do sleep 1; done; curl -sO https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar; chmod +x wp-cli.phar; php wp-cli.phar core install --url=http://localhost:8080 --title='My Site' --admin_user=admin --admin_password=admin --admin_email=admin@example.com --skip-email --allow-root --path=/var/www/html; php wp-cli.phar rewrite structure '/%%postname%%/' --allow-root --path=/var/www/html; php wp-cli.phar rewrite flush --allow-root --path=/var/www/html"

  echo   [OK] WordPress installed (admin/admin)

  echo [^>] Stopping WordPress containers (start.bat will restart them)...
  pushd "%TARGET%\wordpress"
  docker compose down
  popd
) else (
  echo   [!] WordPress didn't respond in time. You may need to finish setup manually.
  pushd "%TARGET%\wordpress"
  docker compose down
  popd
)

rem ── 3. start.bat (WordPress-only, no Next.js) ────────────
echo [^>] Creating start.bat...
set "SBAT=%TARGET%\start.bat"
> "%SBAT%" echo @echo off
>> "%SBAT%" echo setlocal
>> "%SBAT%" echo set "ROOT=%%~dp0"
>> "%SBAT%" echo set "ROOT=%%ROOT:~0,-1%%"
>> "%SBAT%" echo docker info ^>nul 2^>^&1
>> "%SBAT%" echo if errorlevel 1 ( echo   [X] Docker is not running. Please start Docker Desktop. ^& exit /b 1 )
>> "%SBAT%" echo echo [^>] Starting WordPress via Docker Compose...
>> "%SBAT%" echo pushd "%%ROOT%%\wordpress"
>> "%SBAT%" echo docker compose up -d
>> "%SBAT%" echo popd
>> "%SBAT%" echo echo.
>> "%SBAT%" echo echo   Waiting for WordPress to be ready...
>> "%SBAT%" echo :wp_wait
>> "%SBAT%" echo for /f %%%%c in ('curl -s -o nul -w "%%%%{http_code}" http://localhost:8080/ 2^>nul') do ( if "%%%%c"=="200" goto wp_ready )
>> "%SBAT%" echo timeout /t 2 /nobreak ^>nul ^& goto wp_wait
>> "%SBAT%" echo :wp_ready
>> "%SBAT%" echo echo   [OK] WordPress is ready!
>> "%SBAT%" echo echo.
>> "%SBAT%" echo echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
>> "%SBAT%" echo echo   WordPress   -^> http://localhost:8080
>> "%SBAT%" echo echo   WP Admin    -^> http://localhost:8080/wp-admin
>> "%SBAT%" echo echo   WP REST API -^> http://localhost:8080/wp-json/wp/v2/
>> "%SBAT%" echo echo   Run: docker compose down   in the wordpress folder to stop.
>> "%SBAT%" echo echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
>> "%SBAT%" echo endlocal

set "CMS_ADMIN_URL=http://localhost:8080/wp-admin"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   [OK] Setup complete!
echo.
echo   To start:  %TARGET%\start.bat
echo.
echo   WordPress   -^> http://localhost:8080
echo   WP Admin    -^> %CMS_ADMIN_URL%
echo   WP REST API -^> http://localhost:8080/wp-json/wp/v2/
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
exit /b 0
