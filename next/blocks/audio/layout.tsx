"use client";

import type { BlockLayoutProps } from "@/lib/block-types";
import { useBlockT } from "@/components/editor/BlockLocaleContext";

// ── Placeholder ───────────────────────────────────────────────────────────────

function AudioPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ padding: "2rem 1rem", background: "#f4f4f5", borderRadius: "0.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#a1a1aa" }}>
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
      <span style={{ fontSize: "0.8rem" }}>{label}</span>
    </div>
  );
}

// ── Hosted <audio> ────────────────────────────────────────────────────────────

function HostedAudio({ data }: { data: Record<string, unknown> }) {
  const t = useBlockT("audio");
  const src = String(data.src ?? "").trim();
  if (!src) return <AudioPlaceholder label={t("placeholder.hosted", "Add an audio file URL in the panel")} />;

  const borderRadius = String(data.borderRadius ?? "").trim() || undefined;

  return (
    <audio
      controls={data.controls !== false}
      autoPlay={data.autoplay === true}
      loop={data.loop === true}
      preload={(data.preload as "auto" | "metadata" | "none") ?? "metadata"}
      aria-label={String(data.title ?? "") || undefined}
      style={{ display: "block", width: "100%", borderRadius }}
    >
      <source src={src} />
      Your browser does not support the audio element.
    </audio>
  );
}

// ── SoundCloud embed ──────────────────────────────────────────────────────────

function SoundCloudEmbed({ data }: { data: Record<string, unknown> }) {
  const t = useBlockT("audio");
  const rawUrl = String(data.url ?? "").trim();
  if (!rawUrl) return <AudioPlaceholder label={t("placeholder.soundcloud", "Enter a SoundCloud URL in the panel")} />;

  const params = new URLSearchParams({
    url:           rawUrl,
    auto_play:     data.autoplay     === true  ? "true" : "false",
    hide_related:  data.hideRelated  !== false  ? "true" : "false",
    show_comments: data.showComments === true   ? "true" : "false",
    show_user:     data.showUser     !== false  ? "true" : "false",
    show_reposts:  data.showReposts  === true   ? "true" : "false",
    show_teaser:   data.showTeaser   === true   ? "true" : "false",
    visual:        data.visual       === true   ? "true" : "false",
  });

  const color = String(data.color ?? "").trim().replace(/^#/, "");
  if (color) params.set("color", color);

  const src    = `https://w.soundcloud.com/player/?${params.toString()}`;
  const height = data.visual === true ? 300 : 166;
  const title  = String(data.title ?? "") || t("player.title", "SoundCloud player");

  return (
    <iframe
      title={title}
      width="100%"
      height={height}
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      loading="lazy"
      src={src}
      style={{ display: "block", border: "none" }}
    />
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AudioLayout({ data }: BlockLayoutProps) {
  const sourceType   = String(data.sourceType ?? "hosted");
  const maxWidth     = String(data.maxWidth   ?? "").trim() || "100%";
  const borderRadius = String(data.borderRadius ?? "").trim() || undefined;

  const alignStyle: React.CSSProperties =
    data.alignment === "left"  ? { marginRight: "auto" } :
    data.alignment === "right" ? { marginLeft:  "auto" } :
    { marginLeft: "auto", marginRight: "auto" };

  return (
    <div style={{ maxWidth, width: "100%", ...alignStyle, borderRadius, overflow: borderRadius ? "hidden" : undefined }}>
      {sourceType === "hosted"     && <HostedAudio     data={data} />}
      {sourceType === "soundcloud" && <SoundCloudEmbed data={data} />}
    </div>
  );
}
