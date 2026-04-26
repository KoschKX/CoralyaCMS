import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";

/**
 * Only allow http and https embed URLs to prevent javascript: / data: injections.
 * Returns null when the URL is absent, empty, or uses a disallowed scheme.
 */
function sanitizeEmbedUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export default function EmbedLayout({ data, blockId }: BlockLayoutProps & { blockId: string }) {
  const src = sanitizeEmbedUrl(data.embed);
  if (!src) {
    return (
      <div
        data-block-id={blockId}
        className={`block-embed aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 flex items-center justify-center block-${blockId}`}
        aria-label="Empty embed"
      />
    );
  }
  return (
    <div data-block-id={blockId} className={`block-embed aspect-video w-full overflow-hidden rounded-lg block-${blockId}`}>
      <iframe
        src={src}
        title="Embedded content"
        className="h-full w-full"
        // Restrict what the embedded page can do while still supporting
        // common embeds (YouTube, Google Maps, Vimeo, etc.).
        sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms"
        allow="fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
