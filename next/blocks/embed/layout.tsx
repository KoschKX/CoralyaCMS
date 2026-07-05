import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";
import { tBlock } from "@/lib/i18n/block-messages";

/**
 * Strip <script> tags (and their content) from raw embed HTML.
 * We keep everything else — iframes, blockquotes, divs — as-is.
 * This is intentionally minimal: the editor is a trusted admin user.
 */
function sanitize(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, "");
}

export default function EmbedLayout({ data, blockId, locale }: BlockLayoutProps & { blockId?: string }) {
  // Support both new `code` field and legacy `embed` URL field
  const raw = String(data.code ?? data.embed ?? "").trim();

  const maxWidth    = String(data.maxWidth ?? "").trim() || "100%";
  const alignStyle: React.CSSProperties =
    data.alignment === "left"  ? { marginRight: "auto" } :
    data.alignment === "right" ? { marginLeft:  "auto" } :
    { marginLeft: "auto", marginRight: "auto" };

  if (!raw) {
    return (
      <div
        data-block-id={blockId}
        className="block-embed w-full overflow-hidden rounded-lg bg-zinc-100 flex items-center justify-center"
        style={{ minHeight: "120px" }}
        aria-label={tBlock("embed", locale ?? "en", "empty", "Empty embed")}
      />
    );
  }

  const html = sanitize(raw);

  return (
    <div
      data-block-id={blockId}
      className="block-embed"
      style={{ maxWidth, width: "100%", ...alignStyle }}
      // dangerouslySetInnerHTML is intentional: the editor is a trusted admin
      // user pasting embed snippets (YouTube, Vimeo, Maps, etc.).
      // Script tags are stripped above as a minimal safeguard.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
