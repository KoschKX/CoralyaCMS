"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import "./styles.css";
import type { BlockLayoutProps } from "@/lib/block-types";
import { useBlockT } from "@/components/editor/BlockLocaleContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimeLeft {
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeColor(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const v = raw.trim();
  if (/^(#[0-9a-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-z]+)$/i.test(v))
    return v;
  return undefined;
}

function parseTarget(raw: unknown): Date | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function calcTimeLeft(target: Date, showWeeks: boolean): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const totalSec = Math.floor(diff / 1000);
  const seconds  = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const minutes  = totalMin % 60;
  const totalHrs = Math.floor(totalMin / 60);
  const hours    = totalHrs % 24;
  const totalDay = Math.floor(totalHrs / 24);
  const weeks    = Math.floor(totalDay / 7);
  const days     = showWeeks ? totalDay % 7 : totalDay;
  return { weeks, days, hours, minutes, seconds, expired: false };
}

// ── Digit box ─────────────────────────────────────────────────────────────────

function DigitBox({
  value,
  label,
  labelPosition,
  placeholder,
  style,
}: {
  value: number;
  label: string;
  labelPosition: "above" | "below";
  placeholder: boolean;
  style?: React.CSSProperties;
}) {
  const digit = placeholder ? "--" : String(value).padStart(2, "0");
  return (
    <div className="coralya-countdown-box" style={style}>
      {labelPosition === "above" && (
        <span className="coralya-countdown-label">{label}</span>
      )}
      <span
        className={
          "coralya-countdown-digit" +
          (placeholder ? " coralya-countdown-digit--placeholder" : "")
        }
      >
        {digit}
      </span>
      {labelPosition !== "above" && (
        <span className="coralya-countdown-label">{label}</span>
      )}
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function CountdownLayout({ data }: BlockLayoutProps) {
  const t = useBlockT("countdown");
  const targetDate    = parseTarget(data.targetDate);
  const showWeeks     = Boolean(data.showWeeks);
  const labelPosition = ((data.labelPosition as string) || "below") as "above" | "below";
  const alignment     = (data.alignment as string) || "center";
  const heading       = (data.heading    as string) || "";
  const subheading    = (data.subheading as string) || "";
  const linkText      = (data.linkText   as string) || "";
  const linkUrl       = (data.linkUrl    as string) || "";
  const linkTarget    = (data.linkTarget as string) || "_self";
  const expiredText   = (data.expiredText as string) || t("expired", "Event has ended");

  // null = not yet hydrated (avoid SSR / client mismatch for a real-time value)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft({ weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
      return;
    }

    const tick = () => {
      const next = calcTimeLeft(targetDate, showWeeks);
      setTimeLeft(next);
      if (next.expired && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    tick(); // immediate first render
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // targetDate object identity changes on every render; use the underlying ms value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate?.getTime(), showWeeks]);

  // Build CSS variable map
  const bgColor     = sanitizeColor(data.counterBgColor);
  const textColor   = sanitizeColor(data.counterTextColor);
  const labelColor  = sanitizeColor(data.labelColor);
  const borderRadius = (data.borderRadius as string) || "6px";

  const cssVars: Record<string, string> = {};
  if (bgColor)      cssVars["--cd-bg"]     = bgColor;
  if (textColor)    cssVars["--cd-digit"]  = textColor;
  if (labelColor)   cssVars["--cd-label"]  = labelColor;
  if (borderRadius) cssVars["--cd-radius"] = borderRadius;
  const boxStyle = cssVars as React.CSSProperties;

  // Units to display
  const units: { value: number; label: string }[] = [
    ...(showWeeks ? [{ value: timeLeft?.weeks ?? 0, label: t("unit.weeks", "Weeks") }] : []),
    { value: timeLeft?.days    ?? 0, label: t("unit.days", "Days") },
    { value: timeLeft?.hours   ?? 0, label: t("unit.hours", "Hours") },
    { value: timeLeft?.minutes ?? 0, label: t("unit.minutes", "Minutes") },
    { value: timeLeft?.seconds ?? 0, label: t("unit.seconds", "Seconds") },
  ];

  const alignClass =
    alignment === "right" ? "coralya-countdown--right"
    : alignment === "left" ? "coralya-countdown--left"
    : "coralya-countdown--center";

  const isExpired    = timeLeft?.expired ?? false;
  const isPlaceholder = timeLeft === null;

  return (
    <div className={`coralya-countdown ${alignClass}`}>
      {/* Heading / subheading */}
      {(heading || subheading) && (
        <div className="coralya-countdown-header">
          {subheading && (
            <p className="coralya-countdown-subheading">{subheading}</p>
          )}
          {heading && (
            <h3 className="coralya-countdown-heading">{heading}</h3>
          )}
        </div>
      )}

      {/* Timer or expired message */}
      {isExpired ? (
        <p className="coralya-countdown-expired">{expiredText}</p>
      ) : (
        <div className="coralya-countdown-units">
          {units.map((u, i) => (
            <div key={u.label} style={{ display: "contents" }}>
              <DigitBox
                value={u.value}
                label={u.label}
                labelPosition={labelPosition}
                placeholder={isPlaceholder}
                style={boxStyle}
              />
            </div>
          ))}
        </div>
      )}

      {/* Optional CTA link */}
      {linkUrl && linkText && (
        <div className="coralya-countdown-link-wrap">
          <a
            href={linkUrl}
            target={linkTarget}
            rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
            className="coralya-countdown-link"
          >
            {linkText}
          </a>
        </div>
      )}
    </div>
  );
}
