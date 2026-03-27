/**
 * Shortcode parser — WordPress style, with support for container blocks:
 *
 *   Self-closing:  [block-name key="value"]
 *   Container:     [columns][column width="50%"]…[/column][/columns]
 *
 * ALL block properties are preserved.
 *
 * Encoding rules (chosen to keep values human-readable):
 *   scalar string  →  key="value"    (escape " → &quot;, [ → &#91;, ] → &#93;)
 *   array / object →  key='…json…'  (single-quote delimiter; JSON already uses "
 *                                     so no &quot; needed — only [ ] are escaped)
 */

import type { EditorBlock } from "@/lib/pages-db";

// ── Attribute value encoding / decoding ─────────────────────────────────────

/** Escape the two chars that would confuse the tokeniser regex. */
function escapeBrackets(s: string): string {
  return s.replace(/\[/g, "&#91;").replace(/\]/g, "&#93;");
}
function unescapeBrackets(s: string): string {
  return s.replace(/&#93;/g, "]").replace(/&#91;/g, "[");
}

/**
 * Serialise key + value to an attr token.
 *  scalar  → key="value"  (double-quote; escape " and [ ])
 *  complex → key='json'   (single-quote; escape [ ] only — JSON uses " internally)
 */
function serializeAttr(key: string, v: unknown): string {
  if (typeof v === "string") {
    const encoded = escapeBrackets(v).replace(/"/g, "&quot;");
    return `${key}="${encoded}"`;
  }
  if (typeof v === "number" || typeof v === "boolean") {
    return `${key}="${v}"`;
  }
  // Array or object — single-quote delimiter so JSON's own " stay readable
  const json = escapeBrackets(JSON.stringify(v));
  return `${key}='${json}'`;
}

function decodeAttrValue(raw: string, singleQuoted: boolean): unknown {
  const s = singleQuoted
    ? unescapeBrackets(raw)
    : unescapeBrackets(raw).replace(/&quot;/g, '"');
  try { return JSON.parse(s); } catch { return s; }
}

// Match both key="…" (no bare ") and key='…' (no bare ')
// Brackets are already escaped inside values so [^\]…] stays safe.
const ATTR_RE_DOUBLE = /([a-z][a-z0-9_-]*)="([^"]*)"/gi;
const ATTR_RE_SINGLE = /([a-z][a-z0-9_-]*)='([^']*)'/gi;

function parseAttrsStr(raw: string): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  let m: RegExpExecArray | null;
  ATTR_RE_DOUBLE.lastIndex = 0;
  while ((m = ATTR_RE_DOUBLE.exec(raw)) !== null) {
    attrs[m[1].toLowerCase()] = decodeAttrValue(m[2], false);
  }
  ATTR_RE_SINGLE.lastIndex = 0;
  while ((m = ATTR_RE_SINGLE.exec(raw)) !== null) {
    attrs[m[1].toLowerCase()] = decodeAttrValue(m[2], true);
  }
  return attrs;
}

// ── Single-shortcode parse (used by BlockRenderer paragraph fallback) ────────

const SHORTCODE_RE = /^\[([a-z][a-z0-9_-]*)([^\]]*)\]$/i;

/** Strip HTML tags to get the raw text a user typed. */
function stripHTML(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

export interface ShortcodeData {
  name: string;
  attrs: Record<string, unknown>;
}

export function parseShortcode(raw: string): ShortcodeData | null {
  const text = stripHTML(raw);
  const m = SHORTCODE_RE.exec(text);
  if (!m) return null;
  return { name: m[1].toLowerCase(), attrs: parseAttrsStr(m[2]) };
}

// ── Tokeniser ────────────────────────────────────────────────────────────────

type ParseToken =
  | { type: "open";  name: string; attrs: Record<string, unknown> }
  | { type: "close"; name: string }
  | { type: "self";  name: string; attrs: Record<string, unknown> }
  | { type: "text";  content: string };

/** Block types that use [open]…[/close] syntax instead of self-closing. */
const CONTAINER_BLOCKS = new Set(["columns", "column", "html"]);


function tokenise(text: string): ParseToken[] {
  const tokens: ParseToken[] = [];
  // Since encodeAttrValue escapes [ and ], the only ] that can appear
  // outside a quoted attr value is the shortcode-closing ].
  // So [^\]]* safely matches the entire attr string.
  const re = /\[(\/?[a-z][a-z0-9_-]*)([^\]]*)\]/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      const chunk = text.slice(lastIndex, m.index).trim();
      if (chunk) tokens.push({ type: "text", content: chunk });
    }

    const rawName = m[1];
    if (rawName.startsWith("/")) {
      tokens.push({ type: "close", name: rawName.slice(1).toLowerCase() });
    } else {
      const name = rawName.toLowerCase();
      const attrs = parseAttrsStr(m[2]);
      tokens.push(CONTAINER_BLOCKS.has(name)
        ? { type: "open", name, attrs }
        : { type: "self", name, attrs });
    }
    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    const chunk = text.slice(lastIndex).trim();
    if (chunk) tokens.push({ type: "text", content: chunk });
  }
  return tokens;
}

// ── Block tree builder ───────────────────────────────────────────────────────

