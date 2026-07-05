"use client";

import { useEffect, useRef, useState } from "react";
import type { BlockLayoutProps } from "@/lib/block-types";
import { useBlockT } from "@/components/editor/BlockLocaleContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TickerItem {
  id: string;
  text: string;
  url: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TickerLink({ item, target }: { item: TickerItem; target: string }) {
  const inner = <span>{item.text}</span>;
  if (!item.url) return <span className="awb-ticker-item">{inner}</span>;
  return (
    <a
      href={item.url}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className="awb-ticker-item awb-ticker-item--link"
    >
      {inner}
    </a>
  );
}

// ── Marquee renderer ──────────────────────────────────────────────────────────

function MarqueeTicker({ data, items, cssVars }: {
  data: Record<string, unknown>;
  items: TickerItem[];
  cssVars: React.CSSProperties;
}) {
  const speed     = Number(data.tickerSpeed ?? 75);   // px/s
  const separator = String(data.separator ?? "");
  const target    = String(data.linkTarget ?? "_self");

  // containerRef measures the visible viewport of the ticker bar.
  // firstSetRef measures one copy of the items.
  // Each copy's effective width = max(setWidth, containerWidth) so we never
  // see two copies at the same time (the "early wrap-around" bug with few items).
  const containerRef = useRef<HTMLDivElement>(null);
  const firstSetRef  = useRef<HTMLSpanElement>(null);
  const [setMinWidth, setSetMinWidth] = useState<number | null>(null);
  const [duration,    setDuration]    = useState(20);
  const t = useBlockT("news-ticker");

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const firstSet  = firstSetRef.current;
      if (!container || !firstSet) return;
      const containerW  = container.offsetWidth;
      const setW        = firstSet.scrollWidth;
      const effectiveW  = Math.max(setW, containerW);
      setSetMinWidth(effectiveW);
      setDuration(Math.max(3, effectiveW / Math.max(1, speed)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [items, speed]);

  return (
    <div ref={containerRef} className="awb-ticker-bar awb-ticker-bar--marquee" style={cssVars}>
      <div
        className="awb-ticker-track"
        style={{ animationDuration: `${duration}s` }}
        aria-live="off"
        aria-label={t("aria", "News ticker")}
      >
        {/* Two copies for seamless loop; each padded to >= container width */}
        {[0, 1].map((pass) => (
          <span
            key={pass}
            ref={pass === 0 ? firstSetRef : undefined}
            className="awb-ticker-set"
            style={setMinWidth !== null ? { minWidth: setMinWidth } : undefined}
            aria-hidden={pass === 1 ? "true" : undefined}
          >
            {items.map((item, i) => (
              <span key={item.id} className="awb-ticker-entry">
                <TickerLink item={item} target={target} />
                {separator && i < items.length - 1 && (
                  <span className="awb-ticker-separator" aria-hidden="true">{separator}</span>
                )}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Carousel renderer ─────────────────────────────────────────────────────────

function CarouselTicker({ data, items, cssVars }: {
  data: Record<string, unknown>;
  items: TickerItem[];
  cssVars: React.CSSProperties;
}) {
  const displayTime  = Number(data.carouselDisplayTime ?? 5) * 1000;
  const showArrows   = data.carouselArrows !== false;
  const target       = String(data.linkTarget ?? "_self");

  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTimer() {
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, displayTime);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => {
    if (items.length < 2) return;
    startTimer();
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, displayTime]);

  function go(dir: 1 | -1) {
    stopTimer();
    setActive((prev) => (prev + dir + items.length) % items.length);
    startTimer();
  }

  const current = items[active] ?? items[0];
  if (!current) return null;

  return (
    <div className="awb-ticker-bar awb-ticker-bar--carousel" style={cssVars}>
      {showArrows && items.length > 1 && (
        <button
          type="button"
          className="awb-ticker-btn awb-ticker-btn--prev"
          onClick={() => go(-1)}
          aria-label="Previous"
        >
          <svg viewBox="0 0 10 16" width="8" height="12" fill="currentColor" aria-hidden="true">
            <path d="M8 1L2 8l6 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div className="awb-ticker-carousel-viewport" aria-live="polite" aria-atomic="true">
        <TickerLink item={current} target={target} />
      </div>

      {showArrows && items.length > 1 && (
        <button
          type="button"
          className="awb-ticker-btn awb-ticker-btn--next"
          onClick={() => go(1)}
          aria-label="Next"
        >
          <svg viewBox="0 0 10 16" width="8" height="12" fill="currentColor" aria-hidden="true">
            <path d="M2 1l6 7-6 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Title badge ───────────────────────────────────────────────────────────────

function TickerTitle({ data }: { data: Record<string, unknown> }) {
  const text  = String(data.tickerTitle ?? "").trim();
  const shape = String(data.titleShape  ?? "none");
  if (!text) return null;

  return (
    <div
      className={[
        "awb-ticker-title",
        shape === "rounded"  ? "awb-ticker-title--rounded"  : "",
        shape === "triangle" ? "awb-ticker-title--triangle" : "",
      ].filter(Boolean).join(" ")}
      style={{
        color:           String(data.titleFontColor ?? "") || undefined,
        backgroundColor: String(data.titleBgColor   ?? "") || undefined,
      }}
    >
      {text}
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function NewsTickerLayout({ data }: BlockLayoutProps) {
  const rawItems    = Array.isArray(data.items) ? (data.items as TickerItem[]) : [];
  const items       = rawItems.filter((it) => it.text?.trim());
  const tickerType  = String(data.tickerType ?? "marquee");
  const borderRadius = String(data.borderRadius ?? "").trim() || undefined;

  const cssVars: React.CSSProperties = {
    "--awb-ticker-font-color":   String(data.tickerFontColor ?? "")  || undefined,
    "--awb-ticker-bg":           String(data.tickerBgColor   ?? "")  || undefined,
    "--awb-ticker-hover-color":  String(data.tickerHoverColor ?? "") || undefined,
    "--awb-ticker-height":       String(data.tickerHeight    ?? "")  || undefined,
    "--awb-ticker-font-size":    String(data.fontSize        ?? "")  || undefined,
    "--awb-ticker-line-height":  String(data.lineHeight      ?? "")  || undefined,
    "--awb-ticker-letter-spacing": String(data.letterSpacing ?? "") || undefined,
    "--awb-ticker-text-transform": String(data.textTransform ?? "") || undefined,
    borderRadius,
  } as React.CSSProperties;

  if (items.length === 0) {
    return (
      <div style={{ padding: "1rem", background: "#f4f4f5", borderRadius: "0.5rem", color: "#a1a1aa", fontSize: "0.8rem", textAlign: "center" }}>
        Add items in the panel to display the ticker.
      </div>
    );
  }

  return (
    <>
      <style>{`
        .awb-ticker-wrap {
          display: flex;
          align-items: stretch;
          overflow: hidden;
          font-size: var(--awb-ticker-font-size, 0.875rem);
          line-height: var(--awb-ticker-line-height, 1.5);
          letter-spacing: var(--awb-ticker-letter-spacing);
          text-transform: var(--awb-ticker-text-transform);
        }
        .awb-ticker-title {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          padding: 0 0.875rem;
          font-weight: 600;
          white-space: nowrap;
          background: #1d4ed8;
          color: #fff;
        }
        .awb-ticker-title--rounded { border-radius: 9999px; margin: 4px; }
        .awb-ticker-title--triangle {
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%);
          padding-right: 1.25rem;
        }
        .awb-ticker-bar {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          height: var(--awb-ticker-height, 2.75rem);
          background: var(--awb-ticker-bg, #f4f4f5);
          color: var(--awb-ticker-font-color, inherit);
          overflow: hidden;
        }
        /* ── Marquee ── */
        .awb-ticker-bar--marquee { cursor: default; }
        .awb-ticker-track {
          display: flex;
          white-space: nowrap;
          animation: awb-ticker-scroll linear infinite;
          will-change: transform;
        }
        .awb-ticker-bar--marquee:hover .awb-ticker-track { animation-play-state: paused; }
        @keyframes awb-ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .awb-ticker-set { display: flex; align-items: center; }
        .awb-ticker-entry { display: flex; align-items: center; }
        .awb-ticker-separator { padding: 0 0.625rem; opacity: 0.5; }
        .awb-ticker-item,
        .awb-ticker-item--link {
          padding: 0 0.625rem;
          white-space: nowrap;
          color: inherit;
          text-decoration: none;
        }
        .awb-ticker-item--link:hover { color: var(--awb-ticker-hover-color, #1d4ed8); text-decoration: underline; }
        /* ── Carousel ── */
        .awb-ticker-bar--carousel {
          gap: 0.25rem;
          padding: 0 0.25rem;
        }
        .awb-ticker-carousel-viewport {
          flex: 1;
          min-width: 0;
          padding: 0 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .awb-ticker-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.75rem;
          height: 1.75rem;
          border: 1px solid transparent;
          border-radius: 0.25rem;
          background: none;
          cursor: pointer;
          color: inherit;
          opacity: 0.6;
          transition: opacity 0.15s;
        }
        .awb-ticker-btn:hover { opacity: 1; }
      `}</style>
      <div className="awb-ticker-wrap" style={{ borderRadius }}>
        <TickerTitle data={data} />
        {tickerType === "marquee"  && <MarqueeTicker  data={data} items={items} cssVars={cssVars} />}
        {tickerType === "carousel" && <CarouselTicker data={data} items={items} cssVars={cssVars} />}
      </div>
    </>
  );
}
