"use client";

import { useState } from "react";
import { PanelSection } from "@/components/ui/PanelSection";
import type { PanelControlProps } from "@/lib/block-types";
import { OptionColor, OptionToggle, OptionSegment, OptionText } from "@/components/ui/PanelControls";
import { ALL_NETWORKS, NETWORK_META } from "./icons";
import type { NetworkKey, CustomNetworkDef } from "./icons";

// ── Panel ─────────────────────────────────────────────────────────────────────

export function SocialSharingPanelControls({ data, onChange }: PanelControlProps) {
  const networks = Array.isArray(data.networks) ? (data.networks as string[]) : [];
  const customNetworks: CustomNetworkDef[] = Array.isArray(data.customNetworks)
    ? (data.customNetworks as CustomNetworkDef[])
    : [];
  const colorType = (data.colorType as string) || "brand";
  const iconsBoxed = Boolean(data.iconsBoxed);
  const taglinePlacement = (data.taglinePlacement as string) || "before";
  const alignment = (data.alignment as string) || "flex-start";
  const taglineTag = (data.taglineTag as string) || "h4";

  // ── Custom network add form state ─────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#555555");
  const [newTemplate, setNewTemplate] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  function toggleNetwork(key: string) {
    const next = networks.includes(key)
      ? networks.filter((n) => n !== key)
      : [...networks, key];
    onChange({ ...data, networks: next });
  }

  function addCustomNetwork() {
    if (!newLabel.trim() || !newTemplate.trim()) return;
    const id = `custom_${Date.now()}`;
    const newCustom: CustomNetworkDef = {
      id,
      label: newLabel.trim(),
      color: newColor,
      shareUrlTemplate: newTemplate.trim(),
      ...(newLogoUrl.trim() ? { logoUrl: newLogoUrl.trim() } : {}),
    };
    const updatedCustoms = [...customNetworks, newCustom];
    const updatedNetworks = [...networks, id];
    onChange({ ...data, customNetworks: updatedCustoms, networks: updatedNetworks });
    setNewLabel("");
    setNewColor("#555555");
    setNewTemplate("");
    setNewLogoUrl("");
    setAddOpen(false);
  }

  function saveEditCustomNetwork(id: string, patch: Partial<CustomNetworkDef>) {
    const updated = customNetworks.map((c) =>
      c.id === id ? { ...c, ...patch } : c,
    );
    onChange({ ...data, customNetworks: updated });
  }

  function removeCustomNetwork(id: string) {
    const updatedCustoms = customNetworks.filter((c) => c.id !== id);
    const updatedNetworks = networks.filter((n) => n !== id);
    onChange({ ...data, customNetworks: updatedCustoms, networks: updatedNetworks });
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="space-y-5">

      {/* ── Networks ─────────────────────────────────────────────────── */}
      <PanelSection title="Networks">
        {/* Built-in network icon grid */}
        <div className="flex flex-wrap gap-1.5">
          {ALL_NETWORKS.map((key) => {
            const active = networks.includes(key);
            const meta = NETWORK_META[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleNetwork(key)}
                title={meta.label}
                aria-label={meta.label}
                aria-pressed={active}
                className={`inline-flex h-8 w-8 items-center justify-center rounded border transition ${
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-700"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill={meta.renderAs === "stroke" ? "none" : "currentColor"}
                  stroke={meta.renderAs === "stroke" ? "currentColor" : "none"}
                  strokeWidth={meta.renderAs === "stroke" ? "2" : undefined}
                  strokeLinecap={meta.renderAs === "stroke" ? "round" : undefined}
                  strokeLinejoin={meta.renderAs === "stroke" ? "round" : undefined}
                  aria-hidden="true"
                >
                  <path d={meta.svgPath} />
                </svg>
              </button>
            );
          })}
        </div>

        {/* Custom networks */}
        {customNetworks.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Custom</p>
            {customNetworks.map((custom) => {
              const active = networks.includes(custom.id);
              const isEditing = editingId === custom.id;
              return (
                <div key={custom.id} className="rounded border border-zinc-200 bg-zinc-50">
                  {/* Row */}
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    {/* Color swatch / toggle */}
                    <button
                      type="button"
                      onClick={() => toggleNetwork(custom.id)}
                      title={active ? `Remove ${custom.label}` : `Add ${custom.label}`}
                      aria-label={active ? `Remove ${custom.label}` : `Add ${custom.label}`}
                      aria-pressed={active}
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border-2 transition ${
                        active ? "opacity-100" : "opacity-40"
                      }`}
                      style={{ backgroundColor: custom.color, borderColor: custom.color }}
                    >
                      {custom.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={custom.logoUrl} alt={custom.label} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-white text-[10px] font-bold">
                          {custom.label.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "?"}
                        </span>
                      )}
                    </button>
                    <span className="flex-1 truncate text-xs font-medium text-zinc-700">{custom.label}</span>
                    <button
                      type="button"
                      onClick={() => setEditingId(isEditing ? null : custom.id)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-700"
                      title="Edit"
                    >
                      {isEditing ? "Done" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCustomNetwork(custom.id)}
                      className="text-[11px] text-zinc-400 hover:text-red-500"
                      title={`Remove ${custom.label}`}
                    >
                      ✕
                    </button>
                  </div>
                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="border-t border-zinc-200 px-2 pb-2 pt-2 space-y-2">
                      <div>
                        <label className="mb-0.5 block text-[11px] text-zinc-500">Label</label>
                        <input
                          type="text"
                          value={custom.label}
                          onChange={(e) => saveEditCustomNetwork(custom.id, { label: e.target.value })}
                          className="w-full rounded border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-zinc-500 shrink-0">Color</label>
                        <input
                          type="color"
                          value={custom.color}
                          onChange={(e) => saveEditCustomNetwork(custom.id, { color: e.target.value })}
                          className="h-6 w-6 cursor-pointer rounded border border-zinc-200 bg-transparent p-0.5"
                        />
                        <input
                          type="text"
                          value={custom.color}
                          onChange={(e) => saveEditCustomNetwork(custom.id, { color: e.target.value })}
                          className="flex-1 rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[11px] text-zinc-500">Share URL template</label>
                        <input
                          type="text"
                          value={custom.shareUrlTemplate}
                          onChange={(e) => saveEditCustomNetwork(custom.id, { shareUrlTemplate: e.target.value })}
                          className="w-full rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          placeholder="https://…?url={URL}&title={TITLE}"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[11px] text-zinc-500">Logo URL <span className="text-zinc-400">(optional)</span></label>
                        <input
                          type="url"
                          value={custom.logoUrl ?? ""}
                          onChange={(e) =>
                            saveEditCustomNetwork(custom.id, {
                              logoUrl: e.target.value || undefined,
                            })
                          }
                          className="w-full rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          placeholder="https://…/logo.svg"
                        />
                        {custom.logoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={custom.logoUrl} alt="Logo preview" className="mt-1 h-8 w-8 rounded object-contain" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add custom network */}
        {addOpen ? (
          <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 p-2 space-y-2">
            <p className="text-[11px] font-medium text-zinc-600">New custom network</p>
            <div>
              <label className="mb-0.5 block text-[11px] text-zinc-500">Label</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Hacker News"
                className="w-full rounded border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-zinc-500 shrink-0">Color</label>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-6 w-6 cursor-pointer rounded border border-zinc-200 bg-transparent p-0.5"
              />
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="flex-1 rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[11px] text-zinc-500">Share URL template</label>
              <input
                type="text"
                value={newTemplate}
                onChange={(e) => setNewTemplate(e.target.value)}
                placeholder="https://…?url={URL}&title={TITLE}&desc={DESC}"
                className="w-full rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <p className="mt-1 text-[10px] text-zinc-400">
                Placeholders: <code>{"{URL}"}</code> <code>{"{TITLE}"}</code> <code>{"{DESC}"}</code>
              </p>            </div>
            <div>
              <label className="mb-0.5 block text-[11px] text-zinc-500">Logo URL <span className="text-zinc-400">(optional)</span></label>
              <input
                type="url"
                value={newLogoUrl}
                onChange={(e) => setNewLogoUrl(e.target.value)}
                placeholder="https://…/logo.svg"
                className="w-full rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              {newLogoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={newLogoUrl} alt="Logo preview" className="mt-1 h-8 w-8 rounded object-contain" />
              )}            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addCustomNetwork}
                disabled={!newLabel.trim() || !newTemplate.trim()}
                className="flex-1 rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setAddOpen(false); setNewLabel(""); setNewColor("#555555"); setNewTemplate(""); setNewLogoUrl(""); }}
                className="rounded border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:border-zinc-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-2 w-full rounded border border-dashed border-zinc-300 py-1.5 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
          >
            + Add custom network
          </button>
        )}
      </PanelSection>

      {/* ── Tagline ──────────────────────────────────────────────────── */}
      <PanelSection title="Tagline">
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Text</label>
            <input
              type="text"
              aria-label="Tagline text"
              value={(data.tagline as string) ?? ""}
              placeholder="Share this:"
              onChange={(e) => onChange({ ...data, tagline: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
          <OptionSegment
            label="Heading level"
            value={taglineTag}
            options={(["h1","h2","h3","h4","h5","h6"] as const).map((t) => ({ value: t, label: t.toUpperCase() }))}
            onChange={(v) => onChange({ ...data, taglineTag: v })}
          />
          <OptionSegment
            label="Placement"
            value={taglinePlacement}
            options={[
              { value: "before", label: "Before" },
              { value: "after",  label: "After" },
            ]}
            onChange={(v) => onChange({ ...data, taglinePlacement: v })}
          />
        </div>
      </PanelSection>

      {/* ── Icon Style ───────────────────────────────────────────────── */}
      <PanelSection title="Icon Style">
        <div className="space-y-3">
          <OptionSegment
            label="Color mode"
            value={colorType}
            options={[
              { value: "brand",  label: "Brand" },
              { value: "custom", label: "Custom" },
            ]}
            onChange={(v) => onChange({ ...data, colorType: v })}
          />

          {/* Custom colors — only shown when colorType = custom */}
          {colorType === "custom" && (
            <>
              <OptionColor label="Icon color" value={(data.iconColor as string) ?? ""} onChange={(v) => onChange({ ...data, iconColor: v })} />
              {iconsBoxed && (
                <OptionColor label="Box color" value={(data.boxColor as string) ?? ""} onChange={(v) => onChange({ ...data, boxColor: v })} />
              )}
            </>
          )}

          <OptionText
            label="Icon size"
            value={(data.iconSize as string) ?? ""}
            placeholder="20px"
            mono
            onChange={(v) => onChange({ ...data, iconSize: v })}
          />

          <OptionToggle
            label="Boxed icons"
            checked={iconsBoxed}
            onChange={(v) => onChange({ ...data, iconsBoxed: v })}
          />

          {iconsBoxed && (
            <OptionText
              label="Box radius"
              value={(data.iconsBoxedRadius as string) ?? ""}
              placeholder="4px or round"
              mono
              onChange={(v) => onChange({ ...data, iconsBoxedRadius: v })}
            />
          )}
        </div>
      </PanelSection>

      {/* ── Layout ───────────────────────────────────────────────────── */}
      <PanelSection title="Layout">
        <div className="space-y-3">
          {/* Alignment */}
          <OptionSegment
            label="Alignment"
            value={alignment}
            options={[
              { value: "flex-start",    label: "Left" },
              { value: "center",        label: "Center" },
              { value: "flex-end",      label: "Right" },
              { value: "space-between", label: "Spread" },
            ]}
            onChange={(v) => onChange({ ...data, alignment: v })}
            wrap
          />

        </div>
      </PanelSection>

      {/* ── Share URL overrides ───────────────────────────────────────── */}
      <PanelSection title="Override URL / Title">
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-400">
            Leave blank to automatically use the current page URL and title.
          </p>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">URL to share</label>
            <input
              type="url"
              aria-label="URL to share"
              value={(data.url as string) ?? ""}
              placeholder="https://…"
              onChange={(e) => onChange({ ...data, url: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Title</label>
            <input
              type="text"
              aria-label="Share title"
              value={(data.title as string) ?? ""}
              placeholder="Page title…"
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Description</label>
            <textarea
              aria-label="Share description"
              value={(data.description as string) ?? ""}
              placeholder="Optional description for some networks…"
              rows={3}
              onChange={(e) => onChange({ ...data, description: e.target.value })}
              className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
        </div>
      </PanelSection>

    </div>
  );
}
