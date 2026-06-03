@echo off
rem install-wordpress-nextjs.bat — called by setup.bat for the "wordpress-nextjs" backend
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

rem ── Check Docker is available ─────────────────────────────
docker --version >nul 2>&1
if errorlevel 1 (
  echo   [X] Docker is required for WordPress but was not found.
  echo     Install Docker Desktop: https://www.docker.com/products/docker-desktop/
  exit /b 1
)

rem ── 2. Install WordPress Docker config ───────────────────
echo.
echo [^>] Setting up WordPress (Docker)...
powershell -NoProfile -Command "Expand-Archive -Path '%SCRIPT_DIR%\setup\cache\wordpress.zip' -DestinationPath '%TARGET%\wordpress' -Force"

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
  echo   [!] WordPress didn't respond in time. Finish setup manually.
  pushd "%TARGET%\wordpress"
  docker compose down
  popd
)

rem ── 3. Next.js CMS example component (server component) ──
echo [^>] Creating CMS example component in Next.js...
set "CMS=%TARGET%\next\app\cms-example.tsx"
> "%CMS%" echo // Server component -- fetch runs on Node.js, no CORS
>> "%CMS%" echo export default async function CmsExample() {
>> "%CMS%" echo   let pages: any[] = [];
>> "%CMS%" echo   let error: string ^| null = null;
>> "%CMS%" echo.
>> "%CMS%" echo   try {
>> "%CMS%" echo     const res = await fetch("http://localhost:8080/?rest_route=/wp/v2/pages^&_embed", {
>> "%CMS%" echo       next: { revalidate: 30 },
>> "%CMS%" echo     });
>> "%CMS%" echo     if ^(!res.ok^) throw new Error(`WordPress API returned ${res.status}`);
>> "%CMS%" echo     pages = await res.json^(^);
>> "%CMS%" echo   } catch ^(err: any^) {
>> "%CMS%" echo     error = err.message;
>> "%CMS%" echo   }
>> "%CMS%" echo.
>> "%CMS%" echo   return ^(
>> "%CMS%" echo     ^<div className="p-6 bg-white rounded shadow mt-8"^>
>> "%CMS%" echo       ^<h2 className="text-xl font-bold mb-2"^>WordPress Pages^</h2^>
>> "%CMS%" echo       {error ^&^& ^<div className="text-red-600"^>Error: {error}^</div^>}
>> "%CMS%" echo       {pages.length === 0 ^&^& !error ^&^& ^(
>> "%CMS%" echo         ^<p className="text-zinc-500"^>
>> "%CMS%" echo           No pages yet. Create one in WordPress at{" "}
>> "%CMS%" echo           ^<a className="underline" href="http://localhost:8080/wp-admin"^>
>> "%CMS%" echo             localhost:8080/wp-admin
>> "%CMS%" echo           ^</a^>.
>> "%CMS%" echo         ^</p^>
>> "%CMS%" echo       ^)}
>> "%CMS%" echo       {pages.map^((page: any) =^> ^(
>> "%CMS%" echo         ^<div key={page.id} className="mb-4 border-b pb-4"^>
>> "%CMS%" echo           ^<h3 className="text-lg font-semibold"^>{page.title?.rendered}^</h3^>
>> "%CMS%" echo           ^<div
>> "%CMS%" echo             className="text-zinc-600 mt-1"
>> "%CMS%" echo             dangerouslySetInnerHTML={{ __html: page.excerpt?.rendered ^|^| "" }}
>> "%CMS%" echo           /^>
>> "%CMS%" echo         ^</div^>
>> "%CMS%" echo       ^))}
>> "%CMS%" echo     ^</div^>
>> "%CMS%" echo   ^);
>> "%CMS%" echo }

rem ── 4. Homepage ───────────────────────────────────────────
echo [^>] Updating Next.js homepage...
set "PAGE=%TARGET%\next\app\page.tsx"
> "%PAGE%" echo import CmsExample from "./cms-example";
>> "%PAGE%" echo.
>> "%PAGE%" echo export default function Home() {
>> "%PAGE%" echo   return ^(
>> "%PAGE%" echo     ^<main className="min-h-screen max-w-3xl mx-auto px-6 py-16"^>
>> "%PAGE%" echo       ^<h1 className="text-3xl font-bold mb-2"^>My Site^</h1^>
>> "%PAGE%" echo       ^<p className="text-zinc-500 mb-8"^>Powered by Next.js + WordPress^</p^>
>> "%PAGE%" echo       ^<CmsExample /^>
>> "%PAGE%" echo     ^</main^>
>> "%PAGE%" echo   ^);
>> "%PAGE%" echo }

rem ── 5. start.bat ──────────────────────────────────────────
echo [^>] Copying start.bat...
copy /y "%SCRIPT_DIR%\setup\start-wordpress.bat" "%TARGET%\start.bat" >nul

set "CMS_ADMIN_URL=http://localhost:8080/wp-admin"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   [OK] Setup complete!
echo.
echo   To start:  %TARGET%\start.bat
echo.
echo   Next.js     -^> http://localhost:3000
echo   WordPress   -^> %CMS_ADMIN_URL%
echo   WP REST API -^> http://localhost:8080/wp-json/wp/v2/
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
exit /b 0
