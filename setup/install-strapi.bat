@echo off
rem install-strapi.bat — called by setup.bat for the "strapi" backend
rem Expects env vars: TARGET, SCRIPT_DIR

setlocal

rem ── 1. Next.js ────────────────────────────────────────────
echo [^>] Creating Next.js app...
powershell -NoProfile -Command "Expand-Archive -Path '%SCRIPT_DIR%\setup\cache\next.zip' -DestinationPath '%TARGET%\next' -Force"
if not exist "%TARGET%\next\node_modules" (
  echo   node_modules not in zip -- running npm install...
  pushd "%TARGET%\next"
  call npm install
  popd
)

rem ── 2. Install Strapi ─────────────────────────────────────
echo.
echo [^>] Creating Strapi app...
powershell -NoProfile -Command "Expand-Archive -Path '%SCRIPT_DIR%\setup\cache\strapi.zip' -DestinationPath '%TARGET%\strapi' -Force"
if not exist "%TARGET%\strapi\node_modules" (
  echo   node_modules not in zip -- running npm install...
  pushd "%TARGET%\strapi"
  call npm install
  popd
)

rem ── 3. Next.js CMS example component ─────────────────────
echo [^>] Creating CMS example component in Next.js...
set "CMS=%TARGET%\next\app\cms-example.tsx"
> "%CMS%" echo "use client";
>> "%CMS%" echo.
>> "%CMS%" echo import { useEffect, useState } from "react";
>> "%CMS%" echo.
>> "%CMS%" echo export default function CmsExample() {
>> "%CMS%" echo   const [data, setData] = useState^<any^>(null);
>> "%CMS%" echo   const [error, setError] = useState^<string ^| null^>(null);
>> "%CMS%" echo.
>> "%CMS%" echo   useEffect^(^(^) =^> {
>> "%CMS%" echo     fetch("http://localhost:1337/api/pages?publicationState=live", {
>> "%CMS%" echo       headers: { "Content-Type": "application/json" },
>> "%CMS%" echo     }^)
>> "%CMS%" echo       .then^((res) =^> {
>> "%CMS%" echo         if ^(!res.ok^) throw new Error("Failed to fetch from Strapi API");
>> "%CMS%" echo         return res.json^(^);
>> "%CMS%" echo       }^)
>> "%CMS%" echo       .then(setData)
>> "%CMS%" echo       .catch^((err) =^> setError(err.message)^);
>> "%CMS%" echo   }, []^);
>> "%CMS%" echo.
>> "%CMS%" echo   return ^(
>> "%CMS%" echo     ^<div className="p-6 bg-white rounded shadow mt-8"^>
>> "%CMS%" echo       ^<h2 className="text-xl font-bold mb-2"^>Strapi Pages^</h2^>
>> "%CMS%" echo       {error ^&^& ^<div className="text-red-600"^>Error: {error}^</div^>}
>> "%CMS%" echo       {!data ^&^& !error ^&^& ^<p className="text-zinc-400"^>Loading...^</p^>}
>> "%CMS%" echo       {data?.data?.length === 0 ^&^& ^(
>> "%CMS%" echo         ^<p className="text-zinc-500"^>
>> "%CMS%" echo           No pages yet. Create one in Strapi at{" "}
>> "%CMS%" echo           ^<a className="underline" href="http://localhost:1337/admin"^>
>> "%CMS%" echo             localhost:1337/admin
>> "%CMS%" echo           ^</a^>.
>> "%CMS%" echo         ^</p^>
>> "%CMS%" echo       ^)}
>> "%CMS%" echo       {data?.data?.map^((page: any) =^> ^(
>> "%CMS%" echo         ^<div key={page.id} className="mb-4 border-b pb-4"^>
>> "%CMS%" echo           ^<h3 className="text-lg font-semibold"^>
>> "%CMS%" echo             {page.attributes?.title ?? page.title}
>> "%CMS%" echo           ^</h3^>
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
>> "%PAGE%" echo       ^<p className="text-zinc-500 mb-8"^>Powered by Next.js + Strapi^</p^>
>> "%PAGE%" echo       ^<CmsExample /^>
>> "%PAGE%" echo     ^</main^>
>> "%PAGE%" echo   ^);
>> "%PAGE%" echo }

rem ── 5. start.bat ──────────────────────────────────────────
echo [^>] Copying start.bat...
copy /y "%SCRIPT_DIR%\setup\start-strapi.bat" "%TARGET%\start.bat" >nul

set "CMS_ADMIN_URL=http://localhost:1337/admin"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   [OK] Setup complete!
echo.
echo   To start:  %TARGET%\start.bat
echo.
echo   Next.js  -^> http://localhost:3000
echo   Strapi   -^> %CMS_ADMIN_URL%
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
exit /b 0
