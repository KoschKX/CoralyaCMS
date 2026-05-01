import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";

/**
 * Only allow http and https image URLs to prevent javascript: / data: injections.
 * Returns null when the URL is absent, empty, or uses a disallowed scheme.
 */
function sanitizeImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const val = raw.trim();
  // Allow relative paths starting with / (e.g. /media/file.png)
  if (val.startsWith("/")) return val;
  try {
    const url = new URL(val);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function alignToClass(align: unknown): string {
  if (align === "center") return "mx-auto";
  if (align === "right") return "ml-auto";
  return "";
}

export default function ImageLayout({ data, blockId }: BlockLayoutProps) {
  const src = sanitizeImageUrl(data.src);
  const alt = typeof data.alt === "string" ? data.alt : "";
  const caption = typeof data.caption === "string" ? data.caption : "";
  const alignClass = alignToClass(data.align);

  if (!src) {
    return (
      <figure
        data-block-id={blockId}
        className={`block-image block-${blockId} w-full`}
      >
        <div className="flex h-40 w-full items-center justify-center rounded-lg bg-zinc-100">
          <span className="text-sm text-zinc-400">No image</span>
        </div>
      </figure>
    );
  }

  return (
    <figure
      data-block-id={blockId}
      className={`block-image block-${blockId} w-full`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`rounded-lg ${alignClass}`}
      />
      {caption && (
        <figcaption className={alignClass}>{caption}</figcaption>
      )}
    </figure>
  );
}
