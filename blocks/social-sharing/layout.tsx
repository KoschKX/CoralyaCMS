"use client";

import React, { useEffect, useState } from "react";
import type { BlockLayoutProps } from "@/lib/block-types";
import { NETWORK_META } from "./icons";
import type { NetworkKey, CustomNetworkDef } from "./icons";
import "./styles.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeColor(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const val = raw.trim();
  if (
    /^(#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-z]+)$/i.test(
      val,
    )
  )
    return val;
  return undefined;
}

function sanitizeSize(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const val = raw.trim();
  if (/^\d+(\.\d+)?(px|em|rem|%)$/.test(val)) return val;
  return undefined;
}

/** Build the share URL for a built-in network. */
function buildShareUrl(
  network: NetworkKey,
  pageUrl: string,
  pageTitle: string,
  description: string,
): string {
  const u = encodeURIComponent(pageUrl);
  const t = encodeURIComponent(pageTitle);
  const d = encodeURIComponent(description);

  switch (network) {
    case "facebook":
      return `https://www.facebook.com/sharer.php?u=${u}&t=${t}`;
    case "twitter":
      return `https://x.com/intent/post?text=${t}&url=${u}`;
    case "bluesky":
      return `https://bsky.app/intent/compose?text=${t}%20${u}%20${d}`;
    case "reddit":
      return `https://reddit.com/submit?url=${u}&title=${t}`;
    case "linkedin":
      return `https://www.linkedin.com/shareArticle?mini=true&url=${u}&title=${t}&summary=${d}`;
    case "mastodon":
      return `https://mastodonshare.com/?url=${u}&text=${t}%20${d}`;
    case "whatsapp":
      return `https://api.whatsapp.com/send?text=${u}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
    case "threads":
      return `https://www.threads.net/intent/post?url=${u}&text=${t}%20${d}`;
    case "tumblr":
      return `https://www.tumblr.com/share/link?url=${u}&name=${t}&description=${d}`;
    case "pinterest":
      return `https://pinterest.com/pin/create/button/?url=${u}&description=${d}`;
    case "vk":
      return `https://vkontakte.ru/share.php?url=${u}&title=${t}&description=${d}`;
    case "xing":
      return `https://www.xing.com/social_plugins/share/new?sc_p=xing-share&h=1&url=${u}`;
    case "email":
      return `mailto:?subject=${t}&body=${u}`;
    case "copy_link":
      return "#";
    default:
      return "#";
  }
}

/** Expand {URL}, {TITLE}, {DESC} placeholders in a custom share URL template. */
function buildCustomShareUrl(
  template: string,
  pageUrl: string,
  pageTitle: string,
  description: string,
): string {
  return template
    .replace(/\{URL\}/g,   encodeURIComponent(pageUrl))
    .replace(/\{TITLE\}/g, encodeURIComponent(pageTitle))
    .replace(/\{DESC\}/g,  encodeURIComponent(description));
}

// ── Icon SVG ──────────────────────────────────────────────────────────────────

function NetworkIcon({
  network,
  size,
}: {
  network: NetworkKey;
  size: string;
}) {
  const meta = NETWORK_META[network];
  const isStroke = meta.renderAs === "stroke";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={isStroke ? "none" : "currentColor"}
      stroke={isStroke ? "currentColor" : "none"}
      strokeWidth={isStroke ? "2" : undefined}
      strokeLinecap={isStroke ? "round" : undefined}
      strokeLinejoin={isStroke ? "round" : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <path d={meta.svgPath} />
    </svg>
  );
}

// ── Custom network icon ───────────────────────────────────────────────────────

/**
 * Initials-circle fallback icon. Always renders a filled circle + white text
 * so the icon is visible regardless of the surrounding background.
 * Pass `circleFill="transparent"` when the icon sits inside a coloured box.
 */
function CustomInitialsIcon({
  label,
  size,
  circleFill,
}: {
  label: string;
  size: string;
  circleFill: string;
}) {
  const initials = label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="11" fill={circleFill} />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="white"
      >
        {initials || "?"}
      </text>
    </svg>
  );
}

