"use client";

import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import {
  OptionColor,
  OptionToggle,
  OptionSegment,
  OptionText,
  OptionSelect,
} from "@/components/ui/PanelControls";

const LANGUAGES = [
  { value: "",            label: "Plain text" },
  { value: "javascript",  label: "JavaScript" },
  { value: "typescript",  label: "TypeScript" },
  { value: "jsx",         label: "JSX" },
  { value: "tsx",         label: "TSX" },
  { value: "html",        label: "HTML" },
  { value: "xml",         label: "XML" },
  { value: "css",         label: "CSS" },
  { value: "scss",        label: "SCSS" },
  { value: "php",         label: "PHP" },
  { value: "python",      label: "Python" },
  { value: "bash",        label: "Bash / Shell" },
  { value: "json",        label: "JSON" },
  { value: "sql",         label: "SQL" },
  { value: "java",        label: "Java" },
  { value: "c",           label: "C" },
  { value: "cpp",         label: "C++" },
  { value: "csharp",      label: "C#" },
  { value: "go",          label: "Go" },
  { value: "rust",        label: "Rust" },
  { value: "ruby",        label: "Ruby" },
  { value: "kotlin",      label: "Kotlin" },
  { value: "swift",       label: "Swift" },
  { value: "yaml",        label: "YAML" },
  { value: "markdown",    label: "Markdown" },
];

const THEMES = [
  { value: "default",      label: "Light 1" },
  { value: "elegant",      label: "Light 2" },
  { value: "hopscotch",    label: "Dark 1" },
  { value: "oceanic-next", label: "Dark 2" },
];

// ── Panel ─────────────────────────────────────────────────────────────────────

export function SyntaxHighlighterPanelControls({ data, onChange }: PanelControlProps) {
  const hasBorder  = (data.borderStyle as string) && data.borderStyle !== "none";
  const copyButton = data.copyButton !== false;

  return (
    <div className="space-y-5">

      {/* ── Code ──────────────────────────────────────────────────── */}
      <PanelSection title="Code">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Code</label>
            <textarea
              rows={8}
              value={(data.code as string) ?? ""}
              onChange={(e) => onChange({ ...data, code: e.target.value })}
              spellCheck={false}
              className="w-full resize-y rounded border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              placeholder="Paste your code here…"
            />
          </div>
          <OptionSelect
            label="Language"
            value={(data.language as string) ?? ""}
            options={LANGUAGES}
            onChange={(v) => onChange({ ...data, language: v })}
          />
        </div>
      </PanelSection>

      {/* ── Appearance ────────────────────────────────────────────── */}
      <PanelSection title="Appearance">
        <div className="space-y-3">
          <OptionSegment
            label="Theme"
            value={(data.theme as string) || "default"}
            options={THEMES}
            onChange={(v) => onChange({ ...data, theme: v })}
          />
          <OptionToggle
            label="Line numbers"
            checked={data.lineNumbers !== false}
            onChange={(v) => onChange({ ...data, lineNumbers: v })}
          />
          <OptionToggle
            label="Line wrap"
            checked={data.lineWrap === true}
            onChange={(v) => onChange({ ...data, lineWrap: v })}
          />
          <OptionText
            label="Font size"
            value={(data.fontSize as string) ?? ""}
            placeholder="0.875rem"
            mono
            onChange={(v) => onChange({ ...data, fontSize: v })}
          />
          <OptionColor
            label="Background override"
            value={(data.bgColor as string) ?? ""}
            onChange={(v) => onChange({ ...data, bgColor: v })}
          />
        </div>
      </PanelSection>

      {/* ── Copy button ───────────────────────────────────────────── */}
      <PanelSection title="Copy button">
        <div className="space-y-3">
          <OptionToggle
            label="Show copy button"
            checked={copyButton}
            onChange={(v) => onChange({ ...data, copyButton: v })}
          />
          {copyButton && (
            <OptionText
              label="Button label"
              value={(data.copyText as string) ?? ""}
              placeholder="Copy"
              onChange={(v) => onChange({ ...data, copyText: v })}
            />
          )}
        </div>
      </PanelSection>

      {/* ── Border ────────────────────────────────────────────────── */}
      <PanelSection title="Border">
        <div className="space-y-3">
          <OptionSelect
            label="Style"
            value={(data.borderStyle as string) || "none"}
            options={["none", "solid", "dashed", "dotted"].map((s) => ({ value: s, label: s }))}
            onChange={(v) => onChange({ ...data, borderStyle: v })}
          />
          {hasBorder && (
            <>
              <OptionText
                label="Width"
                value={(data.borderSize as string) ?? ""}
                placeholder="1px"
                mono
                onChange={(v) => onChange({ ...data, borderSize: v })}
              />
              <OptionColor
                label="Color"
                value={(data.borderColor as string) ?? ""}
                onChange={(v) => onChange({ ...data, borderColor: v })}
              />
            </>
          )}
        </div>
      </PanelSection>

    </div>
  );
}
