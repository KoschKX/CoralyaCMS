"use client";

import type { BlockLayoutProps } from "@/lib/block-types";
import { useBlockT } from "@/components/editor/BlockLocaleContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractYouTubeId(input: string): string {
  const s = input.trim();
  if (!s) return "";
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/ytscreeningroom\?v=|\/shorts\/))([\w-]{11})/i
  );
  return m ? m[1] : s;
}

function extractVimeoId(input: string): string {
  const s = input.trim();
  if (!s) return "";
  if (/^\d+$/.test(s)) return s;
  const m = s.match(/vimeo\.com\/(?:video\/|channels\/\S+\/|groups\/\S+\/videos\/)?(\d+)/i);
  return m ? m[1] : s;
}

const ASPECT_PAD: Record<string, string> = {
  "16:9": "56.25%",
  "4:3":  "75%",
  "1:1":  "100%",
  "9:16": "177.78%",
};

// ── Sub-renderers ─────────────────────────────────────────────────────────────

function YoutubeEmbed({ data }: { data: Record<string, unknown> }) {
  const t    = useBlockT("video");
  const id   = extractYouTubeId(String(data.url ?? ""));
  const pt   = ASPECT_PAD[data.aspectRatio as string] ?? ASPECT_PAD["16:9"];
  const host = data.privacy ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";

  const params = new URLSearchParams({ wmode: "transparent" });
  if (data.autoplay)               params.set("autoplay", "1");
  if (data.mute || data.autoplay)  params.set("mute",     "1");
  if (data.loop && id)             { params.set("loop", "1"); params.set("playlist", id); }
  if (data.controls === false)     params.set("controls", "0");
  if (data.startTime)              params.set("start", String(data.startTime));
  if (data.endTime)                params.set("end",   String(data.endTime));

  const src   = id ? `${host}/embed/${id}?${params.toString()}` : "";
  const title = String(data.title || t("youtube.title", "YouTube video player"));

  if (!id) return <EmbedPlaceholder label={t("youtube.placeholder", "Enter a YouTube URL in the panel")} />;
  return (
    <div style={{ position: "relative", paddingTop: pt, overflow: "hidden", borderRadius: "0.25rem" }}>
      <iframe
        title={title}
        src={src}
        allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        loading="lazy"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}

function VimeoEmbed({ data }: { data: Record<string, unknown> }) {
  const t  = useBlockT("video");
  const id = extractVimeoId(String(data.url ?? ""));
  const pt = ASPECT_PAD[data.aspectRatio as string] ?? ASPECT_PAD["16:9"];

  const params = new URLSearchParams({ dnt: "1" });
  if (data.autoplay)           params.set("autoplay", "1");
  if (data.mute || data.autoplay) params.set("muted", "1");
  if (data.loop)               params.set("loop",     "1");
  if (data.controls === false) params.set("controls", "0");

  const src   = id ? `https://player.vimeo.com/video/${id}?${params.toString()}` : "";
  const title = String(data.title || t("vimeo.title", "Vimeo video player"));

  if (!id) return <EmbedPlaceholder label={t("vimeo.placeholder", "Enter a Vimeo URL in the panel")} />;
  return (
    <div style={{ position: "relative", paddingTop: pt, overflow: "hidden", borderRadius: "0.25rem" }}>
      <iframe
        title={title}
        src={src}
        allow="autoplay; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}

function HostedVideo({ data }: { data: Record<string, unknown> }) {
  const mp4  = String(data.mp4  ?? "").trim();
  const webm = String(data.webm ?? "").trim();
  if (!mp4 && !webm) return <EmbedPlaceholder label="Add a video URL in the panel" />;

  let fragment = "";
  if (data.startTime || data.endTime) {
    fragment = "#t=" + (data.startTime ? String(data.startTime) : "0");
    if (data.endTime) fragment += "," + String(data.endTime);
  }

  const borderRadius = String(data.borderRadius ?? "").trim() || undefined;
  const overlayColor = String(data.overlayColor ?? "").trim();

  return (
    <div style={{ position: "relative", borderRadius, overflow: borderRadius ? "hidden" : undefined }}>
      <video
        width="100%"
        style={{ display: "block", objectFit: "cover" }}
        playsInline
        autoPlay={data.autoplay === true}
        muted={data.mute === true || data.autoplay === true}
        loop={data.loop === true}
        controls={data.controls !== false}
        preload={(data.preload as "auto" | "metadata" | "none" | undefined) ?? "metadata"}
        poster={String(data.poster ?? "") || undefined}
      >
        {webm && <source src={webm + fragment} type="video/webm" />}
        {mp4  && <source src={mp4  + fragment} type="video/mp4"  />}
        {"Sorry, your browser doesn't support embedded videos."}
      </video>
      {overlayColor && (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundColor: overlayColor, pointerEvents: "none" }} />
      )}
    </div>
  );
}

function EmbedPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ padding: "3rem 1rem", background: "#f4f4f5", borderRadius: "0.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#a1a1aa" }}>
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="1.5"/>
        <rect x="5"  y="7"  width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
        <rect x="5"  y="11" width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
        <rect x="17" y="7"  width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
        <rect x="17" y="11" width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
        <polygon points="10,9.5 10,14.5 15,12" fill="currentColor" stroke="none"/>
      </svg>
      <span style={{ fontSize: "0.8rem" }}>{label}</span>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function VideoLayout({ data }: BlockLayoutProps) {
  const sourceType  = String(data.sourceType ?? "hosted");
  const maxWidth    = String(data.maxWidth ?? "").trim() || "100%";
  const borderRadius = sourceType !== "hosted" ? (String(data.borderRadius ?? "").trim() || undefined) : undefined;

  const alignStyle: React.CSSProperties =
    data.alignment === "left"  ? { marginRight: "auto" } :
    data.alignment === "right" ? { marginLeft:  "auto" } :
    { marginLeft: "auto", marginRight: "auto" };

  return (
    <div style={{ maxWidth, width: "100%", ...alignStyle, borderRadius, overflow: borderRadius ? "hidden" : undefined }}>
      {sourceType === "youtube" && <YoutubeEmbed data={data} />}
      {sourceType === "vimeo"   && <VimeoEmbed   data={data} />}
      {sourceType === "hosted"  && <HostedVideo   data={data} />}
    </div>
  );
}
