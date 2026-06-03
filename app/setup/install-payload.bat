@echo off
rem install-payload.bat — called by setup.bat for the "payload" backend
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

rem ── 2. Install Payload ────────────────────────────────────
echo.
echo [^>] Creating Payload CMS app...
powershell -NoProfile -Command "Expand-Archive -Path '%SCRIPT_DIR%\setup\cache\payload.zip' -DestinationPath '%TARGET%\payload' -Force"
if not exist "%TARGET%\payload\node_modules" (
  echo   node_modules not in zip -- running npm install...
  pushd "%TARGET%\payload"
  call npm install
  popd
)

rem ── 3. Patch Payload package.json (add prebuild) ──────────
echo.
echo [^>] Patching Payload package.json...
set "TMP_PS1=%TEMP%\nt_patch_%RANDOM%.ps1"
(
  echo $f = '%TARGET%\payload\package.json'
  echo $s = [IO.File]::ReadAllText($f)
  echo $s = $s -replace '"build": ', '"prebuild": "npm run generate:importmap ^&^& npm run generate:types",`n    "build": '
  echo [IO.File]::WriteAllText($f, $s, [Text.Encoding]::UTF8)
) > "%TMP_PS1%"
powershell -NoProfile -File "%TMP_PS1%"
del "%TMP_PS1%" 2>nul

rem ── 4. Patch Payload config ───────────────────────────────
echo.
echo [^>] Patching Payload config...
set "TMP_PS2=%TEMP%\nt_patch_%RANDOM%.ps1"
(
  echo $f = '%TARGET%\payload\src\payload.config.ts'
  echo $s = [IO.File]::ReadAllText($f)
  echo $s = $s -replace "import \{ Media \} from '\./collections/Media'", "import { Media } from './collections/Media'`nimport { Pages } from './collections/Pages'"
  echo $s = $s -replace "export default buildConfig\(\{", "export default buildConfig({`n  serverURL: 'http://localhost:3001',`n  cors: ['http://localhost:3000'],"
  echo $s = $s -replace "collections: \[Users, Media\]", "collections: [Users, Media, Pages]"
  echo [IO.File]::WriteAllText($f, $s, [Text.Encoding]::UTF8)
) > "%TMP_PS2%"
powershell -NoProfile -File "%TMP_PS2%"
del "%TMP_PS2%" 2>nul

rem ── 5. Create Pages collection ────────────────────────────
echo [^>] Creating Pages collection...
set "PAGES=%TARGET%\payload\src\collections\Pages.ts"
> "%PAGES%" echo import type { CollectionConfig } from 'payload'
>> "%PAGES%" echo.
>> "%PAGES%" echo export const Pages: CollectionConfig = {
>> "%PAGES%" echo   slug: 'pages',
>> "%PAGES%" echo   access: {
>> "%PAGES%" echo     read: ^(^) =^> true,
>> "%PAGES%" echo   },
>> "%PAGES%" echo   fields: [
>> "%PAGES%" echo     {
>> "%PAGES%" echo       name: 'title',
>> "%PAGES%" echo       type: 'text',
>> "%PAGES%" echo       required: true,
>> "%PAGES%" echo     },
>> "%PAGES%" echo     {
>> "%PAGES%" echo       name: 'content',
>> "%PAGES%" echo       type: 'richText',
>> "%PAGES%" echo     },
>> "%PAGES%" echo   ],
>> "%PAGES%" echo }

rem ── 6. Generate import map ────────────────────────────────
echo [^>] Generating Payload import map...
pushd "%TARGET%\payload"
call npm run generate:importmap 2>nul
popd

rem ── 7. Next.js CMS example component ─────────────────────
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
>> "%CMS%" echo     fetch("http://localhost:3001/api/pages")
>> "%CMS%" echo       .then^((res) =^> {
>> "%CMS%" echo         if ^(!res.ok^) throw new Error("Failed to fetch from Payload API");
>> "%CMS%" echo         return res.json^(^);
>> "%CMS%" echo       }^)
>> "%CMS%" echo       .then(setData)
>> "%CMS%" echo       .catch^((err) =^> setError(err.message)^);
>> "%CMS%" echo   }, []^);
>> "%CMS%" echo.
>> "%CMS%" echo   return ^(
>> "%CMS%" echo     ^<div className="p-6 bg-white rounded shadow mt-8"^>
>> "%CMS%" echo       ^<h2 className="text-xl font-bold mb-2"^>Payload Pages^</h2^>
>> "%CMS%" echo       {error ^&^& ^<div className="text-red-600"^>Error: {error}^</div^>}
>> "%CMS%" echo       {!data ^&^& !error ^&^& ^<p className="text-zinc-400"^>Loading...^</p^>}
>> "%CMS%" echo       {data?.docs?.length === 0 ^&^& ^(
>> "%CMS%" echo         ^<p className="text-zinc-500"^>
>> "%CMS%" echo           No pages yet. Create one in Payload at{" "}
>> "%CMS%" echo           ^<a className="underline" href="http://localhost:3001/admin"^>
>> "%CMS%" echo             localhost:3001/admin
>> "%CMS%" echo           ^</a^>.
>> "%CMS%" echo         ^</p^>
>> "%CMS%" echo       ^)}
>> "%CMS%" echo       {data?.docs?.map^((page: any) =^> ^(
>> "%CMS%" echo         ^<div key={page.id} className="mb-4 border-b pb-4"^>
>> "%CMS%" echo           ^<h3 className="text-lg font-semibold"^>{page.title}^</h3^>
>> "%CMS%" echo         ^</div^>
>> "%CMS%" echo       ^))}
>> "%CMS%" echo     ^</div^>
>> "%CMS%" echo   ^);
>> "%CMS%" echo }

rem ── 8. Homepage ───────────────────────────────────────────
echo [^>] Updating Next.js homepage...
set "PAGE=%TARGET%\next\app\page.tsx"
> "%PAGE%" echo import CmsExample from "./cms-example";
>> "%PAGE%" echo.
>> "%PAGE%" echo export default function Home() {
>> "%PAGE%" echo   return ^(
>> "%PAGE%" echo     ^<main className="min-h-screen max-w-3xl mx-auto px-6 py-16"^>
>> "%PAGE%" echo       ^<h1 className="text-3xl font-bold mb-2"^>My Site^</h1^>
>> "%PAGE%" echo       ^<p className="text-zinc-500 mb-8"^>Powered by Next.js + Payload CMS^</p^>
>> "%PAGE%" echo       ^<CmsExample /^>
>> "%PAGE%" echo     ^</main^>
>> "%PAGE%" echo   ^);
>> "%PAGE%" echo }

rem ── 9. start.bat ──────────────────────────────────────────
echo [^>] Copying start.bat...
copy /y "%SCRIPT_DIR%\setup\start-payload.bat" "%TARGET%\start.bat" >nul

set "CMS_ADMIN_URL=http://localhost:3001/admin"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   [OK] Setup complete!
echo.
echo   To start:  %TARGET%\start.bat
echo.
echo   Next.js  -^> http://localhost:3000
echo   Payload  -^> %CMS_ADMIN_URL%
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

endlocal
exit /b 0