/** Renders the custom network's logo image if one is set, otherwise the initials circle. */
function CustomIcon({
  custom,
  size,
  circleFill,
}: {
  custom: CustomNetworkDef;
  size: string;
  circleFill: string;
}) {
  if (custom.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={custom.logoUrl}
        alt={custom.label}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      />
    );
  }
  return <CustomInitialsIcon label={custom.label} size={size} circleFill={circleFill} />;
}

// ── Custom share button ────────────────────────────────────────────────────────

function CustomShareButton({
  custom,
  shareUrl,
  shareTitle,
  description,
  iconSize,
  iconsBoxed,
  iconsBoxedRadius,
  colorType,
  iconColor,
  boxColor,
}: {
  custom: CustomNetworkDef;
  shareUrl: string;
  shareTitle: string;
  description: string;
  iconSize: string;
  iconsBoxed: boolean;
  iconsBoxedRadius: string;
  colorType: string;
  iconColor: string;
  boxColor: string;
}) {
  const resolvedIconColor =
    colorType === "brand"
      ? iconsBoxed
        ? "#ffffff"
        : custom.color
      : sanitizeColor(iconColor) ?? custom.color;

  const resolvedBoxColor =
    colorType === "brand"
      ? iconsBoxed
        ? custom.color
        : "transparent"
      : sanitizeColor(boxColor) ?? "transparent";

  const buttonStyle: React.CSSProperties = {
    color: resolvedIconColor,
    fontSize: iconSize,
  };
  if (iconsBoxed) {
    buttonStyle.backgroundColor = resolvedBoxColor;
    buttonStyle.borderColor = resolvedBoxColor;
    if (iconsBoxedRadius)
      buttonStyle.borderRadius =
        iconsBoxedRadius === "round" ? "50%" : iconsBoxedRadius;
  }

  const href = buildCustomShareUrl(
    custom.shareUrlTemplate,
    shareUrl,
    shareTitle,
    description,
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`sshare-icon${iconsBoxed ? " sshare-icon--boxed" : ""}`}
      style={buttonStyle}
      title={custom.label}
      aria-label={`Share on ${custom.label}`}
    >
      <CustomIcon
        custom={custom}
        size={iconSize}
        // When boxed the box provides the background; inside it the circle would
        // be the same color as the box, so keep it transparent.
        // When unboxed (brand mode) the circle IS the icon — fill it with the brand color.
        circleFill={iconsBoxed ? "rgba(255,255,255,0.25)" : custom.color}
      />
    </a>
  );
}

// ── Share button ──────────────────────────────────────────────────────────────

