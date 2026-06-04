"use client";

import { useState } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import {
  OptionText,
  OptionSelect,
  OptionToggle,
  OptionColor,
} from "@/components/ui/PanelControls";
import { safeDatasets } from "./layout";
import type { ChartDataset } from "./layout";

// ── Constants ─────────────────────────────────────────────────────────────────

const CHART_TYPE_OPTIONS = [
  { value: "bar",           label: "Bar" },
  { value: "horizontalBar", label: "Horizontal Bar" },
  { value: "line",          label: "Line" },
  { value: "pie",           label: "Pie" },
  { value: "doughnut",      label: "Doughnut" },
  { value: "polarArea",     label: "Polar Area" },
  { value: "radar",         label: "Radar" },
] as const;

const LEGEND_OPTIONS = [
  { value: "off",    label: "Off" },
  { value: "top",    label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left",   label: "Left" },
  { value: "right",  label: "Right" },
] as const;

const BORDER_TYPE_OPTIONS = [
  { value: "smooth",   label: "Smooth (curved)" },
  { value: "straight", label: "Straight" },
  { value: "stepped",  label: "Stepped" },
] as const;

const FILL_OPTIONS = [
  { value: "false",  label: "None" },
  { value: "origin", label: "Origin" },
  { value: "start",  label: "Start" },
  { value: "end",    label: "End" },
] as const;

const POINT_STYLE_OPTIONS = [
  { value: "circle",       label: "Circle" },
  { value: "cross",        label: "Cross" },
  { value: "crossRot",     label: "Cross (rotated)" },
  { value: "dash",         label: "Dash" },
  { value: "line",         label: "Line" },
  { value: "rect",         label: "Square" },
  { value: "rectRounded",  label: "Square (rounded)" },
  { value: "rectRot",      label: "Diamond" },
  { value: "star",         label: "Star" },
  { value: "triangle",     label: "Triangle" },
] as const;

// Default color palette for new datasets
const PALETTE = [
  { bg: "rgba(99,102,241,0.7)",  border: "rgba(99,102,241,1)" },
  { bg: "rgba(236,72,153,0.7)",  border: "rgba(236,72,153,1)" },
  { bg: "rgba(34,197,94,0.7)",   border: "rgba(34,197,94,1)" },
  { bg: "rgba(234,179,8,0.7)",   border: "rgba(234,179,8,1)" },
  { bg: "rgba(239,68,68,0.7)",   border: "rgba(239,68,68,1)" },
  { bg: "rgba(14,165,233,0.7)",  border: "rgba(14,165,233,1)" },
  { bg: "rgba(168,85,247,0.7)",  border: "rgba(168,85,247,1)" },
  { bg: "rgba(249,115,22,0.7)",  border: "rgba(249,115,22,1)" },
];

function str(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

// ── Dataset editor ────────────────────────────────────────────────────────────

function DatasetEditor({
  dataset,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  dataset: ChartDataset;
  index: number;
  onUpdate: (ds: ChartDataset) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);

  const swatchColor = dataset.backgroundColor || PALETTE[index % PALETTE.length].bg;

  return (
    <div className="rounded border border-zinc-300 bg-white">
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        {/* Color swatch */}
        <span
          className="h-3 w-3 shrink-0 rounded-full border border-zinc-300"
          style={{ background: swatchColor }}
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-1.5 text-left"
          aria-expanded={open}
        >
          <span
            className={`text-[10px] text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
            aria-hidden="true"
          >
            ▶
          </span>
          <span className="flex-1 truncate text-xs font-medium text-zinc-700">
            {dataset.label || `Dataset ${index + 1}`}
          </span>
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Move up"
            disabled={isFirst}
            onClick={onMoveUp}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            title="Move down"
            disabled={isLast}
            onClick={onMoveDown}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            title="Remove dataset"
            onClick={onRemove}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-zinc-400 hover:bg-red-50 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Fields */}
      {open && (
        <div className="space-y-2 border-t border-zinc-300 px-2.5 py-2.5">
          {/* Label */}
          <OptionText
            label="Label"
            value={dataset.label}
            onChange={(v) => onUpdate({ ...dataset, label: v })}
            placeholder="Dataset name"
          />

          {/* Values */}
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              Values <span className="text-zinc-400">(comma-separated numbers)</span>
            </label>
            <textarea
              value={dataset.values}
              onChange={(e) => onUpdate({ ...dataset, values: e.target.value })}
              placeholder="30,50,40,60,70"
              rows={2}
              className="w-full resize-none rounded border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Colors */}
          <OptionColor
            label="Background color"
            value={dataset.backgroundColor}
            onChange={(v) => onUpdate({ ...dataset, backgroundColor: v })}
          />
          <OptionColor
            label="Border / line color"
            value={dataset.borderColor}
            onChange={(v) => onUpdate({ ...dataset, borderColor: v })}
          />
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function ChartPanelControls({ data, onChange }: PanelControlProps) {
  const datasets  = safeDatasets(data.datasets);
  const chartType = str(data.chartType) || "bar";
  const isLine    = chartType === "line";
  const isCircular = ["pie", "doughnut", "polarArea"].includes(chartType);

  function set(key: string, value: unknown) {
    onChange({ ...data, [key]: value });
  }

  function updateDataset(idx: number, updated: ChartDataset) {
    set("datasets", datasets.map((d, i) => (i === idx ? updated : d)));
  }

  function removeDataset(idx: number) {
    set("datasets", datasets.filter((_, i) => i !== idx));
  }

  function moveDataset(idx: number, dir: -1 | 1) {
    const next = [...datasets];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    set("datasets", next);
  }

  function addDataset() {
    const colors = PALETTE[datasets.length % PALETTE.length];
    set("datasets", [
      ...datasets,
      {
        id:              `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label:           `Dataset ${datasets.length + 1}`,
        values:          "",
        backgroundColor: colors.bg,
        borderColor:     colors.border,
      },
    ]);
  }

  return (
    <>
      {/* ── Datasets ─────────────────────────────────────────── */}
      <PanelSection title="Datasets">
        {isCircular && (
          <p className="mb-2 text-[11px] text-zinc-400">
            For pie/doughnut/polar charts, add one dataset per slice.
          </p>
        )}
        <div className="space-y-1.5">
          {datasets.map((ds, i) => (
            <DatasetEditor
              key={ds.id}
              dataset={ds}
              index={i}
              onUpdate={(updated) => updateDataset(i, updated)}
              onRemove={() => removeDataset(i)}
              onMoveUp={() => moveDataset(i, -1)}
              onMoveDown={() => moveDataset(i, 1)}
              isFirst={i === 0}
              isLast={i === datasets.length - 1}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addDataset}
          className="mt-2 w-full rounded border border-dashed border-zinc-300 py-1.5 text-xs text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
        >
          + Add Dataset
        </button>
      </PanelSection>

      {/* ── Chart ────────────────────────────────────────────── */}
      <PanelSection title="Chart">
        <OptionText
          label="Title"
          value={str(data.title)}
          onChange={(v) => set("title", v)}
          placeholder="Chart title"
        />
        <OptionSelect
          label="Chart type"
          value={chartType}
          onChange={(v) => set("chartType", v)}
          options={CHART_TYPE_OPTIONS}
        />
        {!isCircular && (
          <>
            <OptionText
              label="Category labels (comma-separated)"
              value={str(data.xAxisLabels)}
              onChange={(v) => set("xAxisLabels", v)}
              placeholder="Jan,Feb,Mar,Apr,May"
            />
            <OptionText
              label="X-axis title"
              value={str(data.xAxisLabel)}
              onChange={(v) => set("xAxisLabel", v)}
              placeholder="Month"
            />
            <OptionText
              label="Y-axis title"
              value={str(data.yAxisLabel)}
              onChange={(v) => set("yAxisLabel", v)}
              placeholder="Value"
            />
          </>
        )}
        {isCircular && (
          <OptionText
            label="Slice labels (comma-separated)"
            value={str(data.xAxisLabels)}
            onChange={(v) => set("xAxisLabels", v)}
            placeholder="Slice A,Slice B,Slice C"
          />
        )}
      </PanelSection>

      {/* ── Legend ───────────────────────────────────────────── */}
      <PanelSection title="Legend">
        <OptionSelect
          label="Position"
          value={str(data.legendPosition) || "top"}
          onChange={(v) => set("legendPosition", v)}
          options={LEGEND_OPTIONS}
        />
      </PanelSection>

      {/* ── Line style (line charts only) ────────────────────── */}
      {isLine && (
        <PanelSection title="Line Style">
          <OptionSelect
            label="Line type"
            value={str(data.borderType) || "smooth"}
            onChange={(v) => set("borderType", v)}
            options={BORDER_TYPE_OPTIONS}
          />
          <OptionSelect
            label="Fill area"
            value={str(data.chartFill) || "false"}
            onChange={(v) => set("chartFill", v)}
            options={FILL_OPTIONS}
          />
          <OptionSelect
            label="Point style"
            value={str(data.pointStyle) || "circle"}
            onChange={(v) => set("pointStyle", v)}
            options={POINT_STYLE_OPTIONS}
          />
          <OptionText
            label="Point size (px)"
            value={str(data.pointSize)}
            onChange={(v) => set("pointSize", v)}
            placeholder="3"
            type="number"
          />
          <OptionColor
            label="Point background"
            value={str(data.pointBgColor)}
            onChange={(v) => set("pointBgColor", v)}
          />
          <OptionColor
            label="Point border"
            value={str(data.pointBorderColor)}
            onChange={(v) => set("pointBorderColor", v)}
          />
        </PanelSection>
      )}

      {/* ── Appearance ───────────────────────────────────────── */}
      <PanelSection title="Appearance">
        <OptionText
          label="Border / line width (px)"
          value={str(data.borderSize)}
          onChange={(v) => set("borderSize", v)}
          placeholder="2"
          type="number"
        />
        <OptionToggle
          label="Show axis tick labels"
          checked={data.showAxisTicks === true}
          onChange={(v) => set("showAxisTicks", v)}
        />
        <OptionToggle
          label="Show tooltips"
          checked={data.showTooltips !== false}
          onChange={(v) => set("showTooltips", v)}
        />
        <OptionColor
          label="Canvas background"
          value={str(data.chartBgColor)}
          onChange={(v) => set("chartBgColor", v)}
        />
        <OptionColor
          label="Axis text color"
          value={str(data.axisTextColor)}
          onChange={(v) => set("axisTextColor", v)}
        />
        <OptionColor
          label="Gridline color"
          value={str(data.gridlineColor)}
          onChange={(v) => set("gridlineColor", v)}
        />
      </PanelSection>
    </>
  );
}