function buildBlocks(
  tokens: ParseToken[],
  start: number,
  stopAt?: string,
  counter: { n: number } = { n: 0 },
): { blocks: EditorBlock[]; pos: number } {
  const blocks: EditorBlock[] = [];
  let pos = start;

  while (pos < tokens.length) {
    const tok = tokens[pos];

    if (tok.type === "close") {
      if (tok.name === stopAt) return { blocks, pos: pos + 1 };
      pos++; continue;
    }

    if (tok.type === "open" && tok.name === "html") {
      pos++;
      // Collect everything until [/html] as raw content
      const start = pos;
      while (pos < tokens.length) {
        const t = tokens[pos];
        if (t.type === "close" && t.name === "html") { pos++; break; }
        pos++;
      }
      // Reconstruct the raw text between [html] and [/html] from original tokens
      const innerTokens = tokens.slice(start, pos - 1);
      const content = innerTokens.map((t) => {
        if (t.type === "text") return t.content;
        if (t.type === "self") {
          const attrs = Object.entries(t.attrs).map(([k, v]) => serializeAttr(k, v)).join(" ");
          return attrs ? `[${t.name} ${attrs}]` : `[${t.name}]`;
        }
        if (t.type === "open") return `[${t.name}]`;
        if (t.type === "close") return `[/${t.name}]`;
        return "";
      }).join("");
      blocks.push({ id: `sc-${counter.n++}`, type: "html", data: { content } });
      continue;
    }

    if (tok.type === "open" && tok.name === "columns") {
      pos++;
      const cols: Array<{ blocks: EditorBlock[]; width?: string }> = [];
      let responsive: Record<string, Record<string, unknown>> | undefined = undefined;

      // Read responsive attribute from columns block
      if (tok.attrs.responsive) {
        try {
          responsive = typeof tok.attrs.responsive === "string"
            ? JSON.parse(tok.attrs.responsive as string)
            : (tok.attrs.responsive as Record<string, Record<string, unknown>>);
        } catch {}
      }

      while (pos < tokens.length) {
        const t = tokens[pos];
        if (t.type === "close" && t.name === "columns") { pos++; break; }
        if (t.type === "open" && t.name === "column") {
          const width = t.attrs.width as string | undefined;
          // Responsive width overrides for this column
          let colResponsive: Record<string, string> = {};
          Object.keys(t.attrs).forEach((k) => {
            if (/^width_(desktop|tablet|mobile)$/.test(k)) {
              const bp = k.split("_")[1];
              colResponsive[bp] = t.attrs[k] as string;
            }
          });
          pos++;
          const inner = buildBlocks(tokens, pos, "column", counter);
          cols.push({ ...(width ? { width } : {}), ...(Object.keys(colResponsive).length ? { responsive: colResponsive } : {}), blocks: inner.blocks });
          pos = inner.pos;
        } else { pos++; }
      }

      const data: any = { cols };
      if (responsive) data.responsive = responsive;
      blocks.push({ id: `sc-${counter.n++}`, type: "columns", data });
      continue;
    }

    if (tok.type === "self") {
      blocks.push({ id: `sc-${counter.n++}`, type: tok.name, data: tok.attrs });
      pos++; continue;
    }

    if (tok.type === "text") {
      // Any raw text containing HTML tags becomes an html block; pure text is ignored
      if (tok.content.includes("<")) {
        blocks.push({ id: `sc-${counter.n++}`, type: "html", data: { content: tok.content } });
      }
      pos++; continue;
    }

    pos++;
  }

  return { blocks, pos };
}

// ── Serialiser ───────────────────────────────────────────────────────────────

const INDENT = "  "; // two spaces per level

function blockToShortcode(type: string, data: Record<string, unknown>, depth = 0): string {
  const pad = INDENT.repeat(depth);
  const childPad = INDENT.repeat(depth + 1);

  // html blocks → [html]content[/html] container
  if (type === "html") {
    const content = (data.content as string) ?? "";
    return `${pad}[html]\n${content}\n${pad}[/html]`;
  }

  if (type === "columns") {
    const cols = (data.cols as Array<{ blocks: EditorBlock[]; width?: string; responsive?: Record<string, string> }>) ?? [];
    // Serialize responsive attribute if present
    const responsive = data.responsive ? ` ${serializeAttr("responsive", data.responsive)}` : "";
    const inner = cols.map((col, i) => {
      let widthAttr = col.width ? ` ${serializeAttr("width", col.width)}` : "";
      // Serialize per-column responsive widths as width_desktop, width_tablet, width_mobile
      let responsiveAttrs = "";
      if (col.responsive) {
        Object.entries(col.responsive).forEach(([bp, val]) => {
          if (val) responsiveAttrs += ` width_${bp}='${val}'`;
        });
      }
      const colInner = blocksToShortcodes(col.blocks ?? [], depth + 2);
      return colInner
        ? `${childPad}[column${widthAttr}${responsiveAttrs}]\n${colInner}\n${childPad}[/column]`
        : `${childPad}[column${widthAttr}${responsiveAttrs}][/column]`;
    }).join("\n");
    return `${pad}[columns${responsive}]\n${inner}\n${pad}[/columns]`;
  }

  // All properties — scalar and complex — are serialised
  const attrs = Object.entries(data)
    .filter(([k]) => k !== "id")
    .map(([k, v]) => serializeAttr(k, v))
    .join(" ");
  return attrs ? `${pad}[${type} ${attrs}]` : `${pad}[${type}]`;
}

// ── Public API ───────────────────────────────────────────────────────────────

export function blocksToShortcodes(blocks: EditorBlock[], depth = 0): string {
  return blocks.map((b) => blockToShortcode(b.type, b.data as Record<string, unknown>, depth)).join(depth === 0 ? "\n\n" : "\n");
}

export function shortcodesToBlocks(text: string): EditorBlock[] {
  return buildBlocks(tokenise(text), 0).blocks;
}

export { tokenise, buildBlocks };
export type { ParseToken };
