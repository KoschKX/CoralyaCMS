"use client";

import type { BlockLayoutProps } from "@/lib/block-types";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract the 11-character YouTube video ID from a URL or bare ID string. */
function extractVideoId(input: string): string {
  const s = input.trim();
  if (!s) return "";
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/ytscreeningroom\?v=|\/shorts\/))([\w-]{11})/i
  );
  return m ? m[1] : s;
}

const ASPECT_PAD: Record<string, string> = {
  "16:9": "56.25%",
  "4:3":  "75%",
  "1:1":  "100%",
  "9:16": "177.78%",
};

// ── Layout ────────────────────────────────────────────────────────────────────

export default function YoutubeLayout({ data }: BlockLayoutProps) {
  const id    = extractVideoId(String(data.url ?? ""));
  const pt    = ASPECT_PAD[data.aspectRatio as string] ?? ASPECT_PAD["16:9"];
  const host  = data.privacy ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";
  const title = String(data.title || "YouTube video player");

  // Build embed URL params
  const params = new URLSearchParams({ wmode: "transparent" });
  if (data.autoplay)                  params.set("autoplay", "1");
  if (data.mute || data.autoplay)     params.set("mute",     "1"); // autoplay requires mute per browser policy
  if (data.loop && id)                { params.set("loop", "1"); params.set("playlist", id); }
  if (data.controls === false)        params.set("controls", "0");
  if (data.startTime)                 params.set("start", String(data.startTime));
  if (data.endTime)                   params.set("end",   String(data.endTime));

  const src = id ? `${host}/embed/${id}?${params.toString()}` : "";

  // Alignment wrapper
  const alignStyle: React.CSSProperties =
    data.alignment === "left"  ? { marginRight: "auto" } :
    data.alignment === "right" ? { marginLeft:  "auto" } :
    { marginLeft: "auto", marginRight: "auto" };

  const maxWidth = data.maxWidth ? String(data.maxWidth) : "100%";

  return (
    <div style={{ maxWidth, width: "100%", ...alignStyle }}>
      {id ? (
        <div style={{ position: "relative", paddingTop: pt, overflow: "hidden", borderRadius: "0.25rem" }}>
          <iframe
            title={title}
            src={src}
            allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          />
        </div>
      ) : (
        /* Empty-state placeholder in the editor */
        <div style={{ position: "relative", paddingTop: pt, background: "#f4f4f5", borderRadius: "0.5rem" }}>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "0.5rem", color: "#a1a1aa",
          }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="5" width="20" height="14" rx="3.5"/>
              <polygon points="10,9 10,15 16,12" fill="currentColor" stroke="none"/>
            </svg>
            <span style={{ fontSize: "0.8rem" }}>Enter a YouTube URL in the panel</span>
          </div>
        </div>
      )}
    </div>
  );
}
