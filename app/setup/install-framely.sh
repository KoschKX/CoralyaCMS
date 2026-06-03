# ─────────────────────────────────────────────────────────────────────────────
# install-framely.sh — Sourced by setup.sh for the "framely" backend
# Expects: TARGET, SCRIPT_DIR
# Sets:    CMS_ADMIN_URL
# ─────────────────────────────────────────────────────────────────────────────

# ── 1. Extract Framely ────────────────────────────────────────────────────────
echo ""
echo "▶ Extracting Framely..."
mkdir -p "$TARGET/framely"
unzip -qo "$SCRIPT_DIR/setup/cache/framely.zip" -d "$TARGET/framely"

# ── 1b. Fix ClerkProvider hydration mismatch ─────────────────────────────────
# Clerk v6+ wraps content in a Suspense boundary. When ClerkProvider is the
# root element and wraps <html>, React hydration fails because the server and
# client trees differ. Fix: move <html>/<body> outside ClerkProvider.
LAYOUT_FILE="$TARGET/framely/src/app/layout.tsx"
python3 - "$LAYOUT_FILE" <<'PYEOF'
import sys, re
src = open(sys.argv[1]).read()
old = '''  return (
    <ClerkProvider>
      <Script
        defer
        src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
        data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
        strategy="lazyOnload"
      />
      <SpeedInsights />
      <html lang="en" className={inter.className} suppressHydrationWarning>
        <body suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );'''
new = '''  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClerkProvider>
          <Script
            defer
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="lazyOnload"
          />
          <SpeedInsights />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );'''
open(sys.argv[1], 'w').write(src.replace(old, new))
PYEOF

# ── 2. Install dependencies ───────────────────────────────────────────
echo "▶ Installing dependencies..."
# Remove Framely's postinstall (prisma generate) — we'll run it in start.sh
# after MySQL is up, which avoids Prisma 6 WASM bootstrap issues.
(cd "$TARGET/framely" && npm pkg delete scripts.postinstall)
(cd "$TARGET/framely" && npm install --legacy-peer-deps)

# ── 2. Create .env ────────────────────────────────────────────────────────────
echo "▶ Creating .env from .env.example..."
cp "$TARGET/framely/.env.example" "$TARGET/framely/.env"

# Patch DATABASE_URL to point at the local Docker MySQL (host port 13306 avoids conflicts)
sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL="mysql://root:examplepass@localhost:13306/exampledb"|' "$TARGET/framely/.env"

# Set root domain to localhost for dev
sed -i '' 's|^NEXT_PUBLIC_ROOT_DOMAIN=.*|NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000"|' "$TARGET/framely/.env"

# ── 3. Fix docker-compose for ARM Macs ───────────────────────────────────────
python3 - "$TARGET/framely/docker-compose.yaml" <<'PYEOF'
import sys
path = sys.argv[1]
lines = open(path).readlines()
out = []
for line in lines:
    # Remap host port 3306 → 13306 to avoid conflicts with local MySQL
    if '3306:3306' in line:
        line = line.replace('3306:3306', '13306:3306')
    out.append(line)
    # Inject platform: linux/amd64 after image: mysql (ARM Mac fix)
    if line.strip().startswith('image: mysql') and 'platform:' not in ''.join(lines):
        indent = len(line) - len(line.lstrip())
        out.append(' ' * indent + 'platform: linux/amd64\n')
open(path, 'w').writelines(out)
PYEOF

# ── 4. Start MySQL & run Prisma migrations ────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "  ✗ Docker is required for Framely but was not found."
  echo "    Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

echo "▶ Pulling Docker images..."
(cd "$TARGET/framely" && docker compose pull)

echo "▶ Starting MySQL for initial setup..."
(cd "$TARGET/framely" && docker compose up -d)

echo "  Waiting for MySQL to be ready..."
DB_READY=false
for i in $(seq 1 30); do
  if docker compose -f "$TARGET/framely/docker-compose.yaml" exec -T db \
       mysqladmin ping -uroot -pexamplepass --silent 2>/dev/null; then
    DB_READY=true
    break
  fi
  sleep 2
done

if [ "$DB_READY" = true ]; then
  echo "  ✓ MySQL is ready."
  echo "▶ Running Prisma migrations..."
  (cd "$TARGET/framely" && npx prisma migrate dev --name init) || \
    echo "  ⚠ Prisma migration failed — you can run it manually: cd framely && npx prisma migrate dev"
else
  echo "  ⚠ MySQL didn't respond in time — skipping Prisma migration."
  echo "    Start MySQL manually, then run: cd framely && npx prisma migrate dev"
fi

echo "▶ Stopping MySQL (start.sh will restart it)..."
(cd "$TARGET/framely" && docker compose down)

# ── 5. Copy start.sh ──────────────────────────────────────────────────────────
echo "▶ Creating start.sh..."
cp "$SCRIPT_DIR/setup/start-framely.sh" "$TARGET/start.sh"

CMS_ADMIN_URL="http://localhost:3000"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Setup complete!"
echo ""
echo "  To start:  bash $TARGET/start.sh"
echo ""
echo "  Framely  → http://localhost:3000"
echo ""
echo "  ⚠  Before starting, add your Clerk keys to:"
echo "       $TARGET/framely/.env"
echo ""
echo "     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_..."
echo "     CLERK_SECRET_KEY=sk_..."
echo ""
echo "     Get them at: https://clerk.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
