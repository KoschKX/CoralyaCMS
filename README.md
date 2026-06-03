# CoralyaCMS

A self-hosted headless CMS with a Next.js 16 frontend, visual block editor, and optional multi-backend support.

---

## Project Structure

```
/
├── next/           # Next.js 16 app (frontend + admin UI + API routes)
├── data/           # Shared runtime data (settings.json, etc.)
├── setup/          # Scaffolding scripts for optional backends (Payload, Strapi, WordPress, …)
├── - AI -/         # AI-generated analysis and diagnostic notes
├── - WORKSPACE -/  # Workspace documentation and structure notes
├── - ARCHIVE -/    # Timestamped zip backups (git-ignored)
│
├── start.sh / start.bat        # Start Next.js in development mode
├── start-prod.sh               # Build + start Next.js in production mode
├── build.sh                    # Build Next.js for production (no server start)
├── backup.sh / backup.bat      # Create a timestamped zip backup
└── setup.sh / setup.bat        # Interactive scaffolding wizard for new backends
```

---

## Quick Start

### macOS / Linux

```bash
bash start.sh          # development (http://localhost:3000)
bash start-prod.sh     # production build + serve
bash build.sh          # build only
```

### Windows

```bat
start.bat              # development (http://localhost:3000)
```

---

## Scripts

| Script | Purpose |
|---|---|
| `start.sh` / `start.bat` | Install deps if needed, kill port 3000, start `next dev` |
| `start-prod.sh` | Build then run `next start` in production mode |
| `build.sh` | Run `next build` only |
| `backup.sh` / `backup.bat` | Zip the project (excludes `node_modules`, `.next`) into `- ARCHIVE -/` |
| `setup.sh` / `setup.bat` | Interactive wizard to scaffold a new CMS backend |

---

## Requirements

- **Node.js** 20+ and **npm**
- **macOS / Linux** for `.sh` scripts; **Windows** for `.bat` scripts
- **7-Zip** (`7z`) on Windows for `backup.bat`

---

## Development

```bash
cd next
npm install
npm run dev
```

The admin panel is available at `http://localhost:3000/admin`.

---

## Backup

Run `bash backup.sh` (or `backup.bat` on Windows) to create a timestamped `.zip` in `- ARCHIVE -/`. The archive directory is git-ignored.
