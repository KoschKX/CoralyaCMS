@echo off
rem install-framely.bat — called by setup.bat for the "framely" backend
rem Expects env vars: TARGET, SCRIPT_DIR

setlocal

rem ── 1. Extract Framely ────────────────────────────────────
echo.
echo [^>] Extracting Framely...
powershell -NoProfile -Command "Expand-Archive -Path '%SCRIPT_DIR%\setup\cache\framely.zip' -DestinationPath '%TARGET%\framely' -Force"

rem ── 1b. Fix ClerkProvider hydration mismatch ─────────────
echo [^>] Fixing ClerkProvider layout...
set "TMP_PY=%TEMP%\nt_framely_%RANDOM%.py"
(
  echo import sys
  echo path = sys.argv[1]
  echo src = open(path, encoding='utf-8'^).read(^)
  echo old = '''  return (
  echo     ^<ClerkProvider^>
  echo       ^<Script
  echo         defer
  echo         src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
  echo         data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
  echo         strategy="lazyOnload"
  echo       /^>
  echo       ^<SpeedInsights /^>
  echo       ^<html lang="en" className={inter.className} suppressHydrationWarning^>
  echo         ^<body suppressHydrationWarning^>
  echo           ^<ThemeProvider
  echo             attribute="class"
  echo             defaultTheme="dark"
  echo             disableTransitionOnChange
  echo           ^>
  echo             {children}
  echo             ^<Toaster /^>
  echo           ^</ThemeProvider^>
  echo         ^</body^>
  echo       ^</html^>
  echo     ^</ClerkProvider^>
  echo   ^);'''
  echo new = '''  return (
  echo     ^<html lang="en" className={inter.className} suppressHydrationWarning^>
  echo       ^<body suppressHydrationWarning^>
  echo         ^<ClerkProvider^>
  echo           ^<Script
  echo             defer
  echo             src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
  echo             data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
  echo             strategy="lazyOnload"
  echo           /^>
  echo           ^<SpeedInsights /^>
  echo           ^<ThemeProvider
  echo             attribute="class"
  echo             defaultTheme="dark"
  echo             disableTransitionOnChange
  echo           ^>
  echo             {children}
  echo             ^<Toaster /^>
  echo           ^</ThemeProvider^>
  echo         ^</ClerkProvider^>
  echo       ^</body^>
  echo     ^</html^>
  echo   ^);'''
  echo open(path, 'w', encoding='utf-8'^).write(src.replace(old, new^)^)
) > "%TMP_PY%"
python "%TMP_PY%" "%TARGET%\framely\src\app\layout.tsx"
del "%TMP_PY%" 2>nul

rem ── 2. Install dependencies ───────────────────────────────
echo [^>] Installing dependencies...
pushd "%TARGET%\framely"
call npm pkg delete scripts.postinstall
call npm install --legacy-peer-deps
popd

rem ── 3. Create .env from .env.example ─────────────────────
echo [^>] Creating .env from .env.example...
copy /y "%TARGET%\framely\.env.example" "%TARGET%\framely\.env" >nul

rem Patch DATABASE_URL and NEXT_PUBLIC_ROOT_DOMAIN via PowerShell
set "TMP_PS1=%TEMP%\nt_fenv_%RANDOM%.ps1"
(
  echo $f = '%TARGET%\framely\.env'
  echo $s = [IO.File]::ReadAllText($f)
  echo $s = $s -replace '(?m)^DATABASE_URL=.*$', 'DATABASE_URL="mysql://root:examplepass@localhost:13306/exampledb"'
  echo $s = $s -replace '(?m)^NEXT_PUBLIC_ROOT_DOMAIN=.*$', 'NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000"'
  echo [IO.File]::WriteAllText($f, $s, [Text.Encoding]::UTF8)
) > "%TMP_PS1%"
powershell -NoProfile -File "%TMP_PS1%"
del "%TMP_PS1%" 2>nul

rem ── 4. Fix docker-compose.yaml (port + platform) ─────────
echo [^>] Patching docker-compose.yaml...
set "TMP_PY2=%TEMP%\nt_fdc_%RANDOM%.py"
(
  echo import sys
  echo path = sys.argv[1]
  echo lines = open(path, encoding='utf-8'^).readlines(^)
  echo out = []
  echo for line in lines:
  echo     if '3306:3306' in line:
  echo         line = line.replace('3306:3306', '13306:3306'^)
  echo     out.append(line^)
  echo     if line.strip(^).startswith('image: mysql'^) and 'platform:' not in ''.join(lines^):
  echo         indent = len(line^) - len(line.lstrip(^)^)
  echo         out.append(' ' * indent + 'platform: linux/amd64\n'^)
  echo open(path, 'w', encoding='utf-8'^).writelines(out^)
) > "%TMP_PY2%"
python "%TMP_PY2%" "%TARGET%\framely\docker-compose.yaml"
del "%TMP_PY2%" 2>nul

rem ── 5. Check Docker and run Prisma migrations ─────────────
docker --version >nul 2>&1
if errorlevel 1 (
  echo   [X] Docker is required for Framely but was not found.
  echo     Install Docker Desktop: https://www.docker.com/products/docker-desktop/
  exit /b 1
)

echo [^>] Pulling Docker images...
pushd "%TARGET%\framely"
docker compose pull

echo [^>] Starting MySQL for initial setup...
docker compose up -d
popd

echo   Waiting for MySQL to be ready...
set "DB_READY=false"
:db_wait
docker compose -f "%TARGET%\framely\docker-compose.yaml" exec -T db mysqladmin ping -uroot -pexamplepass --silent >nul 2>&1
if not errorlevel 1 (
  set "DB_READY=true"
  goto db_done
)
timeout /t 2 /nobreak >nul
goto db_wait
:db_done

if "%DB_READY%"=="true" (
  echo   [OK] MySQL is ready.
  echo [^>] Running Prisma migrations...
  pushd "%TARGET%\framely"
  call npx prisma migrate dev --name init 2>nul || echo   [!] Prisma migration failed -- run manually: cd framely ^&^& npx prisma migrate dev
  popd
) else (
  echo   [!] MySQL didn't respond in time -- skipping Prisma migration.
)

echo [^>] Stopping MySQL (start.bat will restart it)...
pushd "%TARGET%\framely"
docker compose down
popd

rem ── 6. Copy start.bat ─────────────────────────────────────
echo [^>] Copying start.bat...
copy /y "%SCRIPT_DIR%\setup\start-framely.bat" "%TARGET%\start.bat" >nul

set "CMS_ADMIN_URL=http://localhost:3000"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   [OK] Setup complete!
echo.
echo   To start:  %TARGET%\start.bat
echo.
echo   Framely  -^> http://localhost:3000
echo.
echo   [!] Before starting, add your Clerk keys to:
echo         %TARGET%\framely\.env
echo.
echo       NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
echo       CLERK_SECRET_KEY=sk_...
echo.
echo       Get them at: https://clerk.com
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
exit /b 0
