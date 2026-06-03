
import type { NextConfig } from "next";
import path from "path";
import { execFileSync } from "child_process";
import { watch } from "fs";

const isDev = process.env.NODE_ENV !== "production";

// ── Block auto-discovery ──────────────────────────────────────────────────────
// Run codegen synchronously so generated files are ready before compilation.
try {
  execFileSync(
    process.execPath,
    [path.join(__dirname, "lib/codegen.mjs")],
    { cwd: __dirname, stdio: ["ignore", "inherit", "inherit"] },
  );
} catch (e) {
  console.error("[codegen] startup failed:", (e as Error).message);
}

// In dev, re-run codegen whenever a block or plugin entry file is added/removed.
if (isDev) {
  let debounce: ReturnType<typeof setTimeout> | null = null;
  const rerun = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      try {
        execFileSync(
          process.execPath,
          [path.join(__dirname, "lib/codegen.mjs")],
          { cwd: __dirname, stdio: ["ignore", "inherit", "inherit"] },
        );
      } catch (e) {
        console.error("[codegen] watch failed:", (e as Error).message);
      }
    }, 200);
  };

  // Watch blocks/ for config.tsx / layout.tsx changes
  watch(path.join(__dirname, "blocks"), { recursive: true }, (_e, f) => {
    if (f && /(config|layout)\.tsx$/.test(f)) rerun();
  });

  // Watch plugins/ for index.ts changes (new/removed plugins)
  watch(path.join(__dirname, "plugins"), { recursive: true }, (_e, f) => {
    if (f && /index\.ts$/.test(f)) rerun();
  });
}

/**
 * Content-Security-Policy header value.
 * - 'unsafe-eval' is required in dev mode for Next.js Fast Refresh / webpack HMR.
 *   It is intentionally excluded in production.
 * - 'unsafe-inline' is required for Tailwind CSS and Next.js inline scripts.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",    // unsafe-inline needed for Tailwind/inline styles
  "img-src 'self' data: https:",          // allow external images (logos, embeds)
  "font-src 'self' data:",
  "frame-src 'self' https:",              // allow iframes for embed blocks
  "connect-src 'self'" + (isDev ? " ws: wss:" : ""),  // ws/wss needed for HMR in dev
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  // Turbopack (used by `next dev --turbo`) needs its own SVG rule
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  // Webpack (used by `next build`) SVG rule
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: "@svgr/webpack",
        },
      ],
    });
    return config;
  },
};

export default nextConfig;