function ShareButton({
  network,
  shareUrl,
  shareTitle,
  description,
  iconSize,
  iconsBoxed,
  iconsBoxedRadius,
  colorType,
  iconColor,
  boxColor,
  onCopyLink,
  copied,
}: {
  network: NetworkKey;
  shareUrl: string;
  shareTitle: string;
  description: string;
  iconSize: string;
  iconsBoxed: boolean;
  iconsBoxedRadius: string;
  colorType: string;
  iconColor: string;
  boxColor: string;
  onCopyLink: () => void;
  copied: boolean;
}) {
  const meta = NETWORK_META[network];
  const isCopyLink = network === "copy_link";
  const isEmail = network === "email";

  const resolvedIconColor =
    colorType === "brand"
      ? iconsBoxed
        ? "#ffffff"
        : meta.brandColor
      : sanitizeColor(iconColor) ?? meta.brandColor;

  const resolvedBoxColor =
    colorType === "brand"
      ? iconsBoxed
        ? meta.brandColor
        : "transparent"
      : sanitizeColor(boxColor) ?? "transparent";

  const buttonStyle: React.CSSProperties = {
    color: resolvedIconColor,
    fontSize: iconSize,
  };

  if (iconsBoxed) {
    buttonStyle.backgroundColor = resolvedBoxColor;
    buttonStyle.borderColor = resolvedBoxColor;
    if (iconsBoxedRadius) {
      buttonStyle.borderRadius =
        iconsBoxedRadius === "round" ? "50%" : iconsBoxedRadius;
    }
  }

  const title = isCopyLink && copied ? "Copied!" : meta.label;

  if (isCopyLink) {
    return (
      <button
        type="button"
        className={`sshare-icon${iconsBoxed ? " sshare-icon--boxed" : ""}`}
        style={buttonStyle}
        onClick={onCopyLink}
        title={title}
        aria-label={title}
      >
        <NetworkIcon network={network} size={iconSize} />
      </button>
    );
  }

  const href = buildShareUrl(network, shareUrl, shareTitle, description);
  const target = isEmail ? "_self" : "_blank";
  const rel = isEmail ? undefined : "noopener noreferrer";

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={`sshare-icon${iconsBoxed ? " sshare-icon--boxed" : ""}`}
      style={buttonStyle}
      title={meta.label}
      aria-label={`Share on ${meta.label}`}
    >
      <NetworkIcon network={network} size={iconSize} />
    </a>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function SocialSharingLayout({
  data,
  blockId,
}: BlockLayoutProps) {
  const tagline = (data.tagline as string) || "";
  const taglineTag = (["h1","h2","h3","h4","h5","h6"] as const).includes(
    data.taglineTag as never,
  )
    ? (data.taglineTag as "h1"|"h2"|"h3"|"h4"|"h5"|"h6")
    : "h4";
  const taglinePlacement =
    (data.taglinePlacement as string) === "after" ? "after" : "before";
  const networks = Array.isArray(data.networks) ? (data.networks as string[]) : [];
  const customNetworks: CustomNetworkDef[] = Array.isArray(data.customNetworks)
    ? (data.customNetworks as CustomNetworkDef[])
    : [];
  const iconSize = sanitizeSize(data.iconSize) ?? "20px";
  const iconsBoxed = Boolean(data.iconsBoxed);
  const iconsBoxedRadius = (data.iconsBoxedRadius as string) || "4px";
  const colorType = (data.colorType as string) === "custom" ? "custom" : "brand";
  const iconColor = (data.iconColor as string) || "";
  const boxColor = (data.boxColor as string) || "";
  const bgColor = sanitizeColor(data.bgColor);
  const alignment = (data.alignment as string) || "flex-start";

  const [shareUrl, setShareUrl] = useState((data.url as string) || "");
  const [shareTitle, setShareTitle] = useState((data.title as string) || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareUrl) setShareUrl(window.location.href);
    if (!shareTitle) setShareTitle(document.title);
  }, [shareUrl, shareTitle]);

  const description = (data.description as string) || "";

  function handleCopyLink() {
    const urlToCopy = (data.url as string) || window.location.href;
    navigator.clipboard.writeText(urlToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Build a lookup for custom networks by id
  const customById = Object.fromEntries(customNetworks.map((c) => [c.id, c]));

  const containerStyle: React.CSSProperties = {};
  if (bgColor) containerStyle.backgroundColor = bgColor;

  const TagName = taglineTag;

  const sharedButtonProps = {
    shareUrl,
    shareTitle,
    description,
    iconSize,
    iconsBoxed,
    iconsBoxedRadius,
    colorType,
    iconColor,
    boxColor,
  };

  return (
    <div
      className="sshare-box"
      style={containerStyle}
      data-block-id={blockId}
    >
      {tagline && taglinePlacement === "before" && (
        <TagName className="sshare-tagline">{tagline}</TagName>
      )}
      <div className="sshare-icons" style={{ justifyContent: alignment }}>
        {networks.map((key) => {
          // Custom network
          if (!(key in NETWORK_META)) {
            const custom = customById[key];
            if (!custom) return null;
            return (
              <CustomShareButton
                key={key}
                custom={custom}
                {...sharedButtonProps}
              />
            );
          }
          // Built-in network
          return (
            <ShareButton
              key={key}
              network={key as NetworkKey}
              {...sharedButtonProps}
              onCopyLink={handleCopyLink}
              copied={copied}
            />
          );
        })}
      </div>
      {tagline && taglinePlacement === "after" && (
        <TagName className="sshare-tagline">{tagline}</TagName>
      )}
    </div>
  );
}
