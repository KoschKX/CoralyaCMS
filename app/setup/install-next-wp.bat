@echo off
rem install-next-wp.bat — called by setup.bat for the "next-wp" backend
rem Expects env vars: TARGET, SCRIPT_DIR

setlocal enabledelayedexpansion

rem ── Check Docker is available ─────────────────────────────
docker --version >nul 2>&1
if errorlevel 1 (
  echo   [X] Docker is required for WordPress but was not found.
  echo     Install Docker Desktop: https://www.docker.com/products/docker-desktop/
  exit /b 1
)

rem ── 1. Extract next-wp ────────────────────────────────────
echo [^>] Extracting next-wp...
powershell -NoProfile -Command "Expand-Archive -Path '%SCRIPT_DIR%\setup\cache\next-wp.zip' -DestinationPath '%TARGET%\next-wp' -Force"

rem ── 2. Patch lib/wordpress.ts (use ?rest_route= for WP without pretty permalinks)
echo [^>] Patching lib/wordpress.ts...
set "TMP_PS1=%TEMP%\nt_nwp_%RANDOM%.ps1"
(
  echo $f = '%TARGET%\next-wp\lib\wordpress.ts'
  echo $s = [IO.File]::ReadAllText($f)
  echo $old = 'const USER_AGENT = "Next.js WordPress Client";' + "`n" + 'const CACHE_TTL = 3600; // 1 hour'
  echo $new = 'const USER_AGENT = "Next.js WordPress Client";' + "`n" + 'const CACHE_TTL = 3600; // 1 hour' + "`n`n" + 'function buildUrl(path: string, query?: Record^<string, any^>^): string {' + "`n" + '  const restPath = path.replace^(/^^\\/wp-json/, ""^);' + "`n" + '  const params = { rest_route: restPath, ...query };' + "`n" + '  return `${baseUrl}/?${querystring.stringify(params)}`;' + "`n" + '}'
  echo $s = $s.Replace($old, $new)
  echo $oldUrl = '`${baseUrl}${path}${query ? `?${querystring.stringify(query)}` : ""}`'
  echo $newUrl = 'buildUrl(path, query)'
  echo $s = $s.Replace($oldUrl, $newUrl)
  echo [IO.File]::WriteAllText($f, $s, [Text.Encoding]::UTF8)
) > "%TMP_PS1%"
powershell -NoProfile -File "%TMP_PS1%"
del "%TMP_PS1%" 2>nul

rem ── 3. Patch next.config.ts (allow HTTP images from localhost:8080) ─────────
echo [^>] Patching next.config.ts...
set "TMP_PS2=%TEMP%\nt_nwp_%RANDOM%.ps1"
(
  echo $f = '%TARGET%\next-wp\next.config.ts'
  echo $s = [IO.File]::ReadAllText($f)
  echo $old = "  images: {`n    remotePatterns: wordpressHostname`n      ? [`n          {`n            protocol: ""https"",`n            hostname: wordpressHostname,`n            port: """",`n            pathname: ""/**"",`n          },`n        ]`n      : [],`n  },"
  echo $new = "  images: {`n    remotePatterns: [`n      {`n        protocol: ""http"",`n        hostname: ""localhost"",`n        port: ""8080"",`n        pathname: ""/**"",`n      },`n      ...(wordpressHostname ^&^& wordpressHostname !== ""localhost""`n        ? [{ protocol: ""https"" as const, hostname: wordpressHostname, port: """", pathname: ""/**"" }]`n        : []),`n    ],`n  },"
  echo $s = $s.Replace($old, $new)
  echo [IO.File]::WriteAllText($f, $s, [Text.Encoding]::UTF8)
) > "%TMP_PS2%"
powershell -NoProfile -File "%TMP_PS2%"
del "%TMP_PS2%" 2>nul

rem ── 4. Create .env.local ──────────────────────────────────
echo [^>] Creating .env.local...
for /f %%s in ('powershell -NoProfile -Command "[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))"') do set "WP_SECRET=%%s"
set "ENVLOCAL=%TARGET%\next-wp\.env.local"
> "%ENVLOCAL%" echo WORDPRESS_URL="http://localhost:8080"
>> "%ENVLOCAL%" echo WORDPRESS_HOSTNAME="localhost"
>> "%ENVLOCAL%" echo WORDPRESS_WEBHOOK_SECRET="%WP_SECRET%"

rem ── 5. Install dependencies ───────────────────────────────
echo [^>] Installing dependencies...
pushd "%TARGET%\next-wp"
call npm install --legacy-peer-deps
popd

rem ── 6. Extract and start WordPress for initial setup ─────
echo [^>] Setting up WordPress (Docker)...
powershell -NoProfile -Command "Expand-Archive -Path '%SCRIPT_DIR%\setup\cache\wordpress.zip' -DestinationPath '%TARGET%\wordpress' -Force"

echo [^>] Stopping any existing WordPress containers...
pushd "%TARGET%\wordpress"
docker compose down 2>nul
echo [^>] Pulling Docker images...
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
  echo   [!] WordPress didn't respond in time. Finish setup manually.
  pushd "%TARGET%\wordpress"
  docker compose down
  popd
)

rem ── 7. Copy start.bat ─────────────────────────────────────
echo [^>] Copying start.bat...
copy /y "%SCRIPT_DIR%\setup\start-next-wp.bat" "%TARGET%\start.bat" >nul

set "CMS_ADMIN_URL=http://localhost:8080/wp-admin"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   [OK] Setup complete!
echo.
echo   To start:  %TARGET%\start.bat
echo.
echo   Next.js  -^> http://localhost:3000
echo   WP Admin -^> %CMS_ADMIN_URL%  (admin / admin)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
exit /b 0
