import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // ── React ────────────────────────────────────────────────────────────
      // Warn when a hook dependency is missing (catches stale closure bugs).
      "react-hooks/exhaustive-deps": "warn",
      // Disallow calling Hooks inside conditions, loops, or nested functions.
      "react-hooks/rules-of-hooks": "error",

      // ── TypeScript ───────────────────────────────────────────────────────
      // Warn on unused variables (prefix with _ to silence intentionally unused).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Prefer typed catches: `catch (err)` → type-narrow before use.
      "@typescript-eslint/no-explicit-any": "warn",
      // Prefer `const` assertions over type casting when possible.
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // ── General quality ──────────────────────────────────────────────────
      // Prevent accidental `console.log` left in production code.
      // `console.warn` and `console.error` are fine.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Catch unreachable code and missing returns.
      "no-unreachable": "error",
      // Disallow duplicate object keys.
      "no-dupe-keys": "error",
      // Enforce === over == to avoid implicit coercion.
      "eqeqeq": ["error", "always", { null: "ignore" }],
    },
  },
]);

export default eslintConfig;
