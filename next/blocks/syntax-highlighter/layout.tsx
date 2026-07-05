"use client";

import "./styles.css";
import { useState } from "react";
import { useBlockT } from "@/components/editor/BlockLocaleContext";
import Prism from "prismjs";
// ── Language grammars (side-effect imports register into Prism.languages) ─────
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-php";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-markup-templating"; // required by php
import "prismjs/components/prism-php";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import type { BlockLayoutProps } from "@/lib/block-types";
import type React from "react";

// ── Language map — value → Prism grammar key ──────────────────────────────────
const LANG_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  jsx:        "jsx",
  tsx:        "tsx",
  html:       "markup",
  xml:        "markup",
  css:        "css",
  scss:       "scss",
  php:        "php",
  python:     "python",
  bash:       "bash",
  json:       "json",
  sql:        "sql",
  java:       "java",
  c:          "c",
  cpp:        "cpp",
  csharp:     "csharp",
  go:         "go",
  rust:       "rust",
  ruby:       "ruby",
  kotlin:     "kotlin",
  swift:      "swift",
  yaml:       "yaml",
  markdown:   "markdown",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeColor(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const v = raw.trim();
  if (/^(#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-z]+)$/i.test(v))
    return v;
  return undefined;
}

/** Highlight code with Prism. Returns plain-escaped HTML for unknown languages. */
function highlight(code: string, language: string): string {
  const prismKey = LANG_MAP[language] ?? null;
  const grammar  = prismKey ? Prism.languages[prismKey] : null;
  if (!grammar) {
    // No grammar — escape HTML entities and return as-is
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  // Prism.highlight escapes HTML entities in the source before tokenising,
  // so dangerouslySetInnerHTML with its output is safe.
  return Prism.highlight(code, grammar, prismKey!);
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ code, label }: { code: string; label: string }) {
  const t = useBlockT("syntax-highlighter");
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="coralya-sh__copy"
      aria-label={t("copy.aria", "Copy code to clipboard")}
    >
      {copied ? t("copy.copied", "Copied!") : label || t("copy.label", "Copy")}
    </button>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function SyntaxHighlighterLayout({ data }: BlockLayoutProps) {
  const code        = (data.code        as string) ?? "";
  const language    = (data.language    as string) || "text";
  const theme       = (data.theme       as string) || "default";
  const lineNumbers = data.lineNumbers !== false;
  const lineWrap    = data.lineWrap === true;
  const copyButton  = data.copyButton !== false;
  const copyText    = (data.copyText    as string) || "";
  const fontSize    = (data.fontSize    as string) || undefined;
  const bgColor     = sanitizeColor(data.bgColor);
  const borderStyle = (data.borderStyle as string) || "none";
  const borderSize  = (data.borderSize  as string) || undefined;
  const borderColor = sanitizeColor(data.borderColor);

  const highlighted = highlight(code, language);
  const lines       = code.split("\n");

  const containerStyle: React.CSSProperties = {
    ...(fontSize   ? { fontSize }                : {}),
    ...(bgColor    ? { "--sh-bg": bgColor } as React.CSSProperties : {}),
    ...(borderStyle !== "none" && borderSize
      ? { borderWidth: borderSize, borderStyle, borderColor: borderColor ?? undefined }
      : {}),
  };

  return (
    <div
      className={`coralya-sh coralya-sh--${theme}${lineWrap ? " coralya-sh--wrap" : ""}`}
      style={containerStyle}
    >
      {copyButton && <CopyButton code={code} label={copyText} />}

      <div className="coralya-sh__body">
        {lineNumbers && (
          <div className="coralya-sh__gutter" aria-hidden="true">
            {lines.map((_, i) => (
              <span key={i} className="coralya-sh__lineno">{i + 1}</span>
            ))}
          </div>
        )}
        <pre className="coralya-sh__pre">
          {/* Prism output is safe: it HTML-escapes the source before tokenising */}
          <code
            className="coralya-sh__code"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    </div>
  );
}
