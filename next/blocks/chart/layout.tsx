"use client";

import { useEffect, useRef } from "react";
import type { Chart as ChartJS, ChartConfiguration } from "chart.js";
import type { BlockLayoutProps } from "@/lib/block-types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChartDataset {
  id: string;
  label: string;
  values: string;           // comma-separated numbers
  backgroundColor: string;
  borderColor: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function safeDatasets(raw: unknown): ChartDataset[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is ChartDataset => x !== null && typeof x === "object");
}

function parseValues(s: string): number[] {
  return s
    .split(",")
    .map((v) => parseFloat(v.trim()))
    .filter((n) => !isNaN(n));
}

function parseLabels(s: string): string[] {
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const CIRCULAR_TYPES = new Set(["pie", "doughnut", "polarArea"]);



// ── Layout ────────────────────────────────────────────────────────────────────

export default function ChartLayout({ data, blockId }: BlockLayoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<ChartJS | null>(null);

  // Read all data props (stable snapshot used inside the effect via JSON.stringify)
  const title          = (data.title         as string) || "";
  const chartBgColor   = (data.chartBgColor  as string) || "";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);

      if (cancelled || !canvasRef.current) return;

      // Destroy previous instance before creating a new one
      chartRef.current?.destroy();
      chartRef.current = null;

      // ── Config extraction ──────────────────────────────────────────────────
      const chartType     = (data.chartType      as string) || "bar";
      const datasets      = safeDatasets(data.datasets);
      const xAxisLabels   = parseLabels((data.xAxisLabels  as string) || "");
      const xAxisLabel    = (data.xAxisLabel     as string) || "";
      const yAxisLabel    = (data.yAxisLabel     as string) || "";
      const legendPos     = (data.legendPosition as string) || "top";
      const showTooltips  = data.showTooltips !== false;
      const borderSize    = Number(data.borderSize)  || 2;
      const borderType    = (data.borderType     as string) || "smooth";
      const chartFill     = (data.chartFill      as string) || "false";
      const pointStyle    = (data.pointStyle     as string) || "circle";
      const pointSize     = data.pointSize ? Number(data.pointSize) : undefined;
      const pointBgColor       = (data.pointBgColor      as string) || undefined;
      const pointBorderColor   = (data.pointBorderColor  as string) || undefined;
      const axisTextColor = (data.axisTextColor  as string) || undefined;
      const gridlineColor = (data.gridlineColor  as string) || undefined;

      const showAxisTicks = data.showAxisTicks === true;

      const isCircular   = CIRCULAR_TYPES.has(chartType);
      const isRadar      = chartType === "radar";
      const isHorizontal = chartType === "horizontalBar";
      const type         = isHorizontal ? "bar" : chartType;

      // ── Line options ───────────────────────────────────────────────────────
      const tension = borderType === "smooth" ? 0.4 : 0;
      const stepped = borderType === "stepped";
      const fill    = chartFill === "false" ? false : (chartFill as "start" | "end" | "origin");

      // ── Build datasets ─────────────────────────────────────────────────────
      const chartDatasets = datasets.map((ds) => {
        const values = parseValues(ds.values);

        const base: Record<string, unknown> = {
          label:       ds.label || " ",
          data:        values,
          borderWidth: borderSize,
        };

        {
          base.backgroundColor = ds.backgroundColor || "rgba(99,102,241,0.7)";
          base.borderColor     = ds.borderColor     || "rgba(99,102,241,1)";

          if (type === "line") {
            base.tension = tension;
            base.fill    = fill;
            if (stepped)                     base.stepped              = true;
            base.pointStyle                = pointStyle;
            if (pointSize !== undefined)     base.pointRadius          = pointSize;
            if (pointBgColor)                base.pointBackgroundColor = pointBgColor;
            if (pointBorderColor)            base.pointBorderColor     = pointBorderColor;
          }
        }

        return base;
      });

      // ── Scales ────────────────────────────────────────────────────────────
      const scales: ChartConfiguration["options"]["scales"] = isCircular
        ? {}
        : isRadar
        ? {
            r: {
              ticks: { display: showAxisTicks, color: axisTextColor },
              grid:  { color: gridlineColor },
              pointLabels: { color: axisTextColor },
            },
          }
        : {
            x: {
              title: {
                display: !!xAxisLabel,
                text:    xAxisLabel,
                color:   axisTextColor,
              },
              ticks: { display: showAxisTicks, color: axisTextColor },
              grid:  { color: gridlineColor },
            },
            y: {
              title: {
                display: !!yAxisLabel,
                text:    yAxisLabel,
                color:   axisTextColor,
              },
              ticks: { display: showAxisTicks, color: axisTextColor },
              grid:  { color: gridlineColor },
            },
          };

      // ── Chart.js config ────────────────────────────────────────────────────
      const config: ChartConfiguration = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: type as any,
        data: {
          labels:   xAxisLabels,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          datasets: chartDatasets as any,
        },
        options: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          indexAxis: (isHorizontal ? "y" : "x") as any,
          responsive:          true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display:  legendPos !== "off",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              position: (legendPos !== "off" ? legendPos : "top") as any,
            },
            tooltip: {
              enabled: showTooltips,
            },
          },
          scales,
        },
      };

      chartRef.current = new Chart(canvasRef.current!, config);
    })();

    return () => {
      cancelled = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  const datasets = safeDatasets(data.datasets);

  return (
    <div data-block-id={blockId} className={`awb-chart block-${blockId}`}>
      {title && (
        <h4 className="mb-3 text-center text-base font-semibold text-zinc-800">
          {title}
        </h4>
      )}

      <div style={{ position: "relative", width: "100%" }}>
        <canvas
          ref={canvasRef}
          style={{
            borderRadius: "4px",
            background:   chartBgColor || "transparent",
          }}
        />
      </div>

      {/* Empty state hint */}
      {datasets.length === 0 && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-xs text-zinc-500">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="2" y="14" width="4" height="8" rx="1"/>
            <rect x="9" y="9"  width="4" height="13" rx="1"/>
            <rect x="16" y="5" width="4" height="17" rx="1"/>
            <line x1="2" y1="22" x2="22" y2="22"/>
          </svg>
          Chart — add datasets in the panel to get started.
        </div>
      )}
    </div>
  );
}
